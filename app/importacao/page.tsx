'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { stageV2Csv, type V2CsvImportResult, type V2StagedRow } from '@/lib/v2-csv-import'
import type { FinancialEntry, ImportBatch } from '@/lib/v2-data-model'
import { persistApprovedBatch, commitV2Persistence } from '@/lib/v2-persistence'
import { makeEntryId, readV2BrowserStore, writeV2BrowserStore } from '@/lib/v2-browser-storage'

const brl = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
  ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'

function detectDelimiter(text: string): ',' | ';' {
  const header = text.split(/\r?\n/).find((line) => line.trim()) ?? ''
  return (header.match(/;/g)?.length ?? 0) > (header.match(/,/g)?.length ?? 0) ? ';' : ','
}

function downloadRejections(result: V2CsvImportResult) {
  const lines = ['linha,campo,codigo,mensagem']
  result.rows.filter((row) => !row.accepted).forEach((row) => row.issues.forEach((issue) => {
    lines.push([row.rowNumber, issue.field, issue.code, issue.message].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
  }))
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = 'relatorio-rejeicoes-v2.csv'; anchor.click(); URL.revokeObjectURL(url)
}

function statusLabel(result: V2CsvImportResult | null, stagingReady: boolean) {
  if (stagingReady) return 'Staging persistido'
  if (!result) return 'Aguardando arquivo'
  if (result.rowsRejected === 0) return 'Lote válido'
  if (result.rowsAccepted > 0) return 'Concluído com rejeições'
  return 'Lote rejeitado'
}

export default function ImportacaoPage() {
  const [fileName, setFileName] = useState('')
  const [delimiter, setDelimiter] = useState<'auto' | ',' | ';'>('auto')
  const [detectedDelimiter, setDetectedDelimiter] = useState<',' | ';'>(',')
  const [result, setResult] = useState<V2CsvImportResult | null>(null)
  const [stagingReady, setStagingReady] = useState(false)
  const [persistedCount, setPersistedCount] = useState(() => readV2BrowserStore().entries.length)
  const [persistenceMessage, setPersistenceMessage] = useState('')

  const preview = useMemo(() => result?.rows.slice(0, 10) ?? [], [result])

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const detected = detectDelimiter(text)
    const chosen = delimiter === 'auto' ? detected : delimiter
    setDetectedDelimiter(detected)
    setFileName(file.name)
    setResult(stageV2Csv(text, chosen))
    setStagingReady(false)
    setPersistenceMessage('')
  }

  function prepareStaging() {
    if (!result || result.rowsAccepted === 0) return
    const batchId = `csv-${Date.now()}`
    const approvedEntries = result.rows.filter((row) => row.accepted).map((row: V2StagedRow) => ({
      ...row.entry,
      id: makeEntryId(batchId, row.rowNumber),
      importedAt: new Date().toISOString(),
    })) as FinancialEntry[]
    const batch: ImportBatch = {
      id: batchId, companyId: String(approvedEntries[0]?.companyId ?? ''), source: 'csv', fileName,
      importedAt: new Date().toISOString(), rowsReceived: result.rowsReceived, rowsAccepted: result.rowsAccepted,
      rowsRejected: result.rowsRejected, status: 'processing',
    }
    const store = readV2BrowserStore()
    const persisted = persistApprovedBatch(store, { batch, entries: approvedEntries })
    const nextStore = commitV2Persistence(store, persisted)
    writeV2BrowserStore(nextStore)
    setPersistedCount(nextStore.entries.length)
    setStagingReady(persisted.entries.length > 0)
    setPersistenceMessage(persisted.duplicateExternalIds.length
      ? `${persisted.entries.length} linha(s) gravada(s); ${persisted.duplicateExternalIds.length} duplicidade(s) bloqueada(s).`
      : `${persisted.entries.length} linha(s) gravada(s) no staging V2.`)
  }

  return (
    <main className="content">
      <section className="panel"><div className="toolbar"><div><span className="eyebrow">BASE FINANCEIRA · V2</span><h1>Importação de Dados</h1><p className="muted">CSV → validação → staging. A V1 permanece isolada.</p></div><a className="secondary-btn" href="/">Voltar ao cockpit</a></div></section>
      <section className="cards">
        <div className="card"><span>Linhas recebidas</span><strong>{result?.rowsReceived ?? 0}</strong></div>
        <div className="card"><span>Aprovadas</span><strong>{result?.rowsAccepted ?? 0}</strong></div>
        <div className="card"><span>Rejeitadas</span><strong>{result?.rowsRejected ?? 0}</strong></div>
        <div className="card"><span>Staging V2</span><strong>{persistedCount}</strong><small>{statusLabel(result, stagingReady)}</small></div>
      </section>

      <section className="panel"><div className="toolbar"><div><h2>1. Enviar arquivo</h2><p className="muted">CSV com vírgula ou ponto e vírgula; valores como 1.250,50 são normalizados.</p></div><label className="field compact-field">Delimitador<select value={delimiter} onChange={(e) => setDelimiter(e.target.value as 'auto' | ',' | ';')}><option value="auto">Automático</option><option value=",">Vírgula (,)</option><option value=";">Ponto e vírgula (;)</option></select></label></div><label className="upload-zone"><input type="file" accept=".csv,text/csv" onChange={handleFile}/><strong>{fileName || 'Selecione um arquivo CSV'}</strong><span>{fileName ? `Delimitador detectado: ${detectedDelimiter}` : 'A validação começa após a leitura do arquivo.'}</span></label></section>

      {result && <>
        <section className="panel"><div className="toolbar"><div><h2>2. Pré-visualização e validação</h2><p className="muted">Primeiras 10 linhas do lote, com status individual.</p></div>{result.rowsRejected > 0 && <button className="secondary-btn" onClick={() => downloadRejections(result)}>Baixar rejeições</button>}</div><div className="table-wrap"><table><thead><tr><th>Linha</th><th>Descrição</th><th>Competência</th><th>Valor</th><th>Natureza</th><th>Classe</th><th>Status</th></tr></thead><tbody>{preview.map((row: V2StagedRow) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.entry.description || '—'}</td><td>{row.entry.competence || '—'}</td><td>{brl(row.entry.amount)}</td><td>{row.entry.nature || '—'}</td><td>{row.entry.movementClass || '—'}</td><td><span className={row.accepted ? 'status-ok' : 'status-error'}>{row.accepted ? 'Aprovada' : 'Rejeitada'}</span></td></tr>)}</tbody></table></div></section>
        <section className="panel"><div className="toolbar"><div><h2>3. Inconsistências</h2><p className="muted">Cada rejeição permanece rastreável à linha original.</p></div></div>{result.rowsRejected === 0 ? <div className="note success-note">Nenhuma inconsistência encontrada. O lote está pronto para staging.</div> : <div className="issue-list">{result.rows.filter((row) => !row.accepted).map((row) => <div className="issue-item" key={row.rowNumber}><strong>Linha {row.rowNumber}</strong>{row.issues.map((issue) => <span key={`${issue.code}-${issue.field}`}>{issue.field}: {issue.message}</span>)}</div>)}</div>}</section>
        <section className="panel"><div className="toolbar"><div><h2>4. Staging V2</h2><p className="muted">Somente linhas aprovadas são persistidas no armazenamento local V2. A V1 não é alterada.</p></div><button className="primary-btn" disabled={result.rowsAccepted === 0} onClick={prepareStaging}>Persistir aprovados no staging</button></div>{persistenceMessage && <div className="note success-note">✓ {persistenceMessage}</div>}</section>
      </>}
    </main>
  )
}

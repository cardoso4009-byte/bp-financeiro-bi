'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { stageV2Csv, type V2CsvImportResult, type V2StagedRow } from '@/lib/v2-csv-import'

const brl = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
  ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : '—'

function detectDelimiter(text: string) {
  const header = text.split(/\r?\n/).find((line) => line.trim()) ?? ''
  return (header.match(/;/g)?.length ?? 0) > (header.match(/,/g)?.length ?? 0) ? ';' : ','
}

function downloadRejections(result: V2CsvImportResult) {
  const rejected = result.rows.filter((row) => !row.accepted)
  const lines = ['linha,campo,codigo,mensagem']
  rejected.forEach((row) => row.issues.forEach((issue) => {
    const cells = [row.rowNumber, issue.field, issue.code, issue.message].map((value) => `"${String(value).replaceAll('"', '""')}"`)
    lines.push(cells.join(','))
  }))
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'relatorio-rejeicoes-v2.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

function statusLabel(result: V2CsvImportResult | null) {
  if (!result) return 'Aguardando arquivo'
  if (result.rowsRejected === 0) return 'Lote válido'
  if (result.rowsAccepted > 0) return 'Concluído com rejeições'
  return 'Lote rejeitado'
}

export default function ImportacaoPage() {
  const [fileName, setFileName] = useState('')
  const [delimiter, setDelimiter] = useState<'auto' | ',' | ';'>('auto')
  const [result, setResult] = useState<V2CsvImportResult | null>(null)
  const [stagingReady, setStagingReady] = useState(false)

  const preview = useMemo(() => result?.rows.slice(0, 10) ?? [], [result])
  const effectiveDelimiter = delimiter === 'auto' ? 'auto' : delimiter

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const chosen = delimiter === 'auto' ? detectDelimiter(text) : delimiter
    setFileName(file.name)
    setResult(stageV2Csv(text, chosen))
    setStagingReady(false)
  }

  function handleDelimiterChange(value: 'auto' | ',' | ';') {
    setDelimiter(value)
    if (!result) return
    // A troca de delimitador exige nova leitura do arquivo; o estado anterior é mantido até novo upload.
    setStagingReady(false)
  }

  return (
    <main className="content">
      <section className="panel">
        <div className="toolbar">
          <div>
            <span className="eyebrow">BASE FINANCEIRA · V2</span>
            <h1>Importação de Dados</h1>
            <p className="muted">CSV → validação → staging. Nenhum dado é gravado na base V1 nesta etapa.</p>
          </div>
          <a className="secondary-btn" href="/">Voltar ao cockpit</a>
        </div>
      </section>

      <section className="cards">
        <div className="card"><span>Linhas recebidas</span><strong>{result?.rowsReceived ?? 0}</strong></div>
        <div className="card"><span>Aprovadas</span><strong>{result?.rowsAccepted ?? 0}</strong></div>
        <div className="card"><span>Rejeitadas</span><strong>{result?.rowsRejected ?? 0}</strong></div>
        <div className="card"><span>Status</span><strong>{statusLabel(result)}</strong></div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <div>
            <h2>1. Enviar arquivo</h2>
            <p className="muted">O parser reconhece CSV com vírgula ou ponto e vírgula e valores monetários brasileiros.</p>
          </div>
          <label className="field compact-field">Delimitador
            <select value={delimiter} onChange={(e) => handleDelimiterChange(e.target.value as 'auto' | ',' | ';')}>
              <option value="auto">Automático</option>
              <option value=",">Vírgula (,)</option>
              <option value=";">Ponto e vírgula (;)</option>
            </select>
          </label>
        </div>
        <label className="upload-zone">
          <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          <strong>{fileName || 'Selecione um arquivo CSV'}</strong>
          <span>{fileName ? `Delimitador utilizado: ${effectiveDelimiter === 'auto' ? detectDelimiter('') : effectiveDelimiter}` : 'O arquivo será validado imediatamente após a leitura.'}</span>
        </label>
      </section>

      {result && (
        <>
          <section className="panel">
            <div className="toolbar">
              <div><h2>2. Pré-visualização e validação</h2><p className="muted">Primeiras 10 linhas do lote, com status individual.</p></div>
              {result.rowsRejected > 0 && <button className="secondary-btn" onClick={() => downloadRejections(result)}>Baixar rejeições</button>}
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Linha</th><th>Descrição</th><th>Competência</th><th>Valor</th><th>Natureza</th><th>Classe</th><th>Status</th></tr></thead>
                <tbody>{preview.map((row: V2StagedRow) => (
                  <tr key={row.rowNumber}>
                    <td>{row.rowNumber}</td><td>{row.entry.description || '—'}</td><td>{row.entry.competence || '—'}</td>
                    <td>{brl(row.entry.amount)}</td><td>{row.entry.nature || '—'}</td><td>{row.entry.movementClass || '—'}</td>
                    <td><span className={row.accepted ? 'status-ok' : 'status-error'}>{row.accepted ? 'Aprovada' : 'Rejeitada'}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="toolbar"><div><h2>3. Inconsistências</h2><p className="muted">Cada rejeição permanece rastreável à linha original do arquivo.</p></div></div>
            {result.rowsRejected === 0 ? <div className="note success-note">Nenhuma inconsistência encontrada. O lote está pronto para staging.</div> : (
              <div className="issue-list">{result.rows.filter((row) => !row.accepted).map((row) => (
                <div className="issue-item" key={row.rowNumber}><strong>Linha {row.rowNumber}</strong>{row.issues.map((issue) => <span key={`${issue.code}-${issue.field}`}>{issue.field}: {issue.message}</span>)}</div>
              ))}</div>
            )}
          </section>

          <section className="panel">
            <div className="toolbar"><div><h2>4. Staging</h2><p className="muted">Esta ação prepara apenas as linhas aprovadas. Persistência definitiva será implementada na próxima etapa.</p></div>
              <button className="primary-btn" disabled={result.rowsAccepted === 0} onClick={() => setStagingReady(true)}>Preparar aprovados para staging</button>
            </div>
            {stagingReady && <div className="note success-note">✓ {result.rowsAccepted} linha(s) aprovada(s) preparada(s) para staging local. Nenhum lançamento foi gravado.</div>}
          </section>
        </>
      )}
    </main>
  )
}

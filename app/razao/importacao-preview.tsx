'use client'

import { useMemo, useRef, useState } from 'react'
import { chartOfAccounts, validateJournalEntry, type JournalEntry } from '@/lib/accounting-core'

type Props = { existingEntries: JournalEntry[] }

type ParsedLine = { row: number; entryId: string; date: string; description: string; account: string; debit: number; credit: number; document?: string; competence?: string; costCenter?: string }
type PreviewEntry = { entry: JournalEntry; rowNumbers: number[]; errors: string[]; duplicate: boolean }

const field = (value: string | undefined) => (value ?? '').trim()
const money = (value: string): number => {
  const raw = value.trim().replace(/R\$/gi, '').replace(/\s/g, '')
  if (!raw) return 0
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw
  return Number(normalized)
}
const normalizeDate = (value: string) => {
  const v = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  const match = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  return v
}
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? ''
  const candidates = [',', ';', '\t']
  const delimiter = candidates.sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0]
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (ch === '"') {
      if (quoted && clean[i + 1] === '"') { cell += '"'; i++ }
      else quoted = !quoted
    } else if (ch === delimiter && !quoted) {
      row.push(cell); cell = ''
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(value => value.trim())) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some(value => value.trim())) rows.push(row)
  return rows
}
function canonical(entry: JournalEntry) {
  return JSON.stringify({
    date: entry.date,
    description: entry.description.trim().toLocaleLowerCase('pt-BR'),
    document: (entry.document ?? '').trim().toLocaleLowerCase('pt-BR'),
    lines: [...entry.lines].map(line => ({ account: line.account, debit: Number(line.debit.toFixed(2)), credit: Number(line.credit.toFixed(2)) })).sort((a, b) => a.account.localeCompare(b.account)),
  })
}

export default function RazaoImportacaoPreview({ existingEntries }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [entries, setEntries] = useState<PreviewEntry[]>([])
  const [fileError, setFileError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [fileContentForImport, setFileContentForImport] = useState('')

  const summary = useMemo(() => ({
    total: entries.length,
    valid: entries.filter(item => !item.errors.length && !item.duplicate).length,
    duplicates: entries.filter(item => item.duplicate).length,
    invalid: entries.filter(item => item.errors.length > 0).length,
  }), [entries])

  async function readFile(file?: File) {
    setFileError('')
    setEntries([])
    setLoaded(false)
    setFileName('')
    setImportMessage(null)
    if (!file) return
    if (!file.name.toLocaleLowerCase().endsWith('.csv')) {
      setFileError('Nesta primeira etapa, selecione um arquivo CSV. A leitura de Excel será habilitada na próxima etapa.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('O arquivo ultrapassa o limite de 5 MB.')
      return
    }
    const rawContent = await file.text()
    const rows = parseCsv(rawContent)
    if (rows.length < 2) {
      setFileError('O CSV precisa ter uma linha de cabeçalho e ao menos uma partida.')
      return
    }
    const headers = rows[0].map(value => value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ''))
    const aliases: Record<string, string[]> = {
      id: ['id', 'lancamentoid', 'entryid'],
      date: ['data', 'date'],
      description: ['historico', 'descricao', 'description'],
      account: ['conta', 'codigoconta', 'account', 'accountcode'],
      debit: ['debito', 'debit'],
      credit: ['credito', 'credit'],
      document: ['documento', 'document', 'nf'],
      competence: ['competencia', 'competence'],
      costCenter: ['centrodecusto', 'costcenter'],
    }
    const indexes: Record<string, number> = {}
    for (const [key, names] of Object.entries(aliases)) indexes[key] = headers.findIndex(header => names.includes(header))
    const required = ['id', 'date', 'description', 'account', 'debit', 'credit']
    const missing = required.filter(key => indexes[key] < 0)
    if (missing.length) {
      setFileError(`Cabeçalhos obrigatórios ausentes: ${missing.join(', ')}. Use o modelo CSV disponibilizado nesta tela.`)
      return
    }
    const parseErrors: string[] = []
    const parsed: ParsedLine[] = []
    rows.slice(1).forEach((cells, index) => {
      const rowNumber = index + 2
      const get = (key: string) => indexes[key] < 0 ? '' : field(cells[indexes[key]])
      const entryId = get('id')
      const date = normalizeDate(get('date'))
      const description = get('description')
      const account = get('account')
      const debit = money(get('debit'))
      const credit = money(get('credit'))
      if (!entryId || !date || !description || !account) {
        parseErrors.push(`Linha ${rowNumber}: ID, data, histórico e conta são obrigatórios.`)
        return
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
        parseErrors.push(`Linha ${rowNumber}: data inválida (${get('date')}). Use AAAA-MM-DD ou DD/MM/AAAA.`)
        return
      }
      if (!Number.isFinite(debit) || !Number.isFinite(credit)) {
        parseErrors.push(`Linha ${rowNumber}: débito/crédito não numérico.`)
        return
      }
      parsed.push({
        row: rowNumber, entryId, date, description, account, debit: Math.round(debit * 100) / 100, credit: Math.round(credit * 100) / 100,
        document: get('document') || undefined, competence: get('competence') || date.slice(0, 7), costCenter: get('costCenter') || undefined,
      })
    })
    const groups = new Map<string, ParsedLine[]>()
    for (const line of parsed) groups.set(line.entryId, [...(groups.get(line.entryId) ?? []), line])
    const existingIds = new Set(existingEntries.map(entry => entry.id))
    const existingFingerprints = new Set(existingEntries.map(canonical))
    const seenIds = new Set<string>()
    const seenFingerprints = new Set<string>()
    const previews: PreviewEntry[] = []
    for (const [id, lines] of groups) {
      const first = lines[0]
      const errors: string[] = []
      if (lines.some(line => line.date !== first.date || line.description !== first.description || line.document !== first.document)) {
        errors.push('As partidas do mesmo ID precisam ter data, histórico e documento iguais.')
      }
      const entry: JournalEntry = {
        id, date: first.date, description: first.description, document: first.document,
        competence: first.competence, costCenter: first.costCenter, source: 'IMPORTACAO',
        lines: lines.map(line => ({ account: line.account, debit: line.debit, credit: line.credit })),
      }
      errors.push(...validateJournalEntry(entry))
      const fingerprint = canonical(entry)
      const duplicate = existingIds.has(id) || seenIds.has(id) || existingFingerprints.has(fingerprint) || seenFingerprints.has(fingerprint)
      if (duplicate) errors.push('Possível duplicidade: ID ou conteúdo já existente no Razão/arquivo.')
      seenIds.add(id)
      seenFingerprints.add(fingerprint)
      previews.push({ entry, rowNumbers: lines.map(line => line.row), errors: [...new Set(errors)], duplicate })
    }
    setFileName(file.name)
    setFileContentForImport(rawContent)
    setEntries(previews)
    setLoaded(true)
    if (parseErrors.length) setFileError(parseErrors.slice(0, 8).join('\n') + (parseErrors.length > 8 ? `\nE mais ${parseErrors.length - 8} erro(s) de linha.` : ''))
  }

  async function importEntries() {
    if (!fileContentForImport || !fileName || summary.valid < 1 || summary.invalid > 0 || summary.duplicates > 0 || submitting) return
    const confirmed = window.confirm(`Confirma o envio de ${summary.valid} lançamento(s) do arquivo "${fileName}"? Esta ação pode gravar dados na empresa selecionada.`)
    if (!confirmed) return
    setSubmitting(true)
    setImportMessage(null)
    try {
      const response = await fetch('/api/contabilidade/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ fileName, fileContent: fileContentForImport, idempotencyKey: window.crypto.randomUUID() }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : `Falha na importação (HTTP ${response.status}).`)
      setImportMessage({ type: 'success', text: 'O servidor aceitou a importação. Confira o resultado retornado antes de continuar.' })
    } catch (error) {
      setImportMessage({ type: 'error', text: error instanceof Error ? error.message : 'Não foi possível concluir a importação.' })
    } finally {
      setSubmitting(false)
    }
  }

  function downloadTemplate() {
    const csv = 'id;data;historico;conta;debito;credito;documento;competencia;centro_de_custo\nIMP-001;2026-01-15;Exemplo de lançamento;1.1.01;1500,00;0,00;DOC-001;2026-01;Administrativo\nIMP-001;2026-01-15;Exemplo de lançamento;4.1;0,00;1500,00;DOC-001;2026-01;Administrativo\n'
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'modelo-importacao-razao.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const box: React.CSSProperties = { border: '1px solid #d6deea', borderRadius: 10, padding: 16, marginBottom: 18 }
  const button: React.CSSProperties = { border: '1px solid #cad5e3', borderRadius: 8, padding: '9px 12px', background: '#fff', color: '#17345f', fontWeight: 700, cursor: 'pointer' }

  return (
    <section style={box} aria-labelledby="razao-import-title">
      <div className="panel-title">
        <h2 id="razao-import-title">Importação de lançamentos</h2>
        <span>Prévia • sem gravação</span>
      </div>
      <p style={{ color: '#66758a', fontSize: 13, margin: '8px 0 14px' }}>
        Importe um CSV com uma linha por partida contábil. Partidas do mesmo lançamento devem compartilhar o mesmo ID; débitos e créditos precisam fechar.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={event => void readFile(event.target.files?.[0])} style={{ maxWidth: '100%' }} />
        <button type="button" style={button} onClick={downloadTemplate}>Baixar modelo CSV</button>
        {fileName && <span style={{ color: '#66758a', fontSize: 12 }}>{fileName}</span>}
      </div>
      <div className="note" style={{ marginTop: 12 }}>Colunas obrigatórias: id, data, histórico, conta, débito e crédito. Documento, competência e centro de custo são opcionais. Contas válidas devem existir no plano de contas atual.</div>
      {fileError && <pre role="alert" style={{ whiteSpace: 'pre-wrap', color: '#a32626', background: '#fff5f5', border: '1px solid #f2c7c7', borderRadius: 8, padding: 12, marginTop: 12, font: 'inherit', fontSize: 13 }}>{fileError}</pre>}
      {loaded && <>
        <div className="cards" style={{ marginTop: 14 }}>
          <div className="card"><span>Lançamentos</span><strong>{summary.total}</strong></div>
          <div className="card"><span>Válidos para revisão</span><strong>{summary.valid}</strong></div>
          <div className="card"><span>Duplicidades</span><strong>{summary.duplicates}</strong></div>
          <div className="card"><span>Com erros</span><strong>{summary.invalid}</strong></div>
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead><tr><th>ID</th><th>Data</th><th>Histórico</th><th>Partidas</th><th>Débitos</th><th>Créditos</th><th>Validação</th></tr></thead>
            <tbody>{entries.slice(0, 50).map(item => {
              const debit = item.entry.lines.reduce((sum, line) => sum + line.debit, 0)
              const credit = item.entry.lines.reduce((sum, line) => sum + line.credit, 0)
              return <tr key={item.entry.id}>
                <td>{item.entry.id}<small style={{ display: 'block', color: '#718198' }}>Linhas {item.rowNumbers.join(', ')}</small></td>
                <td>{item.entry.date}</td><td>{item.entry.description}</td><td>{item.entry.lines.length}</td>
                <td>{debit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>{credit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td><strong style={{ color: item.errors.length ? '#a32626' : '#18794e' }}>{item.errors.length ? 'Revisar' : 'Válido'}</strong>{item.errors.length > 0 && <small style={{ display: 'block', color: '#a32626', maxWidth: 300, whiteSpace: 'normal' }}>{item.errors.join(' ')}</small>}</td>
              </tr>
            })}</tbody>
          </table>
        </div>
        {entries.length > 50 && <p style={{ color: '#66758a', fontSize: 12 }}>Exibindo os primeiros 50 de {entries.length} lançamentos.</p>}
        {importMessage && <div role={importMessage.type === 'error' ? 'alert' : 'status'} className="note" style={{ marginTop: 12, color: importMessage.type === 'error' ? '#a32626' : '#18794e', whiteSpace: 'pre-wrap' }}>{importMessage.text}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" style={{ ...button, opacity: (!loaded || summary.valid < 1 || summary.invalid > 0 || summary.duplicates > 0 || submitting) ? 0.55 : 1 }} disabled={!loaded || summary.valid < 1 || summary.invalid > 0 || summary.duplicates > 0 || submitting} onClick={() => void importEntries()}>
            {submitting ? 'Importando...' : 'Importar lançamentos'}
          </button>
        </div>
        <div className="note" style={{ marginTop: 12 }}>A importação envia os dados ao servidor e pode gravar lançamentos. Use somente no Preview após validar o ambiente de teste. Arquivos com erros ou duplicidades ficam bloqueados.</div>
      </>}
    </section>
  )
}

import { validateFinancialEntries, type V2ValidationIssue } from './v2-data-validation'
import type { FinancialEntry } from './v2-data-model'

export interface V2CsvRow { rowNumber: number; values: Record<string, string> }
export interface V2StagedRow { rowNumber: number; entry: Partial<FinancialEntry>; issues: V2ValidationIssue[]; accepted: boolean }
export interface V2CsvImportResult { rowsReceived: number; rowsAccepted: number; rowsRejected: number; rows: V2StagedRow[] }

function parseCsvLine(line: string, delimiter = ','): string[] {
  const values: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]
    if (char === '"' && quoted && next === '"') { current += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === delimiter && !quoted) { values.push(current.trim()); current = '' }
    else current += char
  }
  values.push(current.trim())
  return values
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')
}

function parseAmount(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined
  const normalized = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : Number.NaN
}

function mapEntry(values: Record<string, string>): Partial<FinancialEntry> {
  return {
    id: values.id, companyId: values.company_id, accountId: values.account_id,
    costCenterId: values.cost_center_id || undefined, document: values.document || undefined,
    description: values.description || '', date: values.date || '', competence: values.competence || '',
    dueDate: values.due_date || undefined, settlementDate: values.settlement_date || undefined,
    amount: parseAmount(values.amount), nature: values.nature as FinancialEntry['nature'],
    cashBasis: values.cash_basis as FinancialEntry['cashBasis'], movementClass: values.movement_class as FinancialEntry['movementClass'],
    source: 'csv', externalId: values.external_id || undefined, reconciled: false,
  }
}

export function parseV2Csv(csv: string, delimiter = ','): V2CsvRow[] {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim() !== '')
  if (lines.length === 0) return []
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader)
  return lines.slice(1).map((line, index) => ({ rowNumber: index + 2, values: Object.fromEntries(headers.map((header, cellIndex) => [header, cellsafe(parseCsvLine(line, delimiter), cellIndex)])) }))
}

function cellsafe(cells: string[], index: number): string { return cells[index] ?? '' }

export function stageV2Csv(csv: string, delimiter = ','): V2CsvImportResult {
  const parsedRows = parseV2Csv(csv, delimiter)
  const entries = parsedRows.map((row) => mapEntry(row.values))
  const results = validateFinancialEntries(entries)
  const rows = parsedRows.map((row, index) => ({ rowNumber: row.rowNumber, entry: entries[index], issues: results[index].issues, accepted: results[index].valid }))
  return { rowsReceived: rows.length, rowsAccepted: rows.filter((row) => row.accepted).length, rowsRejected: rows.filter((row) => !row.accepted).length, rows }
}

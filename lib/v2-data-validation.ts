import {
  V2_DATA_RULES,
  type AccountingNature,
  type CashBasis,
  type DataSource,
  type FinancialEntry,
  type MovementClass,
} from './v2-data-model'

export type V2ValidationCode =
  | 'required'
  | 'invalid_date'
  | 'invalid_competence'
  | 'invalid_amount'
  | 'invalid_nature'
  | 'invalid_cash_basis'
  | 'invalid_movement_class'
  | 'invalid_source'
  | 'duplicate_external_id'

export interface V2ValidationIssue {
  code: V2ValidationCode
  field: string
  message: string
}

export interface V2ValidationResult {
  valid: boolean
  issues: V2ValidationIssue[]
}

const NATURES: AccountingNature[] = ['debit', 'credit']
const CASH_BASES: CashBasis[] = ['caixa', 'competencia']
const MOVEMENT_CLASSES: MovementClass[] = [
  'receita', 'custo', 'opex', 'capex', 'financeiro', 'imposto', 'transferencia', 'outros',
]
const SOURCES: DataSource[] = ['manual', 'csv', 'excel', 'erp', 'api']

function required(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function validCompetence(value: string): boolean {
  if (!V2_DATA_RULES.competenceFormat.test(value)) return false
  const month = Number(value.slice(5, 7))
  return month >= 1 && month <= 12
}

function validateOptionalDate(value: string | undefined, field: 'dueDate' | 'settlementDate', label: string, issues: V2ValidationIssue[]): void {
  if (value !== undefined && value !== '' && !validIsoDate(value)) {
    issues.push({ code: 'invalid_date', field, message: `${label} deve estar no formato YYYY-MM-DD e ser válida.` })
  }
}

export function validateFinancialEntry(
  entry: Partial<FinancialEntry>,
  existingExternalIds: ReadonlySet<string> = new Set(),
): V2ValidationResult {
  const issues: V2ValidationIssue[] = []

  const requiredFields: Array<[keyof FinancialEntry, string]> = [
    ['companyId', 'empresa'],
    ['accountId', 'conta contábil'],
    ['description', 'descrição'],
    ['date', 'data'],
    ['competence', 'competência'],
    ['amount', 'valor'],
    ['nature', 'natureza'],
    ['cashBasis', 'base'],
    ['movementClass', 'classe de movimento'],
  ]

  for (const [field, label] of requiredFields) {
    if (!required(entry[field])) issues.push({ code: 'required', field, message: `Campo obrigatório: ${label}.` })
  }

  if (typeof entry.date === 'string' && !validIsoDate(entry.date)) {
    issues.push({ code: 'invalid_date', field: 'date', message: 'Data deve estar no formato YYYY-MM-DD e ser válida.' })
  }
  if (typeof entry.competence === 'string' && !validCompetence(entry.competence)) {
    issues.push({ code: 'invalid_competence', field: 'competence', message: 'Competência deve estar no formato YYYY-MM e conter mês entre 01 e 12.' })
  }
  validateOptionalDate(entry.dueDate, 'dueDate', 'Vencimento', issues)
  validateOptionalDate(entry.settlementDate, 'settlementDate', 'Liquidação', issues)

  if (entry.amount !== undefined && (!Number.isFinite(entry.amount) || typeof entry.amount !== 'number')) {
    issues.push({ code: 'invalid_amount', field: 'amount', message: 'Valor deve ser numérico e finito.' })
  }
  if (entry.nature !== undefined && !NATURES.includes(entry.nature)) {
    issues.push({ code: 'invalid_nature', field: 'nature', message: 'Natureza deve ser debit ou credit.' })
  }
  if (entry.cashBasis !== undefined && !CASH_BASES.includes(entry.cashBasis)) {
    issues.push({ code: 'invalid_cash_basis', field: 'cashBasis', message: 'Base deve ser caixa ou competencia.' })
  }
  if (entry.movementClass !== undefined && !MOVEMENT_CLASSES.includes(entry.movementClass)) {
    issues.push({ code: 'invalid_movement_class', field: 'movementClass', message: 'Classe de movimento não reconhecida.' })
  }
  if (entry.source !== undefined && !SOURCES.includes(entry.source)) {
    issues.push({ code: 'invalid_source', field: 'source', message: 'Origem do dado não reconhecida.' })
  }
  if (entry.externalId && existingExternalIds.has(entry.externalId)) {
    issues.push({ code: 'duplicate_external_id', field: 'externalId', message: 'Identificador externo já foi importado para este contexto.' })
  }

  return { valid: issues.length === 0, issues }
}

export function validateFinancialEntries(entries: readonly Partial<FinancialEntry>[]): V2ValidationResult[] {
  const seen = new Set<string>()
  return entries.map((entry) => {
    const result = validateFinancialEntry(entry, seen)
    if (entry.externalId) seen.add(entry.externalId)
    return result
  })
}

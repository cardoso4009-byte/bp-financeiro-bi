/**
 * Modelo canônico de entrada da V2.
 *
 * A V1 continua baseada no Financial Core demonstrativo.
 * A V2 usa este contrato como fronteira entre importação,
 * classificação gerencial e os motores das demonstrações.
 */

export type AccountingNature = 'debit' | 'credit'
export type CashBasis = 'caixa' | 'competencia'
export type MovementClass = 'receita' | 'custo' | 'opex' | 'capex' | 'financeiro' | 'imposto' | 'transferencia' | 'outros'
export type DataSource = 'manual' | 'csv' | 'excel' | 'erp' | 'api'

export interface Company {
  id: string
  name: string
  document?: string
  active: boolean
}

export interface CostCenter {
  id: string
  companyId: string
  code: string
  name: string
  active: boolean
}

export interface Account {
  id: string
  companyId: string
  code: string
  name: string
  parentCode?: string
  nature: AccountingNature
  statement: 'resultado' | 'ativo' | 'passivo' | 'patrimonio_liquido'
  defaultClass?: MovementClass
  active: boolean
}

export interface FinancialEntry {
  id: string
  companyId: string
  accountId: string
  costCenterId?: string
  document?: string
  description: string
  date: string
  competence: string
  dueDate?: string
  settlementDate?: string
  amount: number
  nature: AccountingNature
  cashBasis: CashBasis
  movementClass: MovementClass
  source: DataSource
  externalId?: string
  importedAt?: string
  reconciled: boolean
}

export interface ImportBatch {
  id: string
  companyId: string
  source: Exclude<DataSource, 'manual'>
  fileName?: string
  importedAt: string
  rowsReceived: number
  rowsAccepted: number
  rowsRejected: number
  status: 'processing' | 'completed' | 'completed_with_errors' | 'failed'
}

export const V2_DATA_RULES = {
  competenceFormat: /^\d{4}-\d{2}$/,
  monetaryScale: 2,
  requireCompany: true,
  requireAccount: true,
  requireCompetence: true,
  requireAmount: true,
  allowNegativeAmount: true,
  goldenRule: 'Não inventar valores para fechar reconciliações.',
} as const

export function competenceOfEntry(entry: Pick<FinancialEntry, 'competence' | 'date'>): string {
  return entry.competence || entry.date.slice(0, 7)
}

export function signedAmount(entry: Pick<FinancialEntry, 'amount' | 'nature'>): number {
  return entry.nature === 'debit' ? entry.amount : -entry.amount
}

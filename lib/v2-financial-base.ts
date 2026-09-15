import type { FinancialEntry } from './v2-data-model'

/**
 * Camada canônica entre o staging V2 e os motores dos demonstrativos.
 * Não altera nem recalcula os lançamentos de origem.
 */
export interface V2BaseRecord extends FinancialEntry {
  signedAmount: number
  period: string
  isCashSettled: boolean
}

export interface V2FinancialBase {
  entries: V2BaseRecord[]
  totalEntries: number
  totalDebit: number
  totalCredit: number
  periods: string[]
}

export function toV2BaseRecord(entry: FinancialEntry): V2BaseRecord {
  return {
    ...entry,
    signedAmount: entry.nature === 'debit' ? entry.amount : -entry.amount,
    period: entry.competence,
    isCashSettled: Boolean(entry.settlementDate),
  }
}

export function buildV2FinancialBase(entries: FinancialEntry[]): V2FinancialBase {
  const records = entries.map(toV2BaseRecord)
  const periods = [...new Set(records.map((entry) => entry.period))].sort()

  return {
    entries: records,
    totalEntries: records.length,
    totalDebit: records.filter((entry) => entry.nature === 'debit').reduce((sum, entry) => sum + entry.amount, 0),
    totalCredit: records.filter((entry) => entry.nature === 'credit').reduce((sum, entry) => sum + entry.amount, 0),
    periods,
  }
}

export function filterV2BaseByPeriod(base: V2FinancialBase, period: string): V2BaseRecord[] {
  return base.entries.filter((entry) => entry.period === period)
}

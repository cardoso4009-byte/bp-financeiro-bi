import type { FinancialEntry } from './v2-data-model'
export interface V2BaseRecord extends FinancialEntry { signedAmount: number; period: string; isCashSettled: boolean }
export interface V2FinancialBase { entries: V2BaseRecord[]; totalEntries: number; totalDebit: number; totalCredit: number; periods: string[] }
export function toV2BaseRecord(entry: FinancialEntry): V2BaseRecord { return { ...entry, signedAmount: entry.nature === 'debit' ? entry.amount : -entry.amount, period: entry.competence, isCashSettled: Boolean(entry.settlementDate) } }
export function buildV2FinancialBase(entries: FinancialEntry[]): V2FinancialBase { const records = entries.map(toV2BaseRecord); return { entries: records, totalEntries: records.length, totalDebit: records.filter(e => e.nature === 'debit').reduce((s,e)=>s+e.amount,0), totalCredit: records.filter(e => e.nature === 'credit').reduce((s,e)=>s+e.amount,0), periods: [...new Set(records.map(e=>e.period))].sort() } }
export function filterV2BaseByPeriod(base: V2FinancialBase, period: string): V2BaseRecord[] { return base.entries.filter(e => e.period === period) }

import { chartOfAccounts, type Account, type JournalEntry } from './accounting-core'
import { buildTrialBalance as buildCentralTrialBalance } from './trial-balance-engine'

export type LedgerRow = Account & {
  debit: number
  credit: number
  balance: number
}

export function buildLedger(entries: JournalEntry[] = []): LedgerRow[] {
  const central = buildCentralTrialBalance(entries)
  return chartOfAccounts
    .filter(account => account.level === 3 || account.level === 2)
    .map(account => {
      const row = central.rows.find(item => item.code === account.code)
      return { ...account, debit: row?.debit ?? 0, credit: row?.credit ?? 0, balance: row?.balance ?? 0 }
    })
}

export function buildTrialBalance(entries: JournalEntry[] = []) {
  const central = buildCentralTrialBalance(entries)
  return {
    rows: central.rows.filter(row => row.debit !== 0 || row.credit !== 0),
    totalDebit: central.totalDebit,
    totalCredit: central.totalCredit,
    difference: central.difference,
    balanced: central.balanced,
    errors: central.errors,
  }
}

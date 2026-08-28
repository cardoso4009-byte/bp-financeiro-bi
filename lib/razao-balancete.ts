import { chartOfAccounts, sampleJournal, type Account } from './accounting-core'
import { buildTrialBalance as buildCentralTrialBalance } from './trial-balance-engine'

export type LedgerRow = Account & {
  debit: number
  credit: number
  balance: number
}

export function buildLedger(): LedgerRow[] {
  const central = buildCentralTrialBalance(sampleJournal)
  return chartOfAccounts
    .filter(account => account.level === 3 || account.level === 2)
    .map(account => {
      const row = central.rows.find(item => item.code === account.code)
      return {
        ...account,
        debit: row?.debit ?? 0,
        credit: row?.credit ?? 0,
        balance: row?.balance ?? 0,
      }
    })
}

export function buildTrialBalance() {
  const central = buildCentralTrialBalance(sampleJournal)
  const rows = buildLedger().filter(row => row.debit !== 0 || row.credit !== 0)
  return {
    rows,
    totalDebit: central.totalDebit,
    totalCredit: central.totalCredit,
    difference: central.difference,
    balanced: central.balanced,
    errors: central.errors,
  }
}

import { chartOfAccounts, sampleJournal, type Account } from './contabil-model'
import { buildTrialBalance as buildCentralTrialBalance } from './trial-balance-engine'
import type { JournalEntry as CentralJournalEntry } from './accounting-core'

export type LedgerRow = Account & {
  debit: number
  credit: number
  balance: number
}

function toCentralEntries(): CentralJournalEntry[] {
  return sampleJournal.map((entry) => {
    const debit = entry.lines.find((line) => line.debit > 0)
    const credit = entry.lines.find((line) => line.credit > 0)
    return {
      id: entry.id,
      date: entry.date,
      competence: entry.date.slice(0, 7),
      description: entry.description,
      debitAccount: debit?.account ?? '',
      creditAccount: credit?.account ?? '',
      amount: debit?.debit ?? credit?.credit ?? 0,
      source: 'MANUAL',
    }
  })
}

export function buildLedger(): LedgerRow[] {
  const central = buildCentralTrialBalance(toCentralEntries())
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
  const central = buildCentralTrialBalance(toCentralEntries())
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

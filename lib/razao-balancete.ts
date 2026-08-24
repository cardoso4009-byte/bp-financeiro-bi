import { chartOfAccounts, sampleJournal, type Account } from './contabil-model'

export type LedgerRow = Account & {
  debit: number
  credit: number
  balance: number
}

export function buildLedger(): LedgerRow[] {
  return chartOfAccounts
    .filter(account => account.level === 3 || account.level === 2)
    .map(account => {
      const lines = sampleJournal.flatMap(entry => entry.lines.filter(line => line.account === account.code))
      const debit = lines.reduce((sum, line) => sum + line.debit, 0)
      const credit = lines.reduce((sum, line) => sum + line.credit, 0)
      const balance = account.nature === 'devedora' ? debit - credit : credit - debit
      return { ...account, debit, credit, balance }
    })
}

export function buildTrialBalance() {
  const rows = buildLedger().filter(row => row.debit !== 0 || row.credit !== 0)
  return {
    rows,
    totalDebit: rows.reduce((sum, row) => sum + (row.nature === 'devedora' ? row.balance : 0), 0),
    totalCredit: rows.reduce((sum, row) => sum + (row.nature === 'credora' ? row.balance : 0), 0),
    balanced: sampleJournal.every(entry => {
      const debit = entry.lines.reduce((s, l) => s + l.debit, 0)
      const credit = entry.lines.reduce((s, l) => s + l.credit, 0)
      return Math.abs(debit - credit) < 0.01
    }),
  }
}

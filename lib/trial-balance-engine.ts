import { Account, JournalEntry, chartOfAccounts } from './accounting-core'

export type TrialBalanceRow = {
  code: string
  name: string
  type: Account['type']
  nature: Account['nature']
  debit: number
  credit: number
  balance: number
}

export type TrialBalance = {
  rows: TrialBalanceRow[]
  totalDebit: number
  totalCredit: number
  difference: number
  balanced: boolean
  errors: string[]
}

export function buildTrialBalance(entries: JournalEntry[], accounts: Account[] = chartOfAccounts): TrialBalance {
  const errors: string[] = []
  const totals = new Map<string, { debit: number; credit: number }>()

  for (const account of accounts) totals.set(account.code, { debit: 0, credit: 0 })

  for (const entry of entries) {
    const amount = Number(entry.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push(`${entry.id}: valor inválido.`)
      continue
    }

    const debit = totals.get(entry.debitAccount)
    const credit = totals.get(entry.creditAccount)

    if (!debit) errors.push(`${entry.id}: conta de débito inexistente: ${entry.debitAccount}.`)
    else debit.debit += amount

    if (!credit) errors.push(`${entry.id}: conta de crédito inexistente: ${entry.creditAccount}.`)
    else credit.credit += amount
  }

  const rows = accounts
    .filter((account) => account.active !== false)
    .map((account) => {
      const value = totals.get(account.code) ?? { debit: 0, credit: 0 }
      const balance = account.nature === 'DEVEDORA' ? value.debit - value.credit : value.credit - value.debit
      return { code: account.code, name: account.name, type: account.type, nature: account.nature, debit: value.debit, credit: value.credit, balance }
    })

  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0)
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0)
  const difference = totalDebit - totalCredit

  return { rows, totalDebit, totalCredit, difference, balanced: Math.abs(difference) < 0.01 && errors.length === 0, errors }
}

import { Account, JournalEntry, chartOfAccounts } from './accounting-core'

export type TrialBalanceRow = {
  code: string
  name: string
  class: Account['class']
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
    const entryErrors = entry.lines.length < 2 ? [`${entry.id}: lançamento deve possuir ao menos duas partidas.`] : []
    const entryDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0)
    const entryCredit = entry.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0)
    if (Math.abs(entryDebit - entryCredit) >= 0.01) entryErrors.push(`${entry.id}: débito e crédito não estão balanceados.`)
    errors.push(...entryErrors)

    for (const line of entry.lines) {
      const account = totals.get(line.account)
      if (!account) {
        errors.push(`${entry.id}: conta inexistente: ${line.account}.`)
        continue
      }
      if (line.debit < 0 || line.credit < 0) errors.push(`${entry.id}: valor negativo na conta ${line.account}.`)
      account.debit += Number(line.debit || 0)
      account.credit += Number(line.credit || 0)
    }
  }

  const rows = accounts
    .filter(account => account.active !== false)
    .map(account => {
      const value = totals.get(account.code) ?? { debit: 0, credit: 0 }
      const balance = account.nature === 'devedora' ? value.debit - value.credit : value.credit - value.debit
      return { code: account.code, name: account.name, class: account.class, nature: account.nature, debit: value.debit, credit: value.credit, balance }
    })

  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0)
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0)
  const difference = totalDebit - totalCredit
  return { rows, totalDebit, totalCredit, difference, balanced: Math.abs(difference) < 0.01 && errors.length === 0, errors }
}

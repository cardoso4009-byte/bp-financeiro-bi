import { Account, JournalEntry, chartOfAccounts } from './accounting-core'

export type LedgerMovement = {
  entryId: string
  date: string
  competence?: string
  description: string
  document?: string
  source?: JournalEntry['source']
  debit: number
  credit: number
  balance: number
}

export type LedgerAccount = {
  account: Account
  movements: LedgerMovement[]
  debit: number
  credit: number
  balance: number
}

export function buildLedger(
  entries: JournalEntry[],
  accounts: Account[] = chartOfAccounts,
): LedgerAccount[] {
  const byAccount = new Map<string, LedgerAccount>()

  for (const account of accounts) {
    byAccount.set(account.code, {
      account,
      movements: [],
      debit: 0,
      credit: 0,
      balance: 0,
    })
  }

  const orderedEntries = [...entries].sort((a, b) => {
    const date = a.date.localeCompare(b.date)
    return date !== 0 ? date : a.id.localeCompare(b.id)
  })

  for (const entry of orderedEntries) {
    for (const line of entry.lines) {
      const ledger = byAccount.get(line.account)
      if (!ledger) continue

      const debit = Number(line.debit || 0)
      const credit = Number(line.credit || 0)
      ledger.debit += debit
      ledger.credit += credit

      const movementBalance = ledger.account.nature === 'devedora'
        ? ledger.debit - ledger.credit
        : ledger.credit - ledger.debit

      ledger.balance = movementBalance
      ledger.movements.push({
        entryId: entry.id,
        date: entry.date,
        competence: entry.competence,
        description: entry.description,
        document: entry.document,
        source: entry.source,
        debit,
        credit,
        balance: movementBalance,
      })
    }
  }

  return Array.from(byAccount.values())
    .filter(item => item.movements.length > 0)
    .sort((a, b) => a.account.code.localeCompare(b.account.code, undefined, { numeric: true }))
}

import type { Account, JournalEntry } from './accounting-core'

export type TrialBalanceRow = {
  account: Account
  openingDebit: number
  openingCredit: number
  openingBalance: number
  debit: number
  credit: number
  closingBalance: number
}

export type TrialBalanceResult = {
  rows: TrialBalanceRow[]
  totals: {
    openingDebit: number
    openingCredit: number
    debit: number
    credit: number
    difference: number
    balanced: boolean
  }
  period: { start: string; end: string }
}

const toCents = (value: number) => Math.round((Number(value) || 0) * 100)
const fromCents = (value: number) => value / 100
const competenceOf = (entry: JournalEntry) => entry.competence || entry.date.slice(0, 7)
const validCompetence = (value: string) => /^\\d{4}-(0[1-9]|1[0-2])$/.test(value)

type MutableBalance = {
  openingDebit: number
  openingCredit: number
  debit: number
  credit: number
}

function addToAccountAndParents(
  balances: Map<string, MutableBalance>,
  accountByCode: Map<string, Account>,
  accountCode: string,
  field: keyof MutableBalance,
  cents: number,
) {
  let current: Account | undefined = accountByCode.get(accountCode)
  const visited = new Set<string>()

  while (current) {
    if (visited.has(current.code)) throw new Error(`Hierarquia circular no plano de contas: ${current.code}.`)
    visited.add(current.code)

    const balance = balances.get(current.code)
    if (!balance) throw new Error(`Saldo não inicializado para a conta ${current.code}.`)
    balance[field] += cents
    current = current.parentCode ? accountByCode.get(current.parentCode) : undefined
  }
}

export function buildTrialBalance(
  entries: JournalEntry[],
  accounts: Account[],
  startCompetence: string,
  endCompetence: string = startCompetence,
): TrialBalanceResult {
  if (!validCompetence(startCompetence) || !validCompetence(endCompetence)) {
    throw new Error('Informe competências válidas no formato AAAA-MM.')
  }
  if (startCompetence > endCompetence) {
    throw new Error('A competência inicial não pode ser posterior à competência final.')
  }

  const accountByCode = new Map(accounts.map(account => [account.code, account]))
  const balances = new Map<string, MutableBalance>()
  for (const account of accounts) {
    balances.set(account.code, { openingDebit: 0, openingCredit: 0, debit: 0, credit: 0 })
  }

  let totalOpeningDebit = 0
  let totalOpeningCredit = 0
  let totalDebit = 0
  let totalCredit = 0

  for (const entry of entries) {
    const competence = competenceOf(entry)
    if (!validCompetence(competence)) throw new Error(`Competência inválida no lançamento ${entry.id}.`)

    const isOpening = competence < startCompetence
    const isInPeriod = competence >= startCompetence && competence <= endCompetence
    if (!isOpening && !isInPeriod) continue

    for (const line of entry.lines) {
      if (!accountByCode.has(line.account)) {
        throw new Error(`A conta ${line.account} do lançamento ${entry.id} não existe no plano de contas.`)
      }

      const debit = toCents(line.debit)
      const credit = toCents(line.credit)
      if (debit < 0 || credit < 0) throw new Error(`Valor negativo no lançamento ${entry.id}, conta ${line.account}.`)

      if (isOpening) {
        addToAccountAndParents(balances, accountByCode, line.account, 'openingDebit', debit)
        addToAccountAndParents(balances, accountByCode, line.account, 'openingCredit', credit)
        totalOpeningDebit += debit
        totalOpeningCredit += credit
      } else {
        addToAccountAndParents(balances, accountByCode, line.account, 'debit', debit)
        addToAccountAndParents(balances, accountByCode, line.account, 'credit', credit)
        totalDebit += debit
        totalCredit += credit
      }
    }
  }

  const rows = accounts
    .map(account => {
      const value = balances.get(account.code)!
      const openingNet = account.nature === 'devedora'
        ? value.openingDebit - value.openingCredit
        : value.openingCredit - value.openingDebit
      const movementNet = account.nature === 'devedora'
        ? value.debit - value.credit
        : value.credit - value.debit

      return {
        account,
        openingDebit: fromCents(value.openingDebit),
        openingCredit: fromCents(value.openingCredit),
        openingBalance: fromCents(openingNet),
        debit: fromCents(value.debit),
        credit: fromCents(value.credit),
        closingBalance: fromCents(openingNet + movementNet),
      }
    })
    .sort((a, b) => a.account.code.localeCompare(b.account.code, undefined, { numeric: true }))

  const difference = totalDebit - totalCredit
  return {
    rows,
    totals: {
      openingDebit: fromCents(totalOpeningDebit),
      openingCredit: fromCents(totalOpeningCredit),
      debit: fromCents(totalDebit),
      credit: fromCents(totalCredit),
      difference: fromCents(difference),
      balanced: Math.abs(difference) <= 1,
    },
    period: { start: startCompetence, end: endCompetence },
  }
}

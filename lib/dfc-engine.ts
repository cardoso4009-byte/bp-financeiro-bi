import { chartOfAccounts, type JournalEntry } from './accounting-core'
import { sampleJournal as legacySampleJournal } from './contabil-model'
import { buildTrialBalance } from './trial-balance-engine'

type FlowCategory = 'operational' | 'investment' | 'financing'

function classifyCounterpart(code: string): FlowCategory {
  if (code.startsWith('1.2')) return 'investment'
  if (code.startsWith('2.2') || code.startsWith('3.')) return 'financing'
  return 'operational'
}

function toCentralJournal(entries: typeof legacySampleJournal): JournalEntry[] {
  return entries.map((entry) => {
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

export type CashFlowEvidence = {
  entryId: string
  date: string
  description: string
  cashEffect: number
  counterpart: string
  category: FlowCategory
}

const defaultJournal = toCentralJournal(legacySampleJournal)

export function cashFlowEngine(entries: JournalEntry[] = defaultJournal) {
  const trial = buildTrialBalance(entries, chartOfAccounts)
  const cashCode = '1.1.01'
  let operational = 0
  let investment = 0
  let financing = 0
  const evidence: CashFlowEvidence[] = []
  const errors: string[] = [...trial.errors]

  for (const entry of entries) {
    const isCashDebit = entry.debitAccount === cashCode
    const isCashCredit = entry.creditAccount === cashCode
    if (!isCashDebit && !isCashCredit) continue

    const cashEffect = isCashDebit ? entry.amount : -entry.amount
    const counterpartCode = isCashDebit ? entry.creditAccount : entry.debitAccount

    if (!counterpartCode) {
      errors.push(`${entry.id}: movimento de caixa sem contrapartida identificada.`)
      continue
    }

    const category = classifyCounterpart(counterpartCode)
    if (category === 'investment') investment += cashEffect
    else if (category === 'financing') financing += cashEffect
    else operational += cashEffect

    evidence.push({
      entryId: entry.id,
      date: entry.date,
      description: entry.description,
      cashEffect,
      counterpart: counterpartCode,
      category,
    })
  }

  // O saldo inicial será parametrizado quando houver períodos reais persistidos.
  // No modelo demonstrativo, o Diário começa no próprio período.
  const initialCash = 0
  const variation = operational + investment + financing
  const finalCash = initialCash + variation
  const balanceCash = trial.rows.find(row => row.code === cashCode)?.balance ?? 0
  const reconciliation = finalCash - balanceCash

  return {
    operational,
    investment,
    financing,
    variation,
    initialCash,
    finalCash,
    balanceCash,
    reconciliation,
    status: Math.abs(reconciliation) < 0.01 && errors.length === 0 ? 'OK' : 'REVISAR',
    evidence,
    errors,
  }
}

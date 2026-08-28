import { chartOfAccounts, sampleJournal, type JournalEntry } from './accounting-core'
import { buildTrialBalance } from './trial-balance-engine'
import type { AnalysisPeriod } from './period-engine'

type FlowCategory = 'operational' | 'investment' | 'financing'

function classifyCounterpart(code: string): FlowCategory {
  if (code.startsWith('1.2')) return 'investment'
  if (code.startsWith('2.2') || code.startsWith('3.')) return 'financing'
  return 'operational'
}

export type CashFlowEvidence = {
  entryId: string
  date: string
  description: string
  cashEffect: number
  counterpart: string
  category: FlowCategory
}

const defaultJournal: JournalEntry[] = sampleJournal

function inPeriod(competence: string, period: AnalysisPeriod) {
  return competence >= period.start.slice(0, 7) && competence <= period.end.slice(0, 7)
}

function beforePeriod(competence: string, period: AnalysisPeriod) {
  return competence < period.start.slice(0, 7)
}

export function cashFlowEngine(entries: JournalEntry[] = defaultJournal, period?: AnalysisPeriod) {
  const periodEntries = period
    ? entries.filter((entry) => inPeriod(entry.competence || entry.date.slice(0, 7), period))
    : entries
  const cumulativeEntries = period
    ? entries.filter((entry) => (entry.competence || entry.date.slice(0, 7)) <= period.end.slice(0, 7))
    : entries
  const openingEntries = period
    ? entries.filter((entry) => beforePeriod(entry.competence || entry.date.slice(0, 7), period))
    : []

  const trial = buildTrialBalance(cumulativeEntries, chartOfAccounts)
  const openingTrial = buildTrialBalance(openingEntries, chartOfAccounts)
  const cashCode = '1.1.01'
  let operational = 0
  let investment = 0
  let financing = 0
  const evidence: CashFlowEvidence[] = []
  const errors: string[] = [...trial.errors]

  for (const entry of periodEntries) {
    const cashDebit = entry.lines.find((line) => line.account === cashCode && Number(line.debit) > 0)
    const cashCredit = entry.lines.find((line) => line.account === cashCode && Number(line.credit) > 0)
    if (!cashDebit && !cashCredit) continue

    const cashEffect = cashDebit ? Number(cashDebit.debit) : -Number(cashCredit?.credit || 0)
    const counterpart = entry.lines.find((line) => line.account !== cashCode)
    const counterpartCode = counterpart?.account ?? ''

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

  const initialCash = openingTrial.rows.find((row) => row.code === cashCode)?.balance ?? 0
  const variation = operational + investment + financing
  const finalCash = initialCash + variation
  const balanceCash = trial.rows.find((row) => row.code === cashCode)?.balance ?? 0
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

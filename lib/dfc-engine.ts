import { JournalEntry, sampleJournal } from './contabil-model'
import { buildLedger } from './razao-balancete'

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

export function cashFlowEngine(entries: JournalEntry[] = sampleJournal) {
  const ledger = buildLedger(entries)
  const cashCode = '1.1.01'
  let operational = 0
  let investment = 0
  let financing = 0
  const evidence: CashFlowEvidence[] = []
  const errors: string[] = []

  for (const entry of entries) {
    const cashLines = entry.lines.filter(line => line.account === cashCode)
    if (!cashLines.length) continue

    const cashEffect = cashLines.reduce((sum, line) => sum + line.debit - line.credit, 0)
    const counterpartCodes = [...new Set(entry.lines.filter(line => line.account !== cashCode).map(line => line.account))]

    if (counterpartCodes.length === 0) {
      errors.push(`${entry.id}: movimento de caixa sem contrapartida identificada.`)
      continue
    }

    // Um lançamento de caixa é classificado uma única vez pela contrapartida.
    // Isso evita multiplicar o efeito quando um lançamento tiver mais de uma linha não-caixa.
    const category = classifyCounterpart(counterpartCodes[0])
    if (category === 'investment') investment += cashEffect
    else if (category === 'financing') financing += cashEffect
    else operational += cashEffect

    evidence.push({
      entryId: entry.id,
      date: entry.date,
      description: entry.description,
      cashEffect,
      counterpart: counterpartCodes.join(', '),
      category,
    })
  }

  // O saldo inicial será parametrizado quando houver períodos reais persistidos.
  // No modelo demonstrativo, o Diário começa no próprio período.
  const initialCash = 0
  const variation = operational + investment + financing
  const finalCash = initialCash + variation
  const balanceCash = ledger.find(row => row.code === cashCode)?.balance ?? 0
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

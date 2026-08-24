import { sampleJournal } from './contabil-model'
import { buildLedger } from './razao-balancete'

type FlowCategory = 'operational' | 'investment' | 'financing'

function classifyCounterpart(code: string): FlowCategory {
  if (code.startsWith('1.2')) return 'investment'
  if (code.startsWith('2.2') || code.startsWith('3.')) return 'financing'
  return 'operational'
}

export function cashFlowEngine() {
  const ledger = buildLedger()
  const cashCode = '1.1.01'
  let operational = 0
  let investment = 0
  let financing = 0

  for (const entry of sampleJournal) {
    const cashLines = entry.lines.filter(line => line.account === cashCode)
    if (!cashLines.length) continue

    const cashEffect = cashLines.reduce((sum, line) => sum + line.debit - line.credit, 0)
    const counterpartCodes = entry.lines.filter(line => line.account !== cashCode).map(line => line.account)

    // Cada lançamento de caixa é classificado pela natureza da conta de contrapartida.
    // Isso mantém a DFC derivada do Diário, evitando uma segunda fonte de verdade.
    for (const code of counterpartCodes) {
      const category = classifyCounterpart(code)
      if (category === 'investment') investment += cashEffect
      else if (category === 'financing') financing += cashEffect
      else operational += cashEffect
    }
  }

  const initialCash = 0
  const variation = operational + investment + financing
  const finalCash = initialCash + variation
  const balanceCash = ledger.find(row => row.code === cashCode)?.balance ?? 0

  return {
    operational,
    investment,
    financing,
    variation,
    initialCash,
    finalCash,
    balanceCash,
    reconciliation: finalCash - balanceCash,
    status: Math.abs(finalCash - balanceCash) < 0.01 ? 'OK' : 'REVISAR',
  }
}

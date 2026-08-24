import { sampleJournal } from './contabil-model'
import { buildLedger } from './razao-balancete'

export function cashFlowEngine() {
  const ledger = buildLedger()
  const cashCode = '1.1.01'
  let operational = 0, investment = 0, financing = 0

  for (const entry of sampleJournal) {
    const cashLines = entry.lines.filter(line => line.account === cashCode)
    if (!cashLines.length) continue
    const cashEffect = cashLines.reduce((sum,line) => sum + line.debit - line.credit, 0)
    const counterpartCodes = entry.lines.filter(line => line.account !== cashCode).map(line => line.account)
    const text = counterpartCodes.join('|')
    if (counterpartCodes.some(code => code === '1.2.01')) investment += cashEffect
    else if (counterpartCodes.some(code => code.startsWith('2.2'))) financing += cashEffect
    else if (counterpartCodes.some(code => code.startsWith('3.'))) financing += cashEffect
    else operational += cashEffect
  }

  const initialCash = 0
  const variation = operational + investment + financing
  const finalCash = initialCash + variation
  const balanceCash = ledger.find(r => r.code === cashCode)?.balance ?? 0
  return { operational, investment, financing, variation, initialCash, finalCash, balanceCash, reconciliation: finalCash - balanceCash }
}

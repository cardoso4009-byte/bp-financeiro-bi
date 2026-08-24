import { monthlyData } from '@/lib/monthly-data'

export type CashFlowMonth = {
  month: string
  initial: number
  operational: number
  investments: number
  financing: number
  net: number
  final: number
  projectedFinal: number
  minimum: number
  status: 'OK' | 'ATENÇÃO' | 'CRÍTICO'
}

const minimumCash = 40000
const scenarioAdjustment = [0, -5000, 3000, -8000, 5000, -4000, 0, -7000, 4000, -3000, -6000, 8000]

let initial = 50000

export const cashFlowData: CashFlowMonth[] = monthlyData.map((m, i) => {
  const net = m.caixaOperacional + m.investimentos + m.financiamentos
  const final = initial + net
  const projectedFinal = final + scenarioAdjustment[i]
  const status = projectedFinal < minimumCash * 0.75 ? 'CRÍTICO' : projectedFinal < minimumCash ? 'ATENÇÃO' : 'OK'
  const row = {
    month: m.month,
    initial,
    operational: m.caixaOperacional,
    investments: m.investimentos,
    financing: m.financiamentos,
    net,
    final,
    projectedFinal,
    minimum: minimumCash,
    status,
  }
  initial = final
  return row
})

export const cashFlowTotals = {
  initial: cashFlowData[0].initial,
  operational: cashFlowData.reduce((s, m) => s + m.operational, 0),
  investments: cashFlowData.reduce((s, m) => s + m.investments, 0),
  financing: cashFlowData.reduce((s, m) => s + m.financing, 0),
  net: cashFlowData.reduce((s, m) => s + m.net, 0),
  final: cashFlowData[cashFlowData.length - 1].final,
  lowestProjected: Math.min(...cashFlowData.map(m => m.projectedFinal)),
}

export const cashFlowAlerts = cashFlowData.filter(m => m.status !== 'OK')

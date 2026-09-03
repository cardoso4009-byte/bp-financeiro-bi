import { financialCore, openingBalance } from './financial-core'
import { cashFlowEngine } from './dfc-engine'

export type CashManagementMonth = {
  month: string
  initialCash: number
  operating: number
  investment: number
  financing: number
  variation: number
  finalCash: number
}

export function cashManagementEngine(): CashManagementMonth[] {
  return financialCore.map((core, index) => {
    const key = `2026-${String(index + 1).padStart(2, '0')}`
    const flow = cashFlowEngine(undefined, { start: key, end: key })
    return { month: core.month, initialCash: flow.initialCash, operating: flow.operational, investment: flow.investment, financing: flow.financing, variation: flow.variation, finalCash: flow.finalCash }
  })
}

export function cashManagementSummary() {
  const months = cashManagementEngine()
  const final = months[months.length - 1]
  const minCash = Math.min(...months.map(m => m.finalCash))
  const maxCash = Math.max(...months.map(m => m.finalCash))
  const totalOperating = months.reduce((sum, m) => sum + m.operating, 0)
  const totalInvestment = months.reduce((sum, m) => sum + m.investment, 0)
  const totalFinancing = months.reduce((sum, m) => sum + m.financing, 0)
  const totalVariation = months.reduce((sum, m) => sum + m.variation, 0)
  return { months, openingCash: openingBalance.cash, finalCash: final.finalCash, minCash, maxCash, totalOperating, totalInvestment, totalFinancing, totalVariation }
}

import { monthlyData, budgetData } from './monthly-data'

export type ProjectedCashFlowMonth = {
  month: string
  openingCash: number
  projectedRevenue: number
  projectedOperatingOutflows: number
  projectedOperatingCash: number
  projectedInvestment: number
  projectedFinancing: number
  projectedVariation: number
  projectedClosingCash: number
  realizedVariation: number
  realizedClosingCash: number
  varianceCash: number
  status: 'OK' | 'ATENÇÃO' | 'CRÍTICO'
}

export type ProjectedCashFlowSummary = {
  initialCash: number
  finalCash: number
  totalVariation: number
  operatingCash: number
  investment: number
  financing: number
  minimumCash: number
  minimumMonth: string
  negativeMonths: number
}

const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function projectedCashFlowEngine(minimumCash = 50000): ProjectedCashFlowMonth[] {
  let cash = monthlyData[0]?.caixaFinal - monthlyData[0]?.caixaOperacional - monthlyData[0]?.investimentos - monthlyData[0]?.financiamentos || 50000

  return budgetData.map((budget, index) => {
    const realized = monthlyData[index]
    const previousCash = cash
    const projectedRevenue = budget.receitaLiquida
    const projectedOperatingCash = Math.round(realized.caixaOperacional * (projectedRevenue / Math.max(realized.receitaLiquida, 1)))
    const projectedOperatingOutflows = projectedRevenue - projectedOperatingCash
    const projectedInvestment = realized.investimentos
    const projectedFinancing = realized.financiamentos
    const projectedVariation = projectedOperatingCash + projectedInvestment + projectedFinancing
    cash += projectedVariation
    const projectedClosingCash = cash
    const varianceCash = projectedClosingCash - realized.caixaFinal
    const status = projectedClosingCash < 0 ? 'CRÍTICO' : projectedClosingCash < minimumCash ? 'ATENÇÃO' : 'OK'

    return {
      month: monthNames[index] || budget.month,
      openingCash: previousCash,
      projectedRevenue,
      projectedOperatingOutflows,
      projectedOperatingCash,
      projectedInvestment,
      projectedFinancing,
      projectedVariation,
      projectedClosingCash,
      realizedVariation: realized.caixaOperacional + realized.investimentos + realized.financiamentos,
      realizedClosingCash: realized.caixaFinal,
      varianceCash,
      status,
    }
  })
}

export function projectedCashFlowSummary(rows = projectedCashFlowEngine()): ProjectedCashFlowSummary {
  const first = rows[0]
  const minimum = rows.reduce((min, row) => row.projectedClosingCash < min.projectedClosingCash ? row : min, rows[0])
  return {
    initialCash: first?.openingCash ?? 0,
    finalCash: rows.at(-1)?.projectedClosingCash ?? 0,
    totalVariation: rows.reduce((sum, row) => sum + row.projectedVariation, 0),
    operatingCash: rows.reduce((sum, row) => sum + row.projectedOperatingCash, 0),
    investment: rows.reduce((sum, row) => sum + row.projectedInvestment, 0),
    financing: rows.reduce((sum, row) => sum + row.projectedFinancing, 0),
    minimumCash: minimum?.projectedClosingCash ?? 0,
    minimumMonth: minimum?.month ?? '-',
    negativeMonths: rows.filter(row => row.projectedClosingCash < 0).length,
  }
}

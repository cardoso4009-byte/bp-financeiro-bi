import type { ActionPlanItem } from './action-plan-store'

export type PerformanceTone = 'positive' | 'attention' | 'critical' | 'neutral'

export type PerformanceRow = {
  key: string
  label: string
  budget: number
  actual: number
  forecast: number
  target: number
  deviation: number
  deviationPct: number
  forecastGap: number
  tone: PerformanceTone
  owner: string
  action: string
}

export type PerformanceSummary = {
  rows: PerformanceRow[]
  totalBudget: number
  totalActual: number
  totalForecast: number
  totalDeviation: number
  totalForecastGap: number
  openActions: number
  overdueActions: number
}

const pct = (value: number, base: number) => base ? value / Math.abs(base) : 0

export function buildPerformanceRows(
  budget: { revenue: number; opex: number; capex: number; financing: number },
  actual: { revenue: number; opex: number; capex: number; financing: number },
  forecast: { revenue: number; opex: number; capex: number; financing: number },
  actions: ActionPlanItem[] = [],
): PerformanceRow[] {
  const defs = [
    ['revenue', 'Receita', budget.revenue, actual.revenue, forecast.revenue, budget.revenue, 'Financeiro', 'Proteger faturamento e acompanhar conversão/cobrança.'],
    ['opex', 'OPEX', budget.opex, actual.opex, forecast.opex, budget.opex, 'Gestores', 'Atacar desvios recorrentes e despesas sem retorno.'],
    ['capex', 'CAPEX', budget.capex, actual.capex, forecast.capex, budget.capex, 'Gestores', 'Revalidar prioridade, prazo e retorno dos investimentos.'],
    ['financing', 'Financiamento', budget.financing, actual.financing, forecast.financing, budget.financing, 'Financeiro', 'Revisar custo, prazo e capacidade de serviço da dívida.'],
  ] as const

  return defs.map(([key, label, b, a, f, target, owner, action]) => {
    const deviation = a - b
    const deviationPct = pct(deviation, b)
    const forecastGap = f - b
    const revenue = key === 'revenue'
    const favorable = revenue ? deviation >= 0 : deviation <= 0
    const forecastFavorable = revenue ? forecastGap >= 0 : forecastGap <= 0
    const magnitude = Math.abs(deviationPct)
    const tone: PerformanceTone = magnitude <= .03 ? 'neutral' : (favorable && forecastFavorable ? 'positive' : magnitude > .05 ? 'critical' : 'attention')
    const linked = actions.find(x => x.area.toLowerCase().includes(label.toLowerCase()) || x.title.toLowerCase().includes(label.toLowerCase()))
    return { key, label, budget: b, actual: a, forecast: f, target, deviation, deviationPct, forecastGap, tone, owner: linked?.responsible || owner, action: linked?.action || action }
  })
}

export function buildPerformanceSummary(rows: PerformanceRow[], actions: ActionPlanItem[] = []): PerformanceSummary {
  const open = actions.filter(a => a.status === 'Pendente' || a.status === 'Em andamento')
  const today = new Date().toISOString().slice(0, 10)
  return {
    rows,
    totalBudget: rows.reduce((s, r) => s + r.budget, 0),
    totalActual: rows.reduce((s, r) => s + r.actual, 0),
    totalForecast: rows.reduce((s, r) => s + r.forecast, 0),
    totalDeviation: rows.reduce((s, r) => s + r.deviation, 0),
    totalForecastGap: rows.reduce((s, r) => s + r.forecastGap, 0),
    openActions: open.length,
    overdueActions: open.filter(a => a.dueDate && a.dueDate < today).length,
  }
}

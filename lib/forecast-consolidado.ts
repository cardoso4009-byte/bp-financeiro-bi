import type { V2ForecastReport, V2ForecastLine } from './v2-forecast'

export interface ForecastConsolidadoMetric {
  revenue: number
  operatingCosts: number
  financialResult: number
  capex: number
  result: number
}

export interface ForecastConsolidadoRow {
  period: string
  revenue: number
  operatingCosts: number
  financialResult: number
  capex: number
  result: number
  status: 'realizado' | 'projetado'
}

export interface ForecastConsolidadoReport {
  cutoffPeriod: string
  rows: ForecastConsolidadoRow[]
  total: ForecastConsolidadoMetric
  realized: ForecastConsolidadoMetric
  projected: ForecastConsolidadoMetric
}

function sum(lines: V2ForecastLine[], movementClasses: string[]) {
  return lines
    .filter(line => movementClasses.includes(line.movementClass))
    .reduce((total, line) => total + line.forecast, 0)
}

function metric(lines: V2ForecastLine[]): ForecastConsolidadoMetric {
  const revenue = sum(lines, ['receita'])
  const operatingCosts = sum(lines, ['custo', 'opex', 'imposto'])
  const financialResult = sum(lines, ['financeiro'])
  const capex = sum(lines, ['capex'])
  return { revenue, operatingCosts, financialResult, capex, result: revenue + operatingCosts + financialResult + capex }
}

export function buildForecastConsolidado(report: V2ForecastReport): ForecastConsolidadoReport {
  const byPeriod = new Map<string, V2ForecastLine[]>()
  for (const line of report.lines) {
    const current = byPeriod.get(line.period) ?? []
    current.push(line)
    byPeriod.set(line.period, current)
  }

  const rows = report.annualPeriods.map(period => {
    const lines = byPeriod.get(period) ?? []
    return {
      period,
      revenue: sum(lines, ['receita']),
      operatingCosts: sum(lines, ['custo', 'opex', 'imposto']),
      financialResult: sum(lines, ['financeiro']),
      capex: sum(lines, ['capex']),
      result: metric(lines).result,
      status: period <= report.cutoffPeriod ? 'realizado' : 'projetado',
    }
  })

  const realized = metric(report.lines.filter(line => line.status === 'realizado'))
  const projected = metric(report.lines.filter(line => line.status === 'projetado'))

  return {
    cutoffPeriod: report.cutoffPeriod,
    rows,
    total: metric(report.lines),
    realized,
    projected,
  }
}

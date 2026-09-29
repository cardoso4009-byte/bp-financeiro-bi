import type { V2ForecastLine } from './v2-forecast'

export interface WorkingCapitalForecastAssumptions {
  pmrDias: number
  pmeDias: number
  pmpDias: number
}

export interface WorkingCapitalForecastLine {
  period: string
  revenue: number
  operatingCost: number
  receivables: number
  inventory: number
  payables: number
  workingCapitalNeed: number
  cashImpact: number
}

export interface WorkingCapitalForecastReport {
  assumptions: WorkingCapitalForecastAssumptions
  lines: WorkingCapitalForecastLine[]
  totalCashImpact: number
}

export function buildWorkingCapitalForecast(
  lines: V2ForecastLine[],
  futurePeriods: string[],
  assumptions: WorkingCapitalForecastAssumptions,
): WorkingCapitalForecastReport {
  const projected: WorkingCapitalForecastLine[] = []
  for (const period of futurePeriods) {
    const periodLines = lines.filter(line => line.period === period && line.status === 'projetado')
    const revenue = periodLines
      .filter(line => line.movementClass === 'receita')
      .reduce((sum, line) => sum + Math.max(line.forecast, 0), 0)
    const operatingCost = periodLines
      .filter(line => line.movementClass === 'custo' || line.movementClass === 'opex')
      .reduce((sum, line) => sum + Math.abs(line.forecast), 0)
    const receivables = revenue * assumptions.pmrDias / 30
    const inventory = periodLines
      .filter(line => line.movementClass === 'custo')
      .reduce((sum, line) => sum + Math.abs(line.forecast), 0) * assumptions.pmeDias / 30
    const payables = operatingCost * assumptions.pmpDias / 30
    const workingCapitalNeed = receivables + inventory - payables
    const previous = projected.at(-1)?.workingCapitalNeed ?? initialWorkingCapitalNeed
    const cashImpact = previous - workingCapitalNeed

    projected.push({
      period,
      revenue,
      operatingCost,
      receivables,
      inventory,
      payables,
      workingCapitalNeed,
      cashImpact,
    })
  }

  return {
    assumptions,
    lines: projected,
    totalCashImpact: projected.reduce((sum, line) => sum + line.cashImpact, 0),
  }
}

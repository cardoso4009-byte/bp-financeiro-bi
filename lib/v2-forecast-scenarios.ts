import type { V2ForecastLine } from './v2-forecast'

export type ForecastScenario = 'base' | 'conservador' | 'agressivo'

export interface ForecastScenarioDefinition {
  id: ForecastScenario
  label: string
  description: string
  revenueFactor: number
  expenseFactor: number
}

export const FORECAST_SCENARIOS: ForecastScenarioDefinition[] = [
  { id:'base', label:'Base', description:'Mantém o Forecast oficial sem alteração.', revenueFactor:1, expenseFactor:1 },
  { id:'conservador', label:'Conservador', description:'Aplica redução de 5% na receita e aumento de 3% nos gastos.', revenueFactor:0.95, expenseFactor:1.03 },
  { id:'agressivo', label:'Agressivo', description:'Aplica aumento de 5% na receita e redução de 3% nos gastos.', revenueFactor:1.05, expenseFactor:0.97 },
]

export interface ForecastScenarioResult {
  scenario: ForecastScenarioDefinition
  revenue: number
  expenses: number
  capex: number
  result: number
  deltaToBase: number
}

function factorForClass(line: V2ForecastLine, scenario: ForecastScenarioDefinition): number {
  if (line.movementClass === 'receita') return scenario.revenueFactor
  if (['custo','opex','financeiro','imposto','capex'].includes(line.movementClass)) return scenario.expenseFactor
  return 1
}

export function buildForecastScenario(lines: V2ForecastLine[], scenarioId: ForecastScenario): ForecastScenarioResult {
  const scenario = FORECAST_SCENARIOS.find(item=>item.id===scenarioId) ?? FORECAST_SCENARIOS[0]
  const revenue = lines.reduce((sum,line)=>sum+(line.movementClass==='receita'?line.forecast*factorForClass(line,scenario):0),0)
  const expenses = lines.reduce((sum,line)=>sum+(line.movementClass!=='receita'?line.forecast*factorForClass(line,scenario):0),0)
  const capex = lines.reduce((sum,line)=>sum+(line.movementClass==='capex'?line.forecast*factorForClass(line,scenario):0),0)
  const result = revenue + expenses
  const base = scenarioId==='base' ? result : buildForecastScenario(lines,'base').result
  return {scenario,revenue,expenses,capex,result,deltaToBase:result-base}
}


export interface ScenarioCashBridgeRow {
  period: string
  opening: number
  operatingCash: number
  capexCash: number
  workingCapitalImpact: number
  netCashImpact: number
  closing: number
}

export interface ScenarioCashBridgeReport {
  rows: ScenarioCashBridgeRow[]
  finalCash: number
  minimumCash: number
}

type CapexScheduleLike = { competence: string; plannedAmount: number }

type WorkingCapitalImpactLike = { period: string; cashImpact: number }

export function buildScenarioCashBridge(
  lines: V2ForecastLine[],
  periods: string[],
  scenarioId: ForecastScenario,
  capexSchedule: CapexScheduleLike[],
  workingCapitalLines: WorkingCapitalImpactLike[],
  initialCash = 50000,
): ScenarioCashBridgeReport {
  const scenario = FORECAST_SCENARIOS.find(item=>item.id===scenarioId) ?? FORECAST_SCENARIOS[0]
  let closing = initialCash
  const rows = periods.map(period => {
    const periodLines = lines.filter(line => line.period === period && line.status === 'projetado')
    const operatingCash = periodLines.reduce((sum,line) => {
      if (line.movementClass === 'capex') return sum
      return sum + line.forecast * factorForClass(line, scenario)
    }, 0)
    const scheduledCapex = capexSchedule
      .filter(entry => entry.competence === period)
      .reduce((sum,entry) => sum + Math.abs(entry.plannedAmount), 0)
    const capexCash = -scheduledCapex * scenario.expenseFactor
    const workingCapitalImpact = workingCapitalLines.find(line => line.period === period)?.cashImpact ?? 0
    const opening = closing
    const netCashImpact = operatingCash + capexCash + workingCapitalImpact
    closing = opening + netCashImpact
    return {period, opening, operatingCash, capexCash, workingCapitalImpact, netCashImpact, closing}
  })
  return {
    rows,
    finalCash: rows.at(-1)?.closing ?? initialCash,
    minimumCash: rows.length ? Math.min(...rows.map(row=>row.closing)) : initialCash,
  }
}

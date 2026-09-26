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
  const result = revenue + expenses
  const base = scenarioId==='base' ? result : buildForecastScenario(lines,'base').result
  return {scenario,revenue,expenses,result,deltaToBase:result-base}
}

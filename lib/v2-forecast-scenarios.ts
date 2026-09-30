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

export interface WorkingCapitalScenarioInput { pmrDias: number; pmeDias: number; pmpDias: number; receitaMensal: number; custoMensal: number }

export interface ForecastScenarioResult {
  scenario: ForecastScenarioDefinition
  revenue: number
  expenses: number
  capex: number
  result: number
  deltaToBase: number
  workingCapitalCashImpact: number
  cycleFinanceiro: number
}

function factorForClass(line: V2ForecastLine, scenario: ForecastScenarioDefinition): number {
  if (line.movementClass === 'receita') return scenario.revenueFactor
  if (['custo','opex','financeiro','imposto','capex'].includes(line.movementClass)) return scenario.expenseFactor
  return 1
}

export function buildForecastScenario(lines: V2ForecastLine[], scenarioId: ForecastScenario, workingCapital?: WorkingCapitalScenarioInput): ForecastScenarioResult {
  const scenario = FORECAST_SCENARIOS.find(item=>item.id===scenarioId) ?? FORECAST_SCENARIOS[0]
  const revenue = lines.reduce((sum,line)=>sum+(line.movementClass==='receita'?line.forecast*factorForClass(line,scenario):0),0)
  const expenses = lines.reduce((sum,line)=>sum+(line.movementClass!=='receita'?line.forecast*factorForClass(line,scenario):0),0)
  const capex = lines.reduce((sum,line)=>sum+(line.movementClass==='capex'?line.forecast*factorForClass(line,scenario):0),0)
  const result = revenue + expenses
  const base = scenarioId==='base' ? result : buildForecastScenario(lines,'base',workingCapital).result
  const wc = workingCapital ? calculateWorkingCapitalScenario(workingCapital, scenario.revenueFactor, scenario.expenseFactor) : { cashImpact: 0, cycle: 0 }
  return {scenario,revenue,expenses,capex,result,deltaToBase:result-base,workingCapitalCashImpact:wc.cashImpact,cycleFinanceiro:wc.cycle}
}

function calculateWorkingCapitalScenario(input: WorkingCapitalScenarioInput, revenueFactor: number, expenseFactor: number) {
  const receita = input.receitaMensal * revenueFactor
  const custo = input.custoMensal * expenseFactor
  const current = receita * input.pmrDias / 30 + custo * input.pmeDias / 30 - custo * input.pmpDias / 30
  const baseline = receita * 30 / 30 + custo * 30 / 30 - custo * 30 / 30
  return { cashImpact: baseline - current, cycle: input.pmrDias + input.pmeDias - input.pmpDias }
}

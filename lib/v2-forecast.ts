import type { CostCenter, MovementClass } from './v2-data-model'
import type { V2FinancialBase, V2BaseRecord } from './v2-financial-base'
import type { V2BudgetEntry } from './v2-budget'

export type ForecastSource = 'manual' | 'budget' | 'run_rate'
export type ForecastStatus = 'realizado' | 'projetado'

export interface V2ForecastEntry {
  id: string
  companyId: string
  period: string
  costCenterId?: string
  movementClass: MovementClass
  amount: number
  source: ForecastSource
  description?: string
}

export interface V2ForecastLine {
  period: string
  costCenterId?: string
  costCenterCode: string
  costCenterName: string
  movementClass: MovementClass
  budget: number
  actual: number
  forecast: number
  budgetVariance: number
  budgetVariancePercent?: number
  forecastVariance: number
  forecastVariancePercent?: number
  status: ForecastStatus
  entries: number
}

export interface V2ForecastReport {
  cutoffPeriod: string
  annualPeriods: string[]
  lines: V2ForecastLine[]
  budgetTotal: number
  actualTotal: number
  forecastTotal: number
  budgetGap: number
  forecastGap: number
  actualEntries: number
  forecastEntries: number
  unassignedForecastEntries: number
}

function contribution(entry: V2BaseRecord): number {
  if (entry.movementClass === 'receita') return entry.nature === 'credit' ? entry.amount : -entry.amount
  if (entry.movementClass === 'capex') return entry.nature === 'debit' ? entry.amount : -entry.amount
  return entry.nature === 'debit' ? -entry.amount : entry.amount
}

function forecastContribution(entry: V2ForecastEntry): number {
  return entry.movementClass === 'receita' ? entry.amount : -entry.amount
}

function budgetContribution(entry: V2BudgetEntry): number {
  if (entry.movementClass === 'receita') return Math.abs(entry.amount)
  if (entry.movementClass === 'capex') return Math.abs(entry.amount)
  return -Math.abs(entry.amount)
}

function key(period: string, costCenterId: string | undefined, movementClass: MovementClass): string {
  return [period, costCenterId ?? '', movementClass].join('|')
}

function percent(value: number, base: number): number | undefined {
  return Math.abs(base) >= 0.005 ? value / Math.abs(base) : undefined
}

export function buildV2ForecastReport(
  base: V2FinancialBase,
  budgetEntries: V2BudgetEntry[],
  forecastEntries: V2ForecastEntry[],
  centers: CostCenter[],
  cutoffPeriod: string,
  annualPeriods: string[],
): V2ForecastReport {
  const actual = base.entries.filter(entry => annualPeriods.includes(entry.period))
  const budget = budgetEntries.filter(entry => annualPeriods.includes(entry.period))
  const forecast = forecastEntries.filter(entry => annualPeriods.includes(entry.period))
  const known = new Map(centers.map(center => [center.id, center]))
  const aggregates = new Map<string, { period:string; costCenterId?:string; movementClass:MovementClass; budget:number; actual:number; forecast:number; entries:number; status:ForecastStatus }>()

  for (const item of budget) {
    const k = key(item.period, item.costCenterId, item.movementClass)
    const current = aggregates.get(k) ?? { period:item.period, costCenterId:item.costCenterId, movementClass:item.movementClass, budget:0, actual:0, forecast:0, entries:0, status:'projetado' as ForecastStatus }
    current.budget += budgetContribution(item)
    aggregates.set(k, current)
  }

  for (const item of actual) {
    const k = key(item.period, item.costCenterId, item.movementClass)
    const current = aggregates.get(k) ?? { period:item.period, costCenterId:item.costCenterId, movementClass:item.movementClass, budget:0, actual:0, forecast:0, entries:0, status:'projetado' as ForecastStatus }
    current.actual += contribution(item)
    current.entries += 1
    aggregates.set(k, current)
  }

  for (const item of forecast) {
    const k = key(item.period, item.costCenterId, item.movementClass)
    const current = aggregates.get(k) ?? { period:item.period, costCenterId:item.costCenterId, movementClass:item.movementClass, budget:0, actual:0, forecast:0, entries:0, status:'projetado' as ForecastStatus }
    current.forecast += forecastContribution(item)
    aggregates.set(k, current)
  }

  for (const item of aggregates.values()) {
    if (item.period <= cutoffPeriod) {
      item.forecast = item.actual
      item.status = 'realizado'
    }
  }

  const lines = [...aggregates.values()].map(item => {
    const center = item.costCenterId ? known.get(item.costCenterId) : undefined
    const budgetVariance = item.forecast - item.budget
    const forecastVariance = item.actual - item.forecast
    return {
      period:item.period,
      costCenterId:item.costCenterId,
      costCenterCode:center?.code ?? 'SEM-CC',
      costCenterName:center?.name ?? 'Sem centro de resultado',
      movementClass:item.movementClass,
      budget:item.budget,
      actual:item.actual,
      forecast:item.forecast,
      budgetVariance,
      budgetVariancePercent:percent(budgetVariance,item.budget),
      forecastVariance,
      forecastVariancePercent:percent(forecastVariance,item.forecast),
      status:item.status,
      entries:item.entries,
    }
  }).sort((a,b)=>Math.abs(b.budgetVariance)-Math.abs(a.budgetVariance))

  const actualTotal = actual.reduce((sum,item)=>sum+contribution(item),0)
  const budgetTotal = budget.reduce((sum,item)=>sum+budgetContribution(item),0)
  const forecastTotal = lines.reduce((sum,item)=>sum+item.forecast,0)

  return {
    cutoffPeriod,
    annualPeriods,
    lines,
    budgetTotal,
    actualTotal,
    forecastTotal,
    budgetGap:forecastTotal-budgetTotal,
    forecastGap:actualTotal-forecastTotal,
    actualEntries:actual.length,
    forecastEntries:forecast.length,
    unassignedForecastEntries:forecast.filter(item=>!item.costCenterId).length,
  }
}

export function validateV2ForecastEntries(entries: V2ForecastEntry[]): string[] {
  const errors:string[]=[]
  const ids=new Set<string>()
  for(const entry of entries){
    if(!entry.id) errors.push('Forecast sem id.')
    if(ids.has(entry.id)) errors.push(`ID de forecast duplicado: ${entry.id}`)
    ids.add(entry.id)
    if(!/^\d{4}-\d{2}$/.test(entry.period)) errors.push(`Competência inválida: ${entry.period}`)
    if(!Number.isFinite(entry.amount)) errors.push(`Valor inválido: ${entry.id}`)
    if(!entry.companyId) errors.push(`Empresa ausente: ${entry.id}`)
    if(!['manual','budget','run_rate'].includes(entry.source)) errors.push(`Fonte de forecast inválida: ${entry.id}`)
  }
  return errors
}

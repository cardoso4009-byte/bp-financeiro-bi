import type { CostCenter, MovementClass } from './v2-data-model'
import type { V2FinancialBase, V2BaseRecord } from './v2-financial-base'
import type { V2BudgetEntry } from './v2-budget'
import type { ForecastSource, V2ForecastEntry } from './v2-forecast'

export interface ForecastEngineOptions {
  companyId: string
  cutoffPeriod: string
  futurePeriods: string[]
  lookbackPeriods?: string[]
  source?: ForecastSource
}

export interface ForecastEngineResult {
  entries: V2ForecastEntry[]
  source: ForecastSource
  generatedPeriods: string[]
  dimensions: number
}

function contribution(entry: V2BaseRecord): number {
  if (entry.movementClass === 'receita') return entry.nature === 'credit' ? entry.amount : -entry.amount
  if (entry.movementClass === 'capex') return entry.nature === 'debit' ? entry.amount : -entry.amount
  return entry.nature === 'debit' ? -entry.amount : entry.amount
}

function amountFromSigned(value: number): number {
  return Math.abs(value)
}

function key(period: string, costCenterId: string | undefined, movementClass: MovementClass): string {
  return [period, costCenterId ?? '', movementClass].join('|')
}

function dimensionKey(costCenterId: string | undefined, movementClass: MovementClass): string {
  return [costCenterId ?? '', movementClass].join('|')
}

function budgetAmount(entry: V2BudgetEntry): number {
  return Math.abs(entry.amount)
}

export function buildBudgetForecastEntries(
  budgetEntries: V2BudgetEntry[],
  options: ForecastEngineOptions,
): V2ForecastEntry[] {
  const future = new Set(options.futurePeriods)
  return budgetEntries
    .filter(entry => future.has(entry.period))
    .map(entry => ({
      id: `forecast-budget-${entry.id}`,
      companyId: entry.companyId || options.companyId,
      period: entry.period,
      costCenterId: entry.costCenterId,
      movementClass: entry.movementClass,
      amount: budgetAmount(entry),
      source: 'budget' as const,
      description: entry.description ?? 'Forecast gerado a partir do orçamento',
    }))
}

export function buildRunRateForecastEntries(
  base: V2FinancialBase,
  centers: CostCenter[],
  options: ForecastEngineOptions,
): V2ForecastEntry[] {
  const periods = options.lookbackPeriods ?? []
  if (periods.length === 0 || options.futurePeriods.length === 0) return []

  const allowed = new Set(periods)
  const dimensions = new Map<string, { companyId: string; costCenterId?: string; movementClass: MovementClass; total: number }>()

  for (const entry of base.entries) {
    if (!allowed.has(entry.period)) continue
    const k = dimensionKey(entry.costCenterId, entry.movementClass)
    const current = dimensions.get(k) ?? {
      companyId: entry.companyId,
      costCenterId: entry.costCenterId,
      movementClass: entry.movementClass,
      total: 0,
    }
    current.total += contribution(entry)
    dimensions.set(k, current)
  }

  const validCenterIds = new Set(centers.map(center => center.id))
  return [...dimensions.values()].flatMap(dimension => {
    if (dimension.costCenterId && !validCenterIds.has(dimension.costCenterId)) return []
    const average = dimension.total / periods.length
    if (!Number.isFinite(average) || Math.abs(average) < 0.005) return []

    return options.futurePeriods.map(period => ({
      id: `forecast-run-rate-${period}-${dimension.costCenterId ?? 'sem-cc'}-${dimension.movementClass}`,
      companyId: dimension.companyId || options.companyId,
      period,
      costCenterId: dimension.costCenterId,
      movementClass: dimension.movementClass,
      amount: amountFromSigned(average),
      source: 'run_rate' as const,
      description: `Run rate: média dos últimos ${periods.length} períodos`,
    }))
  })
}

const SOURCE_PRIORITY: Record<ForecastSource, number> = {
  run_rate: 1,
  budget: 2,
  manual: 3,
}

export function mergeForecastSources(...sources: V2ForecastEntry[][]): V2ForecastEntry[] {
  const selected = new Map<string, V2ForecastEntry[]>()

  for (const entries of sources) {
    for (const entry of entries) {
      const k = key(entry.period, entry.costCenterId, entry.movementClass)
      const current = selected.get(k) ?? []
      current.push(entry)
      selected.set(k, current)
    }
  }

  return [...selected.values()].flatMap(entries => {
    const maxPriority = Math.max(...entries.map(entry => SOURCE_PRIORITY[entry.source]))
    const preferred = entries.filter(entry => SOURCE_PRIORITY[entry.source] === maxPriority)
    if (preferred.length === 1) return preferred
    const first = preferred[0]
    return [{
      ...first,
      id: `forecast-merged-${first.period}-${first.costCenterId ?? 'sem-cc'}-${first.movementClass}-${first.source}`,
      amount: preferred.reduce((sum, entry) => sum + entry.amount, 0),
      description: preferred.map(entry => entry.description).filter(Boolean).join(' • ') || first.description,
    }]
  }).sort((a, b) => a.period.localeCompare(b.period) || a.movementClass.localeCompare(b.movementClass))
}

export function buildV2ForecastEngine(
  base: V2FinancialBase,
  budgetEntries: V2BudgetEntry[],
  centers: CostCenter[],
  options: ForecastEngineOptions,
): ForecastEngineResult {
  const budget = options.source === 'budget' || options.source === undefined
    ? buildBudgetForecastEntries(budgetEntries, options)
    : []
  const runRate = options.source === 'run_rate' || options.source === undefined
    ? buildRunRateForecastEntries(base, centers, options)
    : []

  const entries = options.source === 'budget'
    ? budget
    : options.source === 'run_rate'
      ? runRate
      : mergeForecastSources(budget, runRate)

  return {
    entries,
    source: options.source ?? 'budget',
    generatedPeriods: [...new Set(entries.map(entry => entry.period))].sort(),
    dimensions: new Set(entries.map(entry => dimensionKey(entry.costCenterId, entry.movementClass))).size,
  }
}

export function validateForecastEngineResult(entries: V2ForecastEntry[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const keys = new Set<string>()

  for (const entry of entries) {
    if (ids.has(entry.id)) errors.push(`ID duplicado no motor: ${entry.id}`)
    ids.add(entry.id)
    const k = key(entry.period, entry.costCenterId, entry.movementClass)
    if (keys.has(k)) errors.push(`Dimensão duplicada no forecast final: ${k}`)
    keys.add(k)
    if (entry.amount < 0) errors.push(`Forecast com valor negativo: ${entry.id}`)
  }

  return errors
}

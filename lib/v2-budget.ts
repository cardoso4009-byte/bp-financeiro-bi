import type { CostCenter, MovementClass } from './v2-data-model'
import type { V2FinancialBase, V2BaseRecord } from './v2-financial-base'

export interface V2BudgetEntry {
  id: string
  companyId: string
  period: string
  accountId?: string
  costCenterId?: string
  movementClass: MovementClass
  amount: number
  description?: string
}

export interface V2BudgetLine {
  period: string
  costCenterId?: string
  costCenterCode: string
  costCenterName: string
  movementClass: MovementClass
  budget: number
  actual: number
  variance: number
  variancePercent?: number
  entries: number
}

export interface V2BudgetReport {
  period: string
  lines: V2BudgetLine[]
  budgetTotal: number
  actualTotal: number
  varianceTotal: number
  budgetEntries: number
  actualEntries: number
  unassignedBudgetEntries: number
  unassignedActualEntries: number
}

function actualContribution(entry: V2BaseRecord): number {
  if (entry.movementClass === 'receita') {
    return entry.nature === 'credit' ? entry.amount : -entry.amount
  }
  if (entry.movementClass === 'capex') {
    return entry.nature === 'debit' ? entry.amount : -entry.amount
  }
  return entry.nature === 'debit' ? -entry.amount : entry.amount
}

function key(period: string, costCenterId: string | undefined, movementClass: MovementClass): string {
  return [period, costCenterId ?? '', movementClass].join('|')
}

function percent(variance: number, budget: number): number | undefined {
  return Math.abs(budget) >= 0.005 ? variance / Math.abs(budget) : undefined
}

export function buildV2BudgetReport(
  base: V2FinancialBase,
  budgetEntries: V2BudgetEntry[],
  centers: CostCenter[],
  period: string,
): V2BudgetReport {
  const actual = base.entries.filter(entry => entry.period === period)
  const budget = budgetEntries.filter(entry => entry.period === period)
  const known = new Map(centers.map(center => [center.id, center]))
  const aggregates = new Map<string, { period:string; costCenterId?:string; movementClass:MovementClass; budget:number; actual:number; entries:number }>()

  for (const item of budget) {
    const k = key(item.period, item.costCenterId, item.movementClass)
    const current = aggregates.get(k) ?? { period:item.period, costCenterId:item.costCenterId, movementClass:item.movementClass, budget:0, actual:0, entries:0 }
    current.budget += item.amount
    aggregates.set(k, current)
  }

  for (const item of actual) {
    const k = key(item.period, item.costCenterId, item.movementClass)
    const current = aggregates.get(k) ?? { period:item.period, costCenterId:item.costCenterId, movementClass:item.movementClass, budget:0, actual:0, entries:0 }
    current.actual += actualContribution(item)
    current.entries += 1
    aggregates.set(k, current)
  }

  const lines = [...aggregates.values()]
    .map(item => {
      const center = item.costCenterId ? known.get(item.costCenterId) : undefined
      const variance = item.actual - item.budget
      return {
        period: item.period,
        costCenterId: item.costCenterId,
        costCenterCode: center?.code ?? 'SEM-CC',
        costCenterName: center?.name ?? 'Sem centro de resultado',
        movementClass: item.movementClass,
        budget: item.budget,
        actual: item.actual,
        variance,
        variancePercent: percent(variance, item.budget),
        entries: item.entries,
      }
    })
    .sort((a,b) => Math.abs(b.variance) - Math.abs(a.variance))

  return {
    period,
    lines,
    budgetTotal: budget.reduce((sum, item) => sum + item.amount, 0),
    actualTotal: actual.reduce((sum, item) => sum + actualContribution(item), 0),
    varianceTotal: actual.reduce((sum, item) => sum + actualContribution(item), 0) - budget.reduce((sum, item) => sum + item.amount, 0),
    budgetEntries: budget.length,
    actualEntries: actual.length,
    unassignedBudgetEntries: budget.filter(item => !item.costCenterId).length,
    unassignedActualEntries: actual.filter(item => !item.costCenterId).length,
  }
}

export function validateV2BudgetEntries(entries: V2BudgetEntry[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const entry of entries) {
    if (!entry.id) errors.push('Orçamento sem id.')
    if (ids.has(entry.id)) errors.push(`ID de orçamento duplicado: ${entry.id}`)
    ids.add(entry.id)
    if (!/^\d{4}-\d{2}$/.test(entry.period)) errors.push(`Competência inválida: ${entry.period}`)
    if (!Number.isFinite(entry.amount)) errors.push(`Valor inválido: ${entry.id}`)
    if (!entry.companyId) errors.push(`Empresa ausente: ${entry.id}`)
  }
  return errors
}

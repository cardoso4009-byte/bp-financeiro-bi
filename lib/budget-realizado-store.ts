import { initialBudget, type BudgetPlan } from './budget-plan-data'

export const BUDGET_STORAGE_KEY = 'bp-financeiro-orcamento-2026'

export function readBudgetPlan(): BudgetPlan[] {
  if (typeof window === 'undefined') return initialBudget
  try {
    const raw = window.localStorage.getItem(BUDGET_STORAGE_KEY)
    if (!raw) return initialBudget
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return initialBudget
    return parsed.filter((row): row is BudgetPlan =>
      row && typeof row.month === 'string' &&
      typeof row.revenue === 'number' && Number.isFinite(row.revenue) &&
      typeof row.cost === 'number' && Number.isFinite(row.cost) &&
      typeof row.opex === 'number' && Number.isFinite(row.opex) &&
      typeof row.capex === 'number' && Number.isFinite(row.capex)
    )
  } catch {
    return initialBudget
  }
}

export function writeBudgetPlan(rows: BudgetPlan[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(rows))
}

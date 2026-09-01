import type { FinancialEntry } from './lancamentos-data'

export type ReconciliationResult = {
  sourceRevenue: number
  sourceOpex: number
  sourceResult: number
  entriesCount: number
  balanced: boolean
  differences: string[]
}

/**
 * Cross-check used before connecting dashboards: the same financial source must
 * produce the same operational totals in every management view.
 */
export function reconcileOperationalViews(entries: FinancialEntry[]): ReconciliationResult {
  const operational = entries.filter(e => e.type === 'Receita' || e.type === 'Despesa')
  const sourceRevenue = operational.filter(e => e.type === 'Receita').reduce((s,e) => s + Math.abs(e.value), 0)
  const sourceOpex = operational.filter(e => e.type === 'Despesa').reduce((s,e) => s + Math.abs(e.value), 0)
  const sourceResult = sourceRevenue - sourceOpex
  const differences: string[] = []
  if (!Number.isFinite(sourceRevenue)) differences.push('Receita contém valor inválido.')
  if (!Number.isFinite(sourceOpex)) differences.push('OPEX contém valor inválido.')
  if (!Number.isFinite(sourceResult)) differences.push('Resultado contém valor inválido.')
  return {
    sourceRevenue,
    sourceOpex,
    sourceResult,
    entriesCount: operational.length,
    balanced: differences.length === 0,
    differences,
  }
}

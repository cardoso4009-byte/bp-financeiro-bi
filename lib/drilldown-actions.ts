import type { FinancialEntry } from './lancamentos-data'
import { buildFinancialDrilldown, type DrillNode } from './drilldown-model'

export function drilldownEntries(entries: FinancialEntry[], accountResolver?: (e: FinancialEntry) => string): FinancialEntry[] {
  const roots = buildFinancialDrilldown(entries, accountResolver)
  const result: FinancialEntry[] = []
  const walk = (nodes: DrillNode[]) => {
    for (const node of nodes) {
      if (node.entry) result.push(node.entry)
      if (node.children.length) walk(node.children)
    }
  }
  walk(roots)
  return result
}

export function findDrilldownEntry(entries: FinancialEntry[], id: number) {
  return entries.find(e => e.id === id) ?? null
}

export function drilldownPath(entries: FinancialEntry[], id: number, accountResolver?: (e: FinancialEntry) => string) {
  const entry = findDrilldownEntry(entries, id)
  if (!entry) return []
  return [
    accountResolver?.(entry) || entry.category || 'Sem conta',
    entry.costCenter || 'Sem centro de custo',
    entry.category || 'Sem categoria',
    entry.competence || entry.date?.slice(0, 7) || 'Sem competência',
    entry.description || `Lançamento ${entry.id}`,
  ]
}

import type { FinancialEntry } from './lancamentos-data'
import { buildFinancialDrilldown, type DrillNode } from './drilldown-model'

export function buildManagementDrilldown(entries: FinancialEntry[], accountResolver?: (entry: FinancialEntry) => string) {
  return buildFinancialDrilldown(entries, accountResolver)
}

export function flattenDrillEntries(nodes: DrillNode[]): FinancialEntry[] {
  const result: FinancialEntry[] = []
  const visit = (node: DrillNode) => {
    if (node.dimension === 'entry' && node.entry) result.push(node.entry)
    node.children.forEach(visit)
  }
  nodes.forEach(visit)
  return result
}

export function findDrillEntry(nodes: DrillNode[], id: number): FinancialEntry | null {
  let found: FinancialEntry | null = null
  const visit = (node: DrillNode) => {
    if (found) return
    if (node.dimension === 'entry' && node.entry?.id === id) {
      found = node.entry
      return
    }
    node.children.forEach(visit)
  }
  nodes.forEach(visit)
  return found
}

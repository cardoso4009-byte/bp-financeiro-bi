import type { FinancialEntry } from './lancamentos-data'
import { buildFinancialDrilldown, type DrillNode } from './drilldown-model'

/** Adapter for the DRE: keeps the DRE responsible for accounting presentation while the shared model owns navigation. */
export function buildDREDrilldown(entries: FinancialEntry[], accountResolver?: (e: FinancialEntry) => string): DrillNode[] {
  return buildFinancialDrilldown(entries, accountResolver)
}

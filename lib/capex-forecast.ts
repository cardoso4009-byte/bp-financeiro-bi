import type { CapexCashSchedule } from './capex-cashflow'
import type { V2ForecastEntry } from './v2-forecast'

export function buildCapexForecastEntries(
  schedule: CapexCashSchedule[],
  companyId: string,
  cutoffPeriod: string,
): V2ForecastEntry[] {
  return schedule
    .filter(item => item.companyId === companyId && item.period > cutoffPeriod && item.plannedAmount > item.realizedAmount)
    .map(item => ({
      id: `capex-forecast-${item.id}`,
      companyId,
      period: item.period,
      movementClass: 'capex',
      amount: Math.max(item.plannedAmount - item.realizedAmount, 0),
      source: 'capex',
      description: `CAPEX ${item.projectId} • desembolso futuro`,
    }))
}

export function capexForecastTotal(entries: V2ForecastEntry[]): number {
  return entries
    .filter(entry => entry.source === 'capex')
    .reduce((sum, entry) => sum + entry.amount, 0)
}

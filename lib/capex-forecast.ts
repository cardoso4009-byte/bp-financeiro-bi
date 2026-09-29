import type { V2ForecastEntry } from './v2-forecast'
import type { CapexScheduleEntry } from './capex-schedule'
import type { CapexProject } from './capex'
import type { MovementClass } from './v2-data-model'
import type { ForecastSource } from './v2-forecast'

export function buildCapexForecastEntries(
  schedule: CapexScheduleEntry[],
  projects: CapexProject[],
  options: { companyId: string; cutoffPeriod: string },
): V2ForecastEntry[] {
  const validProjects = new Map(projects.map(project => [project.id, project]))
  return schedule
    .filter(item => item.competence > options.cutoffPeriod && item.plannedAmount > 0 && validProjects.has(item.projectId))
    .map(item => ({
      id: `capex-forecast-${item.id}`,
      companyId: options.companyId,
      period: item.competence,
      movementClass: 'capex' as MovementClass,
      amount: item.plannedAmount,
      source: 'capex' as ForecastSource,
      description: `CAPEX programado • ${validProjects.get(item.projectId)?.code ?? item.projectId}`,
    }))
}

import type { MovementClass } from './v2-data-model'
import type { V2BudgetLine } from './v2-budget'

export type ManagementAlertLevel = 'normal' | 'atencao' | 'critico'
export type ManagementCauseType = 'volume' | 'preco' | 'mix' | 'timing' | 'nao_classificada' | 'outro'
export type ManagementActionStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'

export interface V2ManagementAlert {
  id: string
  period: string
  costCenterId?: string
  movementClass: MovementClass
  label: string
  budget: number
  actual: number
  variance: number
  variancePercent?: number
  level: ManagementAlertLevel
  sourceEntries: number
  causeType?: ManagementCauseType
  causeNote?: string
  actionIds: string[]
  createdAt: string
  updatedAt: string
}

export interface V2ManagementAction {
  id: string
  alertId: string
  description: string
  owner?: string
  dueDate?: string
  status: ManagementActionStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface V2ManagementThresholds {
  attentionPercent: number
  criticalPercent: number
  attentionAbsolute?: number
  criticalAbsolute?: number
}

export const DEFAULT_MANAGEMENT_THRESHOLDS: V2ManagementThresholds = {
  attentionPercent: 0.03,
  criticalPercent: 0.05,
  attentionAbsolute: 0,
  criticalAbsolute: 0,
}

export function classifyManagementAlert(
  variance: number,
  variancePercent: number | undefined,
  thresholds: V2ManagementThresholds = DEFAULT_MANAGEMENT_THRESHOLDS,
): ManagementAlertLevel {
  const pct = Math.abs(variancePercent ?? 0)
  const absolute = Math.abs(variance)
  const critical = pct >= thresholds.criticalPercent || absolute >= (thresholds.criticalAbsolute ?? 0) && (thresholds.criticalAbsolute ?? 0) > 0
  if (critical) return 'critico'
  const attention = pct >= thresholds.attentionPercent || absolute >= (thresholds.attentionAbsolute ?? 0) && (thresholds.attentionAbsolute ?? 0) > 0
  if (attention) return 'atencao'
  return 'normal'
}

export function buildManagementAlert(
  line: V2BudgetLine,
  thresholds: V2ManagementThresholds = DEFAULT_MANAGEMENT_THRESHOLDS,
  now = new Date().toISOString(),
): V2ManagementAlert {
  return {
    id: ['alert', line.period, line.costCenterId ?? 'sem-cc', line.movementClass].join('-'),
    period: line.period,
    costCenterId: line.costCenterId,
    movementClass: line.movementClass,
    label: line.costCenterName === 'Sem centro de resultado' ? line.movementClass : `${line.costCenterCode} • ${line.movementClass}`,
    budget: line.budget,
    actual: line.actual,
    variance: line.variance,
    variancePercent: line.variancePercent,
    level: classifyManagementAlert(line.variance, line.variancePercent, thresholds),
    sourceEntries: line.entries,
    actionIds: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function buildManagementAlerts(
  lines: V2BudgetLine[],
  thresholds: V2ManagementThresholds = DEFAULT_MANAGEMENT_THRESHOLDS,
): V2ManagementAlert[] {
  return lines.map(line => buildManagementAlert(line, thresholds))
}

export function createManagementAction(
  alertId: string,
  description: string,
  now = new Date().toISOString(),
): V2ManagementAction {
  const id = `action-${alertId}-${Date.parse(now)}`
  return { id, alertId, description, status: 'aberta', createdAt: now, updatedAt: now }
}

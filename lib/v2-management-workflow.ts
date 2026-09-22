import type { V2BaseRecord } from './v2-financial-base'
import type { V2ManagementAction, V2ManagementAlert, ManagementCauseType, ManagementActionStatus } from './v2-management'

export interface V2ManagementDrilldown {
  alert: V2ManagementAlert
  entries: V2BaseRecord[]
  actions: V2ManagementAction[]
}

export function buildManagementDrilldown(
  alert: V2ManagementAlert,
  entries: V2BaseRecord[],
  actions: V2ManagementAction[],
): V2ManagementDrilldown {
  const scoped = entries.filter(entry =>
    entry.period === alert.period &&
    entry.movementClass === alert.movementClass &&
    (alert.costCenterId ? entry.costCenterId === alert.costCenterId : !entry.costCenterId),
  )
  return {
    alert,
    entries: scoped,
    actions: actions.filter(action => action.alertId === alert.id),
  }
}

export function updateManagementAlertCause(
  alert: V2ManagementAlert,
  causeType: ManagementCauseType,
  causeNote: string,
  now = new Date().toISOString(),
): V2ManagementAlert {
  return {
    ...alert,
    causeType,
    causeNote: causeNote.trim(),
    updatedAt: now,
  }
}

export function updateManagementAction(
  action: V2ManagementAction,
  patch: Partial<Pick<V2ManagementAction, 'description' | 'owner' | 'dueDate' | 'status' | 'notes'>>,
  now = new Date().toISOString(),
): V2ManagementAction {
  return { ...action, ...patch, updatedAt: now }
}

export function validateManagementAction(
  description: string,
  status: ManagementActionStatus = 'aberta',
): string[] {
  const errors: string[] = []
  if (!description.trim()) errors.push('Descrição da ação é obrigatória.')
  if (!['aberta', 'em_andamento', 'concluida', 'cancelada'].includes(status)) errors.push('Status de ação inválido.')
  return errors
}

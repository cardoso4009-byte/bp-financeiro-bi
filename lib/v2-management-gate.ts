import { buildManagementAlerts, classifyManagementAlert, DEFAULT_MANAGEMENT_THRESHOLDS, type V2ManagementAction } from './v2-management'
import type { V2BudgetLine } from './v2-budget'

export function runV2ManagementGate(): void {
  const lines: V2BudgetLine[] = [
    { period:'2026-09', costCenterCode:'COM', costCenterName:'Comercial', movementClass:'receita', budget:10000, actual:10500, variance:500, variancePercent:0.05, entries:2 },
    { period:'2026-09', costCenterCode:'ADM', costCenterName:'Administrativo', movementClass:'opex', budget:-5000, actual:-5300, variance:-300, variancePercent:-0.06, entries:3 },
    { period:'2026-09', costCenterCode:'SEM-CC', costCenterName:'Sem centro de resultado', movementClass:'capex', budget:2000, actual:2020, variance:20, variancePercent:0.01, entries:1 },
  ]
  const alerts = buildManagementAlerts(lines, DEFAULT_MANAGEMENT_THRESHOLDS)
  if (alerts.length !== 3) throw new Error('Management Gate: quantidade de alertas inesperada.')
  if (classifyManagementAlert(500,0.05)!=='critico') throw new Error('Management Gate: limite crítico não aplicado.')
  if (classifyManagementAlert(300,0.06)!=='critico') throw new Error('Management Gate: percentual crítico não aplicado.')
  if (classifyManagementAlert(20,0.01)!=='normal') throw new Error('Management Gate: linha normal classificada incorretamente.')
  const alert = alerts[0]
  if (alert.sourceEntries !== 2 || alert.actionIds.length !== 0) throw new Error('Management Gate: rastreabilidade inicial inválida.')
  const action: V2ManagementAction = { id:'action-test', alertId:alert.id, description:'Revisar causa', status:'aberta', createdAt:'2026-09-30T00:00:00.000Z', updatedAt:'2026-09-30T00:00:00.000Z' }
  if (action.alertId !== alert.id || action.status !== 'aberta') throw new Error('Management Gate: ação não vinculada corretamente.')
  console.log('V2 Management Gate: OK')
}

if (typeof window === 'undefined') runV2ManagementGate()

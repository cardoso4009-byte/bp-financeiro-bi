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
  const entry: V2BaseRecord = { id:'entry-1', companyId:'demo', accountId:'1', description:'Teste', date:'2026-09-10', competence:'2026-09', amount:100, nature:'debit', cashBasis:'competencia', movementClass:'receita', source:'manual', reconciled:true, signedAmount:100, period:'2026-09', isCashSettled:false, costCenterId:undefined }
  const drill = buildManagementDrilldown(alert,[entry],[action])
  if (drill.entries.length !== 1 || drill.actions.length !== 1) throw new Error('Management Gate: drill-down inválido.')
  const updatedCause = updateManagementAlertCause(alert,'volume','Queda de volume')
  if (updatedCause.causeType !== 'volume' || updatedCause.causeNote !== 'Queda de volume') throw new Error('Management Gate: causa não registrada.')
  if (validateManagementAction('') .length === 0) throw new Error('Management Gate: validação de ação inválida.')
  const updatedAction = updateManagementAction(action,{status:'concluida',owner:'Controladoria'})
  if (updatedAction.status !== 'concluida' || updatedAction.owner !== 'Controladoria') throw new Error('Management Gate: atualização da ação inválida.')
  console.log('V2 Management Gate: OK')
}

if (typeof window === 'undefined') runV2ManagementGate()

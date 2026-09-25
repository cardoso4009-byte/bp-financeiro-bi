import { buildV2ForecastReport, validateV2ForecastEntries, type V2ForecastEntry } from '../lib/v2-forecast'
import { buildForecastManagementAlerts } from '../lib/v2-management'
import { buildManagementDrilldown, updateManagementAlertCause, validateManagementAction } from '../lib/v2-management-workflow'
import { createManagementAction } from '../lib/v2-management'
import { buildBudgetForecastEntries, buildManualForecastEntries, buildRunRateForecastEntries, mergeForecastSources, validateForecastEngineResult } from '../lib/v2-forecast-engine'
import { buildV2FinancialBase } from '../lib/v2-financial-base'
import type { V2BudgetEntry } from '../lib/v2-budget'

export function runV2ForecastGate(): void {
  const base = buildV2FinancialBase([
    { id:'actual-1', companyId:'demo', accountId:'1', costCenterId:'com', description:'Receita', date:'2026-09-10', competence:'2026-09', amount:1000, nature:'credit', cashBasis:'competencia', movementClass:'receita', source:'manual', reconciled:true },
    { id:'actual-2', companyId:'demo', accountId:'2', costCenterId:'adm', description:'Opex', date:'2026-09-10', competence:'2026-09', amount:400, nature:'debit', cashBasis:'competencia', movementClass:'opex', source:'manual', reconciled:true },
  ])
  const budget: V2BudgetEntry[] = [
    { id:'budget-1', companyId:'demo', period:'2026-09', costCenterId:'com', movementClass:'receita', amount:900 },
    { id:'budget-2', companyId:'demo', period:'2026-10', costCenterId:'com', movementClass:'receita', amount:1200 },
  ]
  const forecast: V2ForecastEntry[] = [
    { id:'forecast-1', companyId:'demo', period:'2026-10', costCenterId:'com', movementClass:'receita', amount:1300, source:'manual' },
    { id:'forecast-2', companyId:'demo', period:'2026-10', costCenterId:'adm', movementClass:'opex', amount:500, source:'manual' },
  ]
  const report = buildV2ForecastReport(
    base,
    budget,
    forecast,
    [{ id:'com', companyId:'demo', code:'COM', name:'Comercial', active:true }, { id:'adm', companyId:'demo', code:'ADM', name:'Administrativo', active:true }],
    '2026-09',
    ['2026-09','2026-10'],
  )
  if(report.actualTotal !== 600) throw new Error('Forecast Gate: realizado incorreto.')
  if(report.forecastTotal !== 1400) throw new Error('Forecast Gate: forecast incorreto.')
  const realized = report.lines.find(line=>line.period==='2026-09' && line.movementClass==='receita')
  if(!realized || realized.status!=='realizado' || realized.forecast!==realized.actual) throw new Error('Forecast Gate: período realizado não foi preservado.')
  const projected = report.lines.find(line=>line.period==='2026-10' && line.movementClass==='receita')
  if(!projected || projected.status!=='projetado' || projected.forecast!==1300) throw new Error('Forecast Gate: projeção futura incorreta.')
  if(validateV2ForecastEntries(forecast).length !== 0) throw new Error('Forecast Gate: validação rejeitou dados válidos.')
  if(validateV2ForecastEntries([{...forecast[0], id:''}]).length === 0) throw new Error('Forecast Gate: validação de id ausente falhou.')

  const budgetGenerated = buildBudgetForecastEntries(budget, { companyId:'demo', cutoffPeriod:'2026-09', futurePeriods:['2026-10'] })
  if(budgetGenerated.length !== 1 || budgetGenerated[0].source !== 'budget' || budgetGenerated[0].amount !== 1200) throw new Error('Forecast Gate: fonte orçamento incorreta.')

  const runRateGenerated = buildRunRateForecastEntries(base, [{ id:'com', companyId:'demo', code:'COM', name:'Comercial', active:true }, { id:'adm', companyId:'demo', code:'ADM', name:'Administrativo', active:true }], { companyId:'demo', cutoffPeriod:'2026-09', futurePeriods:['2026-10'], lookbackPeriods:['2026-09'], })
  const runRateRevenue = runRateGenerated.find(entry => entry.movementClass === 'receita')
  if(!runRateRevenue || runRateRevenue.amount !== 1000 || runRateRevenue.source !== 'run_rate') throw new Error('Forecast Gate: run rate incorreto.')

  const manual: V2ForecastEntry = { id:'manual-override', companyId:'demo', period:'2026-10', costCenterId:'com', movementClass:'receita', amount:1400, source:'manual' }
  const manualGenerated = buildManualForecastEntries([manual], { companyId:'demo', cutoffPeriod:'2026-09', futurePeriods:['2026-10'] })
  if(manualGenerated.length !== 1 || manualGenerated[0].source !== 'manual') throw new Error('Forecast Gate: fonte manual incorreta.')
  const merged = mergeForecastSources(runRateGenerated, budgetGenerated, [manual])
  const mergedRevenue = merged.find(entry => entry.period === '2026-10' && entry.costCenterId === 'com' && entry.movementClass === 'receita')
  if(!mergedRevenue || mergedRevenue.source !== 'manual' || mergedRevenue.amount !== 1400) throw new Error('Forecast Gate: prioridade manual incorreta.')
  if(validateForecastEngineResult(merged).length !== 0) throw new Error('Forecast Gate: resultado do motor inválido.')

  const forecastAlerts = buildForecastManagementAlerts(report.lines)
  const forecastAlert = forecastAlerts.find(alert => alert.period === '2026-10' && alert.movementClass === 'receita')
  if(!forecastAlert || forecastAlert.basis !== 'forecast' || forecastAlert.variance !== 100) throw new Error('Forecast Gate: alerta de forecast não foi gerado.')
  const caused = updateManagementAlertCause(forecastAlert, 'volume', 'Teste de causa projetada')
  const action = createManagementAction(caused.id, 'Validar premissa do forecast', '2026-09-24T12:00:00.000Z')
  if(validateManagementAction(action.description).length !== 0) throw new Error('Forecast Gate: ação de forecast inválida.')
  const drill = buildManagementDrilldown({...caused, actionIds:[action.id]}, base.entries, [action])
  if(drill.alert.basis !== 'forecast' || drill.actions.length !== 1) throw new Error('Forecast Gate: vínculo causa-ação do forecast falhou.')
  console.log('V2 Forecast Gate: OK')
}

if (typeof window === 'undefined') runV2ForecastGate()

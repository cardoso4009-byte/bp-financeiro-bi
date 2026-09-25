import { buildV2ForecastReport, validateV2ForecastEntries, type V2ForecastEntry } from '../lib/v2-forecast'
import { buildForecastManagementAlerts } from '../lib/v2-management'
import { buildManagementDrilldown, updateManagementAlertCause, validateManagementAction } from '../lib/v2-management-workflow'
import { createManagementAction } from '../lib/v2-management'
import { buildBudgetForecastEntries, buildManualForecastEntries, buildRunRateForecastEntries, mergeForecastSources, validateForecastEngineResult } from '../lib/v2-forecast-engine'
import { buildV2FinancialBase } from '../lib/v2-financial-base'
import type { V2BudgetEntry } from '../lib/v2-budget'

export function runV2ForecastGate(): void {
  const check = (condition: boolean, message: string) => { if (!condition) throw new Error(message); console.log(`V2 Forecast Gate checkpoint: ${message}`) }
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
  check(report.actualTotal === 600, 'realizado OK')
  check(report.forecastTotal === 1400, 'forecast OK')
  const realized = report.lines.find(line=>line.period==='2026-09' && line.movementClass==='receita')
  check(Boolean(realized && realized.status==='realizado' && realized.forecast===realized.actual), 'período realizado OK')
  const projected = report.lines.find(line=>line.period==='2026-10' && line.movementClass==='receita')
  check(Boolean(projected && projected.status==='projetado' && projected.forecast===1300), 'projeção futura OK')
  check(validateV2ForecastEntries(forecast).length === 0, 'validação válida OK')
  check(validateV2ForecastEntries([{...forecast[0], id:''}]).length > 0, 'validação de id OK')

  const budgetGenerated = buildBudgetForecastEntries(budget, { companyId:'demo', cutoffPeriod:'2026-09', futurePeriods:['2026-10'] })
  check(budgetGenerated.length === 1 && budgetGenerated[0].source === 'budget' && budgetGenerated[0].amount === 1200, 'fonte orçamento OK')

  const runRateGenerated = buildRunRateForecastEntries(base, [{ id:'com', companyId:'demo', code:'COM', name:'Comercial', active:true }, { id:'adm', companyId:'demo', code:'ADM', name:'Administrativo', active:true }], { companyId:'demo', cutoffPeriod:'2026-09', futurePeriods:['2026-10'], lookbackPeriods:['2026-09'], })
  const runRateRevenue = runRateGenerated.find(entry => entry.movementClass === 'receita')
  check(Boolean(runRateRevenue && runRateRevenue.amount === 1000 && runRateRevenue.source === 'run_rate'), 'run rate OK')

  const manual: V2ForecastEntry = { id:'manual-override', companyId:'demo', period:'2026-10', costCenterId:'com', movementClass:'receita', amount:1400, source:'manual' }
  const manualGenerated = buildManualForecastEntries([manual], { companyId:'demo', cutoffPeriod:'2026-09', futurePeriods:['2026-10'] })
  check(manualGenerated.length === 1 && manualGenerated[0].source === 'manual', 'fonte manual OK')
  const merged = mergeForecastSources(runRateGenerated, budgetGenerated, [manual])
  const mergedRevenue = merged.find(entry => entry.period === '2026-10' && entry.costCenterId === 'com' && entry.movementClass === 'receita')
  check(Boolean(mergedRevenue && mergedRevenue.source === 'manual' && mergedRevenue.amount === 1400), 'prioridade manual OK')
  check(validateForecastEngineResult(merged).length === 0, 'resultado do motor OK')

  const forecastAlerts = buildForecastManagementAlerts(report.lines)
  const forecastAlert = forecastAlerts.find(alert => alert.period === '2026-10' && alert.movementClass === 'receita')
  check(Boolean(forecastAlert && forecastAlert.basis === 'forecast' && forecastAlert.variance === 100), 'alerta forecast OK')
  const caused = updateManagementAlertCause(forecastAlert, 'volume', 'Teste de causa projetada')
  const action = createManagementAction(caused.id, 'Validar premissa do forecast', '2026-09-24T12:00:00.000Z')
  check(validateManagementAction(action.description).length === 0, 'ação OK')
  const drill = buildManagementDrilldown({...caused, actionIds:[action.id]}, base.entries, [action])
  check(drill.alert.basis === 'forecast' && drill.actions.length === 1, 'vínculo causa-ação OK')
  console.log('V2 Forecast Gate: OK')
}

if (typeof window === 'undefined') runV2ForecastGate()

import { buildV2ForecastReport, validateV2ForecastEntries, type V2ForecastEntry } from '../lib/v2-forecast'
import { buildV2FinancialBase } from '../lib/v2-financial-base'

export function runV2ForecastGate(): void {
  const base = buildV2FinancialBase([
    { id:'actual-1', companyId:'demo', accountId:'1', costCenterId:'com', description:'Receita', date:'2026-09-10', competence:'2026-09', amount:1000, nature:'credit', cashBasis:'competencia', movementClass:'receita', source:'manual', reconciled:true },
    { id:'actual-2', companyId:'demo', accountId:'2', costCenterId:'adm', description:'Opex', date:'2026-09-10', competence:'2026-09', amount:400, nature:'debit', cashBasis:'competencia', movementClass:'opex', source:'manual', reconciled:true },
  ])
  const budget = [
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
  console.log('V2 Forecast Gate: OK')
}

if (typeof window === 'undefined') runV2ForecastGate()

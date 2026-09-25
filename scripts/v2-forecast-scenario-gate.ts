import { buildForecastScenario, FORECAST_SCENARIOS } from '../lib/v2-forecast-scenarios'

const lines:any[]=[
 {period:'2026-10',movementClass:'receita',forecast:1000,budget:1000,actual:0,budgetVariance:0,budgetVariancePercent:0,forecastVariance:0,forecastVariancePercent:0,status:'projetado',entries:1,costCenterCode:'COM',costCenterName:'Comercial'},
 {period:'2026-10',movementClass:'opex',forecast:-400,budget:-400,actual:0,budgetVariance:0,budgetVariancePercent:0,forecastVariance:0,forecastVariancePercent:0,status:'projetado',entries:1,costCenterCode:'ADM',costCenterName:'Administrativo'},
]
const base=buildForecastScenario(lines,'base')
const conservative=buildForecastScenario(lines,'conservador')
const aggressive=buildForecastScenario(lines,'agressivo')
if(FORECAST_SCENARIOS.length!==3) throw new Error('Scenario Gate: quantidade de cenários incorreta.')
if(base.result!==600) throw new Error('Scenario Gate: Base incorreto.')
if(conservative.revenue!==950 || conservative.expenses!==-412 || conservative.result!==538) throw new Error('Scenario Gate: Conservador incorreto.')
if(aggressive.revenue!==1050 || aggressive.expenses!==-388 || aggressive.result!==662) throw new Error('Scenario Gate: Agressivo incorreto.')
if(base.deltaToBase!==0) throw new Error('Scenario Gate: Base alterou o oficial.')
console.log('V2 Forecast Scenario Gate: OK')

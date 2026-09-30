import { buildForecastConsolidado } from '../lib/forecast-consolidado'
import { buildForecastScenario } from '../lib/v2-forecast-scenarios'
import { buildWorkingCapitalForecast } from '../lib/capital-giro-forecast'
import type { V2ForecastLine, V2ForecastReport } from '../lib/v2-forecast'

const check = (condition: boolean, message: string) => {
  if (!condition) throw new Error(`V2 Final Integration Gate: ${message}`)
  console.log(`V2 Final Integration Gate checkpoint: ${message}`)
}

const lines: V2ForecastLine[] = [
  { period:'2026-09', movementClass:'receita', forecast:1000, budget:950, actual:1000, budgetVariance:50, budgetVariancePercent:50/950, forecastVariance:0, forecastVariancePercent:0, status:'realizado', entries:1, costCenterCode:'COM', costCenterName:'Comercial' },
  { period:'2026-09', movementClass:'opex', forecast:-400, budget:-420, actual:-400, budgetVariance:20, budgetVariancePercent:20/420, forecastVariance:0, forecastVariancePercent:0, status:'realizado', entries:1, costCenterCode:'ADM', costCenterName:'Administrativo' },
  { period:'2026-10', movementClass:'receita', forecast:1200, budget:1150, actual:0, budgetVariance:50, budgetVariancePercent:50/1150, forecastVariance:-1200, forecastVariancePercent:-1, status:'projetado', entries:1, costCenterCode:'COM', costCenterName:'Comercial' },
  { period:'2026-10', movementClass:'opex', forecast:-450, budget:-430, actual:0, budgetVariance:-20, budgetVariancePercent:-20/430, forecastVariance:450, forecastVariancePercent:1, status:'projetado', entries:1, costCenterCode:'ADM', costCenterName:'Administrativo' },
  { period:'2026-10', movementClass:'capex', forecast:-100, budget:-80, actual:0, budgetVariance:-20, budgetVariancePercent:-20/80, forecastVariance:100, forecastVariancePercent:1, status:'projetado', entries:1, costCenterCode:'OPS', costCenterName:'Operações' },
]

const report: V2ForecastReport = {
  cutoffPeriod:'2026-09',
  annualPeriods:['2026-09','2026-10'],
  lines,
  budgetTotal:1170,
  actualTotal:600,
  forecastTotal:1250,
  budgetGap:80,
  forecastGap:-650,
  actualEntries:2,
  forecastEntries:3,
  unassignedForecastEntries:0,
}

const consolidated = buildForecastConsolidado(report)
const realized = consolidated.rows.filter(row => row.status === 'realizado').reduce((sum,row) => sum + row.result, 0)
const projected = consolidated.rows.filter(row => row.status === 'projetado').reduce((sum,row) => sum + row.result, 0)

check(consolidated.rows.length === 2, 'forecast consolidado mantém todas as competências')
check(consolidated.rows[0].status === 'realizado' && consolidated.rows[1].status === 'projetado', 'corte realizado/projetado OK')
check(consolidated.total.result === consolidated.realized.result + consolidated.projected.result, 'total = realizado + projetado')
check(Math.abs(realized - consolidated.realized.result) < 0.001, 'linhas realizadas reconciliam com bloco realizado')
check(Math.abs(projected - consolidated.projected.result) < 0.001, 'linhas projetadas reconciliam com bloco projetado')
check(consolidated.total.result === 1250, 'resultado consolidado preserva a soma por competência')

const baseScenario = buildForecastScenario(lines, 'base')
const conservative = buildForecastScenario(lines, 'conservador')
const aggressive = buildForecastScenario(lines, 'agressivo')

check(baseScenario.result === 1250, 'cenário base preserva o resultado oficial')
check(baseScenario.deltaToBase === 0, 'cenário base não cria delta artificial')
check(conservative.result !== baseScenario.result && aggressive.result !== baseScenario.result, 'cenários alternativos alteram apenas a camada de cenário')

const workingCapital = buildWorkingCapitalForecast(
  lines,
  ['2026-10'],
  { pmrDias:30, pmeDias:15, pmpDias:30 },
  300,
)

check(workingCapital.lines.length === 1, 'forecast de capital de giro encontra o período projetado')
check(workingCapital.lines[0].receivables === 1200, 'PMR aplicado sobre a receita projetada')
check(workingCapital.lines[0].payables === 450, 'PMP aplicado sobre o custo operacional')
check(workingCapital.lines[0].workingCapitalNeed === 975, 'NCG projetada reconciliada')
check(workingCapital.lines[0].cashImpact === -675, 'impacto de caixa = NCG anterior - NCG atual')

console.log('V2 Final Integration Gate: OK')

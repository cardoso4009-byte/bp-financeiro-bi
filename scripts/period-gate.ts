import { competence, type ReportPeriod } from '../lib/report-period'
import { competencesForView, monthsForView, previousPeriod } from '../lib/report-period-engine'

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(`PERIOD GATE: ${message}`)
}

const mensal: ReportPeriod = { year: 2026, month: 6, view: 'mensal' }
const acumulado: ReportPeriod = { year: 2026, month: 6, view: 'acumulado' }
const comparativo: ReportPeriod = { year: 2026, month: 6, view: 'comparativo' }

assert(monthsForView(mensal).join(',') === '6', 'mensal deve conter somente o mês selecionado')
assert(monthsForView(acumulado).join(',') === '1,2,3,4,5,6', 'acumulado deve conter janeiro até o mês selecionado')
assert(monthsForView(comparativo).join(',') === '6', 'comparativo deve partir do mês selecionado')
assert(competencesForView(acumulado)[0] === '2026-01', 'acumulado deve começar na competência de janeiro')
assert(competencesForView(acumulado).at(-1) === '2026-06', 'acumulado deve terminar na competência selecionada')
assert(competence(previousPeriod(mensal).year, previousPeriod(mensal).month) === '2026-05', 'mês anterior deve retroceder uma competência')
assert(competence(previousPeriod({ year: 2026, month: 1, view: 'mensal' }).year, previousPeriod({ year: 2026, month: 1, view: 'mensal' }).month) === '2025-12', 'janeiro deve comparar com dezembro do ano anterior')

console.log('PERIOD GATE: OK — mensal, acumulado e comparativo seguem a mesma regra de competência.')

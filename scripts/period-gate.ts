import { competence, type ReportPeriod } from '../lib/report-period'
import { competencesForView, monthsForView, previousPeriod } from '../lib/report-period-engine'
import { buildDmpl } from '../lib/dmpl-engine'
import { integratedJournal } from '../lib/accounting-core'
import { openingBalance } from '../lib/financial-core'

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(`PERIOD GATE: ${message}`)
}

const entryCompetence = (entry: typeof integratedJournal[number]) => entry.competence || entry.date.slice(0, 7)
const entriesFor = (year: number, month: number) => integratedJournal.filter(entry => entryCompetence(entry) === competence(year, month))
const netIncome = (entries: typeof integratedJournal) => buildDmpl(entries, 0).lucroLiquido

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

const jan = buildDmpl(entriesFor(2026, 1), openingBalance.equity)
assert(jan.status === 'OK', 'DMPL mensal de janeiro deve reconciliar com o PL de abertura')

const priorToJun = integratedJournal.filter(entry => entryCompetence(entry) < '2026-06')
const jun = buildDmpl(entriesFor(2026, 6), openingBalance.equity + netIncome(priorToJun))
assert(jun.status === 'OK', 'DMPL mensal de junho deve partir do PL de fechamento de maio')

const janToJun = integratedJournal.filter(entry => entryCompetence(entry) >= '2026-01' && entryCompetence(entry) <= '2026-06')
const accumulated = buildDmpl(janToJun, openingBalance.equity)
assert(accumulated.status === 'OK', 'DMPL acumulada de janeiro a junho deve reconciliar com a abertura')
assert(Math.abs(accumulated.plCalculado - jun.plContabil) < 0.01, 'fechamento acumulado e fechamento mensal devem convergir no mesmo PL')

console.log('PERIOD GATE: OK — mensal, acumulado e comparativo seguem a mesma regra de competência; DMPL mensal e acumulada reconciliam.')

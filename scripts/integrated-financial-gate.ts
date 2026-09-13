import { financialCore, openingBalance } from '../lib/financial-core'
import { monthlyData, monthlyBalance } from '../lib/monthly-data'
import { dreFromCore } from '../lib/financial-core'
import { buildDmpl } from '../lib/dmpl-engine'
import { integratedJournal } from '../lib/accounting-core'
import { cashFlowEngine } from '../lib/dfc-engine'
import { periodFromMonths } from '../lib/period-engine'
import { competence } from '../lib/report-period'

const TOLERANCE = 0.01
const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(`INTEGRATED FINANCIAL GATE: ${message}`)
}

const entryCompetence = (entry: typeof integratedJournal[number]) => entry.competence || entry.date.slice(0, 7)
const entriesFor = (year: number, month: number) => integratedJournal.filter(entry => entryCompetence(entry) === competence(year, month))
const netIncomeForEntries = (entries: typeof integratedJournal) => buildDmpl(entries, 0).lucroLiquido

// 1) BP: posição patrimonial deve fechar em todos os meses.
for (let i = 0; i < monthlyBalance.length; i += 1) {
  const row = monthlyBalance[i]
  const difference = row.ativoTotal - row.passivoTotal - row.pl
  assert(Math.abs(difference) < TOLERANCE, `BP não fecha em ${row.month}: diferença ${difference}`)
}

// 2) DRE: resultado do Financial Core deve coincidir com o resultado mensal derivado.
for (let i = 0; i < financialCore.length; i += 1) {
  const core = financialCore[i]
  const dre = dreFromCore(core)
  assert(Math.abs(dre.lucroLiquido - monthlyData[i].lucroLiquido) < TOLERANCE, `DRE não coincide com monthlyData em ${core.year}-${String(i + 1).padStart(2, '0')}`)
}

// 3) DMPL: PL final mensal deve convergir para o PL do BP.
for (let i = 0; i < financialCore.length; i += 1) {
  const year = financialCore[i].year
  const month = i + 1
  const priorEntries = integratedJournal.filter(entry => entryCompetence(entry) < competence(year, month))
  const plInicial = openingBalance.equity + netIncomeForEntries(priorEntries)
  const dmpl = buildDmpl(entriesFor(year, month), plInicial)
  assert(Math.abs(dmpl.plContabil - monthlyBalance[i].pl) < TOLERANCE, `DMPL não converge com BP em ${year}-${String(month).padStart(2, '0')}`)
}

// 4) DFC: geração de caixa deve reconciliar com o caixa do BP em cada competência.
for (let month = 1; month <= financialCore.length; month += 1) {
  const period = periodFromMonths(month, month, financialCore[0].year)
  const dfc = cashFlowEngine(undefined, period)
  const expectedCash = monthlyBalance[month - 1].caixa
  assert(Math.abs(dfc.finalCash - expectedCash) < TOLERANCE, `DFC não reconcilia com caixa do BP em ${financialCore[0].year}-${String(month).padStart(2, '0')}: ${dfc.finalCash} vs ${expectedCash}`)
}

// 5) Acumulado: o resultado acumulado e o fechamento patrimonial devem convergir.
for (let month = 1; month <= financialCore.length; month += 1) {
  const year = financialCore[0].year
  const accumulatedEntries = integratedJournal.filter(entry => {
    const c = entryCompetence(entry)
    return c >= `${year}-01` && c <= competence(year, month)
  })
  const dmpl = buildDmpl(accumulatedEntries, openingBalance.equity)
  assert(Math.abs(dmpl.plContabil - monthlyBalance[month - 1].pl) < TOLERANCE, `DMPL acumulada não converge com BP em ${year}-${String(month).padStart(2, '0')}`)
}

console.log('INTEGRATED FINANCIAL GATE: OK — DRE, BP, DFC e DMPL reconciliam nas competências mensais e acumuladas.')

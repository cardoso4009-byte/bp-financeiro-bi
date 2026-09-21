import assert from 'node:assert/strict'
import { buildV2FinancialBase } from '../lib/v2-financial-base'
import { buildV2BudgetReport, validateV2BudgetEntries, type V2BudgetEntry } from '../lib/v2-budget'
import type { CostCenter, FinancialEntry } from '../lib/v2-data-model'

const centers: CostCenter[] = [
  {id:'com',companyId:'c1',code:'CC-COM',name:'Comercial',active:true},
  {id:'adm',companyId:'c1',code:'CC-ADM',name:'Administrativo',active:true},
]

const actual: FinancialEntry[] = [
  {id:'1',companyId:'c1',accountId:'rev',costCenterId:'com',description:'Venda',date:'2026-09-05',competence:'2026-09',amount:1000,nature:'credit',cashBasis:'competencia',movementClass:'receita',source:'csv',reconciled:false},
  {id:'2',companyId:'c1',accountId:'opex',costCenterId:'com',description:'Comissão',date:'2026-09-06',competence:'2026-09',amount:250,nature:'debit',cashBasis:'competencia',movementClass:'opex',source:'csv',reconciled:false},
  {id:'3',companyId:'c1',accountId:'opex',costCenterId:'adm',description:'Administrativo',date:'2026-09-07',competence:'2026-09',amount:90,nature:'debit',cashBasis:'competencia',movementClass:'opex',source:'csv',reconciled:false},
]

const budget: V2BudgetEntry[] = [
  {id:'b1',companyId:'c1',period:'2026-09',costCenterId:'com',movementClass:'receita',amount:1100},
  {id:'b2',companyId:'c1',period:'2026-09',costCenterId:'com',movementClass:'opex',amount:-200},
  {id:'b3',companyId:'c1',period:'2026-09',costCenterId:'adm',movementClass:'opex',amount:-100},
]

assert.deepEqual(validateV2BudgetEntries(budget), [])
const report = buildV2BudgetReport(buildV2FinancialBase(actual), budget, centers, '2026-09')
const commercialRevenue = report.lines.find(x => x.costCenterId === 'com' && x.movementClass === 'receita')
const commercialOpex = report.lines.find(x => x.costCenterId === 'com' && x.movementClass === 'opex')

assert.equal(report.budgetEntries, 3)
assert.equal(report.actualEntries, 3)
assert.equal(commercialRevenue?.budget, 1100)
assert.equal(commercialRevenue?.actual, 1000)
assert.equal(commercialRevenue?.variance, -100)
assert.equal(commercialOpex?.budget, -200)
assert.equal(commercialOpex?.actual, -250)
assert.equal(commercialOpex?.variance, -50)
assert.equal(report.unassignedBudgetEntries, 0)
assert.equal(report.unassignedActualEntries, 0)

const invalid = validateV2BudgetEntries([{...budget[0], id:'b1'}, {...budget[0], id:'b1'}])
assert.equal(invalid.length, 1)

console.log('V2 Budget Gate: OK')

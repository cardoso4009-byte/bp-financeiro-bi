import assert from 'node:assert/strict'
import { buildV2FinancialBase } from '../lib/v2-financial-base'
import { buildV2CostCenterReport } from '../lib/v2-cost-center'
import type { Account, CostCenter, FinancialEntry } from '../lib/v2-data-model'

const accounts: Account[] = [
  {id:'rev',companyId:'c1',code:'3.1',name:'Receita',nature:'credit',statement:'resultado',active:true},
  {id:'opex',companyId:'c1',code:'6.1',name:'OPEX',nature:'debit',statement:'resultado',active:true},
  {id:'capex',companyId:'c1',code:'1.2',name:'CAPEX',nature:'debit',statement:'ativo',active:true},
]

const centers: CostCenter[] = [
  {id:'adm',companyId:'c1',code:'CC-ADM',name:'Administrativo',active:true},
  {id:'com',companyId:'c1',code:'CC-COM',name:'Comercial',active:true},
]

const entries: FinancialEntry[] = [
  {id:'1',companyId:'c1',accountId:'rev',costCenterId:'com',description:'Venda',date:'2026-09-05',competence:'2026-09',amount:1000,nature:'credit',cashBasis:'competencia',movementClass:'receita',source:'csv',reconciled:false},
  {id:'2',companyId:'c1',accountId:'opex',costCenterId:'com',description:'Comissão',date:'2026-09-06',competence:'2026-09',amount:200,nature:'debit',cashBasis:'competencia',movementClass:'opex',source:'csv',reconciled:false},
  {id:'3',companyId:'c1',accountId:'opex',costCenterId:'adm',description:'Administrativo',date:'2026-09-07',competence:'2026-09',amount:100,nature:'debit',cashBasis:'competencia',movementClass:'opex',source:'csv',reconciled:false},
  {id:'4',companyId:'c1',accountId:'capex',description:'Equipamento',date:'2026-09-08',competence:'2026-09',amount:150,nature:'debit',cashBasis:'competencia',movementClass:'capex',source:'csv',reconciled:false},
]

const report = buildV2CostCenterReport(buildV2FinancialBase(entries), centers, '2026-09')
const commercial = report.rows.find(row => row.costCenterId === 'com')

assert.equal(report.totalEntries, 4)
assert.equal(report.assignedEntries, 3)
assert.equal(report.unassignedEntries, 1)
assert.equal(commercial?.receita, 1000)
assert.equal(commercial?.opex, -200)
assert.equal(commercial?.ebitdaImpact, 800)
assert.equal(commercial?.resultadoLiquido, 800)
assert.equal(report.rows.find(row => row.costCenterId === 'adm')?.resultadoLiquido, -100)
assert.equal(report.rows.find(row => row.code === 'SEM-CC')?.capex, 150)

console.log('V2 Cost Center Gate: OK')

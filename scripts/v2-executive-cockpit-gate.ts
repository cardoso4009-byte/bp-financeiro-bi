import assert from 'node:assert/strict'
import { buildV2FinancialBase } from '../lib/v2-financial-base'
import { buildV2Dre } from '../lib/v2-dre'
import { buildV2Dfc } from '../lib/v2-dfc'
import { buildV2Bp } from '../lib/v2-bp'
import { buildV2ReconciliationAudit } from '../lib/v2-reconciliation'
import { buildV2ExecutiveCockpit } from '../lib/v2-executive-cockpit'
import { buildV2CostCenterReport } from '../lib/v2-cost-center'
import type { Account, CostCenter, FinancialEntry } from '../lib/v2-data-model'

const accounts: Account[] = [
  {id:'cash',companyId:'c1',code:'1.1',name:'Caixa',nature:'debit',statement:'ativo',active:true},
  {id:'capital',companyId:'c1',code:'2.1',name:'Capital',nature:'credit',statement:'patrimonio_liquido',active:true},
  {id:'revenue',companyId:'c1',code:'3.1',name:'Receita',nature:'credit',statement:'resultado',active:true},
  {id:'opex',companyId:'c1',code:'3.2',name:'OPEX',nature:'debit',statement:'resultado',active:true},
]

const centers: CostCenter[] = [
  {id:'com',companyId:'c1',code:'CC-COM',name:'Comercial',active:true},
  {id:'adm',companyId:'c1',code:'CC-ADM',name:'Administrativo',active:true},
]

const entries: FinancialEntry[] = [
  {id:'1',companyId:'c1',accountId:'cash',description:'Entrada em caixa',date:'2026-08-01',competence:'2026-08',amount:1000,nature:'debit',cashBasis:'caixa',movementClass:'transferencia',source:'csv',externalId:'A1',reconciled:true,settlementDate:'2026-08-01'},
  {id:'2',companyId:'c1',accountId:'capital',description:'Capital social',date:'2026-08-01',competence:'2026-08',amount:1000,nature:'credit',cashBasis:'caixa',movementClass:'transferencia',source:'csv',externalId:'A6',reconciled:true,settlementDate:'2026-08-01'},
  {id:'3',companyId:'c1',accountId:'revenue',description:'Receita',date:'2026-08-05',competence:'2026-08',amount:500,nature:'credit',cashBasis:'competencia',movementClass:'receita',source:'csv',externalId:'A2',reconciled:true,settlementDate:'2026-08-05'},
  {id:'4',companyId:'c1',accountId:'opex',description:'OPEX',date:'2026-08-10',competence:'2026-08',amount:200,nature:'debit',cashBasis:'competencia',movementClass:'opex',source:'csv',externalId:'A3',reconciled:true,settlementDate:'2026-08-10'},
  {id:'5',companyId:'c1',accountId:'revenue',costCenterId:'com',description:'Receita',date:'2026-09-05',competence:'2026-09',amount:1000,nature:'credit',cashBasis:'competencia',movementClass:'receita',source:'csv',externalId:'A4',reconciled:true,settlementDate:'2026-09-05'},
  {id:'6',companyId:'c1',accountId:'opex',costCenterId:'com',description:'OPEX',date:'2026-09-10',competence:'2026-09',amount:300,nature:'debit',cashBasis:'competencia',movementClass:'opex',source:'csv',externalId:'A5',reconciled:true,settlementDate:'2026-09-10'},
]

const base=buildV2FinancialBase(entries)
const dre=buildV2Dre(base,'2026-09')
const dfc=buildV2Dfc(base,'2026-09')
const bp=buildV2Bp(base,accounts,'2026-09')
const previousBp=buildV2Bp(base,accounts,'2026-08')
const audit=buildV2ReconciliationAudit(base,accounts,dre,dfc,bp,'2026-09','2026-08',previousBp)
const costCenterReport=buildV2CostCenterReport(base,centers,'2026-09')
const cockpit=buildV2ExecutiveCockpit(base,dre,dfc,bp,audit,'2026-09','2026-08',costCenterReport)

assert.equal(cockpit.receita,1000)
assert.equal(cockpit.ebitda,700)
assert.equal(cockpit.margemEbitda,0.7)
assert.equal(cockpit.resultadoLiquido,700)
assert.equal(cockpit.margemLiquida,0.7)
assert.equal(cockpit.caixaOperacional,700)
assert.equal(cockpit.variacaoCaixa,700)
assert.equal(cockpit.resultadoAnterior,300)
assert.equal(cockpit.resultadoVariacao,400)
assert.equal(cockpit.caixaAnterior,300)
assert.equal(cockpit.caixaVariacao,400)
assert.equal(cockpit.qualityStatus,'ok')
assert.equal(cockpit.pendingIssues,1)
assert.equal(cockpit.trend.length,2)
assert.equal(cockpit.trend[1].period,'2026-09')
assert.equal(cockpit.drivers[0].label,'Receita')
assert.equal(cockpit.costCenterCount,1)
assert.equal(cockpit.unassignedCostCenterEntries,0)
assert.equal(cockpit.costCenters.find(row => row.costCenterId === 'com')?.receita,1000)
assert.equal(cockpit.costCenters.find(row => row.costCenterId === 'com')?.opex,-300)
assert.equal(cockpit.costCenters.find(row => row.costCenterId === 'com')?.ebitdaImpact,700)
assert.equal(cockpit.costCenters.find(row => row.costCenterId === 'com')?.resultadoLiquido,700)
assert.equal(cockpit.costCenters.find(row => row.costCenterId === 'com')?.entries,2)
assert.equal(cockpit.costCenters.find(row => row.costCenterId === 'adm')?.entries,0)
console.log('V2 Executive Cockpit Gate: OK')

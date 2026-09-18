import assert from 'node:assert/strict'
import { buildV2FinancialBase } from '../lib/v2-financial-base'
import { buildV2Dre } from '../lib/v2-dre'
import { buildV2Dfc } from '../lib/v2-dfc'
import { buildV2Bp } from '../lib/v2-bp'
import { buildV2ReconciliationAudit } from '../lib/v2-reconciliation'
import type { Account, FinancialEntry } from '../lib/v2-data-model'

const accounts: Account[] = [
 {id:'cash',companyId:'c1',code:'1.1',name:'Caixa',nature:'debit',statement:'ativo',active:true},
 {id:'capital',companyId:'c1',code:'2.1',name:'Capital',nature:'credit',statement:'patrimonio_liquido',active:true},
 {id:'supplier',companyId:'c1',code:'2.2',name:'Fornecedores',nature:'credit',statement:'passivo',active:true},
 {id:'revenue',companyId:'c1',code:'3.1',name:'Receita',nature:'credit',statement:'resultado',active:true},
 {id:'opex',companyId:'c1',code:'3.2',name:'OPEX',nature:'debit',statement:'resultado',active:true},
]
const entries: FinancialEntry[] = [
 {id:'1',companyId:'c1',accountId:'cash',description:'Saldo inicial',date:'2026-08-01',competence:'2026-08',amount:1000,nature:'debit',cashBasis:'caixa',movementClass:'outros',source:'csv',externalId:'A1',reconciled:false},
 {id:'2',companyId:'c1',accountId:'capital',description:'Capital',date:'2026-08-01',competence:'2026-08',amount:1000,nature:'credit',cashBasis:'caixa',movementClass:'financeiro',source:'csv',externalId:'A2',reconciled:false,settlementDate:'2026-08-01'},
 {id:'3',companyId:'c1',accountId:'supplier',description:'Compra a prazo',date:'2026-09-02',competence:'2026-09',amount:300,nature:'credit',cashBasis:'competencia',movementClass:'custo',source:'csv',externalId:'A3',reconciled:false},
 {id:'4',companyId:'c1',accountId:'cash',description:'Pagamento fornecedor',date:'2026-09-10',competence:'2026-09',amount:300,nature:'credit',cashBasis:'caixa',movementClass:'custo',source:'csv',externalId:'A4',reconciled:false,settlementDate:'2026-09-10'},
 {id:'5',companyId:'c1',accountId:'revenue',description:'Venda',date:'2026-09-05',competence:'2026-09',amount:1000,nature:'credit',cashBasis:'competencia',movementClass:'receita',source:'csv',externalId:'A5',reconciled:false,settlementDate:'2026-09-05'},
 {id:'6',companyId:'c1',accountId:'opex',description:'Despesa',date:'2026-09-15',competence:'2026-09',amount:100,nature:'debit',cashBasis:'competencia',movementClass:'opex',source:'csv',externalId:'A6',reconciled:false,settlementDate:'2026-09-15'},
 {id:'7',companyId:'c1',accountId:'opex',description:'Sem liquidação',date:'2026-09-20',competence:'2026-09',amount:50,nature:'debit',cashBasis:'caixa',movementClass:'opex',source:'csv',externalId:'A7',reconciled:false},
 {id:'8',companyId:'c1',accountId:'revenue',description:'Duplicado externo',date:'2026-09-21',competence:'2026-09',amount:10,nature:'credit',cashBasis:'competencia',movementClass:'receita',source:'csv',externalId:'A5',reconciled:false},
]
const base=buildV2FinancialBase(entries)
const dre=buildV2Dre(base,'2026-09')
const dfc=buildV2Dfc(base,'2026-09')
const bp=buildV2Bp(base,accounts,'2026-09')
const audit=buildV2ReconciliationAudit(base,accounts,dre,dfc,bp,'2026-09','2026-08',null)
assert.equal(audit.classification.unclassifiedEntries,0)
assert.equal(audit.settlement.unsettledEntries,4)
assert.equal(audit.settlement.cashBasisWithoutSettlement,2)
assert.equal(audit.duplicateExternalIds,1)
assert.equal(audit.dreVsDfc.dreResult,910)
assert.equal(audit.dreVsDfc.cashVariation,600)
assert.equal(audit.dreVsDfc.bridgeDifference,-310)
assert.equal(audit.periodVariation.dreResultVariation,910)
assert.equal(audit.bpVsResult.balanced,false)
assert.equal(audit.status,'attention')
console.log('V2 Reconciliation Gate: OK')

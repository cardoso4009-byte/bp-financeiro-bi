import { buildV2Dre, isDreEntry } from '../lib/v2-dre'
import { buildV2FinancialBase } from '../lib/v2-financial-base'
import type { FinancialEntry } from '../lib/v2-data-model'

const entries: FinancialEntry[] = [
  { id:'1',companyId:'e',accountId:'r',description:'Receita',date:'2026-09-05',competence:'2026-09',amount:10000,nature:'credit',cashBasis:'competencia',movementClass:'receita',source:'csv',reconciled:false },
  { id:'2',companyId:'e',accountId:'c',description:'Custo',date:'2026-09-06',competence:'2026-09',amount:3000,nature:'debit',cashBasis:'competencia',movementClass:'custo',source:'csv',reconciled:false },
  { id:'3',companyId:'e',accountId:'o',description:'OPEX',date:'2026-09-07',competence:'2026-09',amount:2000,nature:'debit',cashBasis:'competencia',movementClass:'opex',source:'csv',reconciled:false },
  { id:'4',companyId:'e',accountId:'f',description:'Financeiro',date:'2026-09-08',competence:'2026-09',amount:500,nature:'debit',cashBasis:'competencia',movementClass:'financeiro',source:'csv',reconciled:false },
  { id:'5',companyId:'e',accountId:'i',description:'Imposto',date:'2026-09-09',competence:'2026-09',amount:700,nature:'debit',cashBasis:'competencia',movementClass:'imposto',source:'csv',reconciled:false },
  { id:'6',companyId:'e',accountId:'x',description:'CAPEX',date:'2026-09-10',competence:'2026-09',amount:9000,nature:'debit',cashBasis:'caixa',movementClass:'capex',source:'csv',reconciled:false },
  { id:'7',companyId:'e',accountId:'r',description:'Receita anterior',date:'2026-08-31',competence:'2026-08',amount:1000,nature:'credit',cashBasis:'competencia',movementClass:'receita',source:'csv',reconciled:false },
]

const report=buildV2Dre(buildV2FinancialBase(entries),'2026-09')
const p=report.selectedPeriod
if(!p) throw new Error('Falha ao selecionar período')
if(p.receita!==10000||p.custos!==-3000||p.opex!==-2000||p.ebitda!==5000||p.resultadoFinanceiro!==-500||p.impostos!==-700||p.resultadoLiquido!==3800) throw new Error('Falha nos cálculos da DRE V2')
if(p.entries!==6||report.periods.length!==2) throw new Error('Falha nos períodos da DRE V2')
if(isDreEntry(buildV2FinancialBase(entries).entries.find(e=>e.id==='6')!)) throw new Error('CAPEX não deve compor a DRE')
console.log('V2 DRE Gate: OK')

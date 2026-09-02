import {financialCore, openingBalance} from './financial-core'

export type AccountNature='devedora'|'credora'
export type AccountClass='ativo'|'passivo'|'patrimonio'|'receita'|'custo'|'despesa'

export interface Account{code:string;name:string;class:AccountClass;nature:AccountNature;level:number;active?:boolean;parentCode?:string}
export interface JournalLine{account:string;debit:number;credit:number}
export interface JournalEntry{id:string;date:string;description:string;lines:JournalLine[];competence?:string;document?:string;costCenter?:string;source?:'MANUAL'|'IMPORTACAO'|'INTEGRACAO'}

// Fonte única da verdade do modelo contábil. O Diário integrado é derivado do Financial Core.
export const chartOfAccounts:Account[]=[
  {code:'1',name:'Ativo',class:'ativo',nature:'devedora',level:1},
  {code:'1.1',name:'Ativo Circulante',class:'ativo',nature:'devedora',level:2,parentCode:'1'},
  {code:'1.1.01',name:'Caixa e Bancos',class:'ativo',nature:'devedora',level:3,parentCode:'1.1'},
  {code:'1.1.02',name:'Contas a Receber',class:'ativo',nature:'devedora',level:3,parentCode:'1.1'},
  {code:'1.1.03',name:'Estoques',class:'ativo',nature:'devedora',level:3,parentCode:'1.1'},
  {code:'1.2',name:'Ativo Não Circulante',class:'ativo',nature:'devedora',level:2,parentCode:'1'},
  {code:'1.2.01',name:'Imobilizado',class:'ativo',nature:'devedora',level:3,parentCode:'1.2'},
  {code:'2',name:'Passivo',class:'passivo',nature:'credora',level:1},
  {code:'2.1',name:'Passivo Circulante',class:'passivo',nature:'credora',level:2,parentCode:'2'},
  {code:'2.1.01',name:'Fornecedores',class:'passivo',nature:'credora',level:3,parentCode:'2.1'},
  {code:'2.1.02',name:'Obrigações e Tributos',class:'passivo',nature:'credora',level:3,parentCode:'2.1'},
  {code:'2.2',name:'Passivo Não Circulante',class:'passivo',nature:'credora',level:2,parentCode:'2'},
  {code:'2.2.01',name:'Empréstimos e Financiamentos',class:'passivo',nature:'credora',level:3,parentCode:'2.2'},
  {code:'3',name:'Patrimônio Líquido',class:'patrimonio',nature:'credora',level:1},
  {code:'3.1',name:'Capital Social',class:'patrimonio',nature:'credora',level:2,parentCode:'3'},
  {code:'3.2',name:'Lucros/Prejuízos Acumulados',class:'patrimonio',nature:'credora',level:2,parentCode:'3'},
  {code:'4',name:'Receitas',class:'receita',nature:'credora',level:1},
  {code:'4.1',name:'Receita de Vendas',class:'receita',nature:'credora',level:2,parentCode:'4'},
  {code:'5',name:'Custos',class:'custo',nature:'devedora',level:1},
  {code:'5.1',name:'Custo dos Produtos/Serviços',class:'custo',nature:'devedora',level:2,parentCode:'5'},
  {code:'6',name:'Despesas',class:'despesa',nature:'devedora',level:1},
  {code:'6.1',name:'Despesas Operacionais',class:'despesa',nature:'devedora',level:2,parentCode:'6'},
  {code:'6.2',name:'Despesas Financeiras',class:'despesa',nature:'devedora',level:2,parentCode:'6'},
  {code:'6.3',name:'Impostos sobre o Resultado',class:'despesa',nature:'devedora',level:2,parentCode:'6'},
]

const money=(n:number)=>Math.round(n*100)/100
const openingEntry:JournalEntry={id:'OPENING-2025',date:'2025-12-31',description:'Saldos de abertura do modelo financeiro',competence:'2025-12',source:'INTEGRACAO',lines:[
  {account:'1.1.01',debit:openingBalance.cash,credit:0},
  {account:'1.1.02',debit:openingBalance.accountsReceivable,credit:0},
  {account:'1.1.03',debit:openingBalance.inventory,credit:0},
  {account:'1.2.01',debit:openingBalance.fixedAssets,credit:0},
  {account:'2.1.01',debit:0,credit:openingBalance.suppliers},
  {account:'2.1.02',debit:0,credit:openingBalance.obligations},
  {account:'2.2.01',debit:0,credit:openingBalance.debt},
  {account:'3.1',debit:0,credit:openingBalance.equity},
]}

const monthlyEntries:JournalEntry[]=financialCore.flatMap((m,i)=>{
  const previous=i===0?openingBalance:{accountsReceivable:financialCore[i-1].accountsReceivable,inventory:financialCore[i-1].inventory,suppliers:financialCore[i-1].suppliers,obligations:financialCore[i-1].obligations,debt:financialCore[i-1].debt}
  const deltaReceivables=m.accountsReceivable-previous.accountsReceivable
  const collections=money(m.revenue-deltaReceivables)
  const purchases=money(m.cost+(m.inventory-previous.inventory))
  const supplierPayment=money(previous.suppliers+purchases+m.opex-m.suppliers)
  const taxPayment=money(-m.taxes)
  const financePayment=money(-m.financialResult)
  const financingChange=money(m.debt-previous.debt)
  const date=`2026-${String(i+1).padStart(2,'0')}-28`
  const competence=`2026-${String(i+1).padStart(2,'0')}`
  const id=(suffix:string)=>`${competence}-${suffix}`
  const entries:JournalEntry[]=[
    {id:id('REV'),date,competence,description:'Reconhecimento da receita de vendas',source:'INTEGRACAO',lines:[{account:'1.1.02',debit:m.revenue,credit:0},{account:'4.1',debit:0,credit:m.revenue}]},
    {id:id('COL'),date,competence,description:'Recebimento de clientes',source:'INTEGRACAO',lines:[{account:'1.1.01',debit:collections,credit:0},{account:'1.1.02',debit:0,credit:collections}]},
    {id:id('PUR'),date,competence,description:'Compras para formação do estoque',source:'INTEGRACAO',lines:[{account:'1.1.03',debit:purchases,credit:0},{account:'2.1.01',debit:0,credit:purchases}]},
    {id:id('COGS'),date,competence,description:'Reconhecimento do custo dos produtos/serviços',source:'INTEGRACAO',lines:[{account:'5.1',debit:m.cost,credit:0},{account:'1.1.03',debit:0,credit:m.cost}]},
    {id:id('OPEX'),date,competence,description:'Reconhecimento das despesas operacionais',source:'INTEGRACAO',lines:[{account:'6.1',debit:m.opex,credit:0},{account:'2.1.01',debit:0,credit:m.opex}]},
    {id:id('SUP'),date,competence,description:'Pagamento a fornecedores',source:'INTEGRACAO',lines:[{account:'2.1.01',debit:supplierPayment,credit:0},{account:'1.1.01',debit:0,credit:supplierPayment}]},
    {id:id('DEP'),date,competence,description:'Depreciação do imobilizado',source:'INTEGRACAO',lines:[{account:'6.1',debit:m.depreciation,credit:0},{account:'1.2.01',debit:0,credit:m.depreciation}]},
    {id:id('FINEXP'),date,competence,description:'Pagamento de despesas financeiras',source:'INTEGRACAO',lines:[{account:'6.2',debit:financePayment,credit:0},{account:'1.1.01',debit:0,credit:financePayment}]},
    {id:id('TAX'),date,competence,description:'Reconhecimento dos impostos sobre o resultado',source:'INTEGRACAO',lines:[{account:'6.3',debit:taxPayment,credit:0},{account:'2.1.02',debit:0,credit:taxPayment}]},
    {id:id('TAXPAY'),date,competence,description:'Pagamento dos impostos sobre o resultado',source:'INTEGRACAO',lines:[{account:'2.1.02',debit:taxPayment,credit:0},{account:'1.1.01',debit:0,credit:taxPayment}]},
    {id:id('CAPEX'),date,competence,description:'Aquisição de imobilizado',source:'INTEGRACAO',lines:[{account:'1.2.01',debit:m.capex,credit:0},{account:'1.1.01',debit:0,credit:m.capex}]},
  ]
  if(financingChange>0) entries.push({id:id('FININ'),date,competence,description:'Captação de financiamento',source:'INTEGRACAO',lines:[{account:'1.1.01',debit:financingChange,credit:0},{account:'2.2.01',debit:0,credit:financingChange}]})
  if(financingChange<0) entries.push({id:id('FINOUT'),date,competence,description:'Amortização de financiamento',source:'INTEGRACAO',lines:[{account:'2.2.01',debit:-financingChange,credit:0},{account:'1.1.01',debit:0,credit:-financingChange}]})
  return entries
})

export const integratedJournal:JournalEntry[]=[openingEntry,...monthlyEntries]
// Compatibilidade: módulos existentes continuam consumindo o mesmo Diário integrado.
export const sampleJournal=integratedJournal

export function entryTotals(entry:JournalEntry){const debit=entry.lines.reduce((sum,line)=>sum+Number(line.debit||0),0);const credit=entry.lines.reduce((sum,line)=>sum+Number(line.credit||0),0);return{debit,credit,balanced:Math.abs(debit-credit)<0.01}}
export function journalIsBalanced(entries:JournalEntry[]){return entries.every(entry=>entryTotals(entry).balanced)}
export function validateJournalEntry(entry:JournalEntry){const errors:string[]=[];const codes=new Set(chartOfAccounts.map(account=>account.code));if(!entry.date) errors.push('Data do lançamento é obrigatória.');if(!entry.description) errors.push('Histórico é obrigatório.');if(!entry.lines.length) errors.push('O lançamento deve possuir ao menos duas partidas.');const totals=entryTotals(entry);if(!totals.balanced) errors.push('Débitos e créditos do lançamento não estão balanceados.');for(const line of entry.lines){if(!codes.has(line.account)) errors.push(`Conta inexistente: ${line.account}.`);if(line.debit<0||line.credit<0) errors.push(`Valores negativos não são permitidos: ${line.account}.`);if(line.debit>0&&line.credit>0) errors.push(`A partida ${line.account} não pode ter débito e crédito simultaneamente.`)}return errors}
export function validateJournal(entries:JournalEntry[]){return entries.flatMap(entry=>validateJournalEntry(entry).map(error=>`${entry.id}: ${error}`))}
export type AccountBalance={accountCode:string;debit:number;credit:number;balance:number}
export function ledgerFromJournal(entries:JournalEntry[]):AccountBalance[]{const balances=new Map<string,AccountBalance>();const ensure=(accountCode:string)=>{if(!balances.has(accountCode)) balances.set(accountCode,{accountCode,debit:0,credit:0,balance:0});return balances.get(accountCode)!};for(const entry of entries) for(const line of entry.lines){ensure(line.account).debit+=Number(line.debit||0);ensure(line.account).credit+=Number(line.credit||0)}return Array.from(balances.values()).map(item=>({...item,balance:item.debit-item.credit}))}
export function journalTotals(entries:JournalEntry[]){const totals=entries.reduce((acc,entry)=>{const t=entryTotals(entry);acc.debit+=t.debit;acc.credit+=t.credit;return acc},{debit:0,credit:0});return{...totals,difference:totals.debit-totals.credit,balanced:Math.abs(totals.debit-totals.credit)<0.01}}

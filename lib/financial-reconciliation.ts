import {financialCore, openingBalance, dreFromCore} from './financial-core'
import {monthlyData, monthlyBalance} from './monthly-data'
import {cashFlowEngine} from './dfc-engine'
import type {FinancialEntry} from './lancamentos-data'

export type ReconciliationResult={sourceRevenue:number;sourceOpex:number;sourceResult:number;entriesCount:number;balanced:boolean;differences:string[]}
export function reconcileOperationalViews(entries:FinancialEntry[]):ReconciliationResult{
  const operational=entries.filter(e=>e.type==='Receita'||e.type==='Despesa')
  const sourceRevenue=operational.filter(e=>e.type==='Receita').reduce((s,e)=>s+Math.abs(e.value),0)
  const sourceOpex=operational.filter(e=>e.type==='Despesa').reduce((s,e)=>s+Math.abs(e.value),0)
  const sourceResult=sourceRevenue-sourceOpex
  const differences:string[]=[]
  if(!Number.isFinite(sourceRevenue)) differences.push('Receita contém valor inválido.')
  if(!Number.isFinite(sourceOpex)) differences.push('OPEX contém valor inválido.')
  if(!Number.isFinite(sourceResult)) differences.push('Resultado contém valor inválido.')
  return{sourceRevenue,sourceOpex,sourceResult,entriesCount:operational.length,balanced:differences.length===0,differences}
}

export type FinancialReconciliationCheck={id:string;month?:string;metric:string;sourceValue:number;viewValue:number;difference:number;ok:boolean;detail:string}
const TOLERANCE=0.01
const isOk=(difference:number)=>Math.abs(difference)<TOLERANCE

/** Zero Difference Gate: compara as visões com a fonte central e valida a DFC pelo motor indireto. */
export function financialReconciliation(){
  const checks:FinancialReconciliationCheck[]=[]
  let previousPl=openingBalance.equity

  financialCore.forEach((core,i)=>{
    const management=monthlyData[i]
    const balance=monthlyBalance[i]
    const dre=dreFromCore(core)
    const compare=(id:string,metric:string,sourceValue:number,viewValue:number,detail:string)=>{
      const difference=viewValue-sourceValue
      checks.push({id,month:core.month,metric,sourceValue,viewValue,difference,ok:isOk(difference),detail})
    }

    compare('core-dre-revenue','Receita líquida',dre.receita,management.receitaLiquida,'Financial Core × DRE gerencial')
    compare('core-dre-cost','Custos',dre.custos,management.custos,'Financial Core × DRE gerencial')
    compare('core-dre-opex','OPEX',dre.opex,management.opex,'Financial Core × DRE gerencial')
    compare('core-dre-ebitda','EBITDA',dre.ebitda,management.ebitda,'Financial Core × DRE gerencial')
    compare('core-dre-net-income','Lucro líquido',dre.lucroLiquido,management.lucroLiquido,'Financial Core × DRE gerencial')

    const monthKey=`2026-${String(i+1).padStart(2,'0')}`
    const dfc=cashFlowEngine(undefined,{start:monthKey,end:monthKey})
    compare('core-dfc-operating','Caixa operacional',dfc.operational,management.caixaOperacional,'Motor DFC indireto × DFC gerencial')
    compare('core-dfc-investment','Investimentos / CAPEX',dfc.investment,management.investimentos,'Motor DFC indireto × DFC gerencial')
    compare('core-dfc-financing','Financiamentos',dfc.financing,management.financiamentos,'Motor DFC indireto × DFC gerencial')
    compare('core-dfc-cash-final','Caixa final',dfc.finalCash,management.caixaFinal,'Motor DFC indireto × DFC gerencial')

    compare('core-bp-cash','Caixa',dfc.finalCash,balance.caixa,'Fonte de caixa × Balanço gerencial')
    compare('core-bp-receivables','Contas a receber',core.accountsReceivable,balance.contasReceber,'Financial Core × Balanço gerencial')
    compare('core-bp-inventory','Estoques',core.inventory,balance.estoques,'Financial Core × Balanço gerencial')
    compare('core-bp-fixed-assets','Imobilizado',core.fixedAssets,balance.imobilizado,'Financial Core × Balanço gerencial')
    compare('core-bp-suppliers','Fornecedores',core.suppliers,balance.fornecedores,'Financial Core × Balanço gerencial')
    compare('core-bp-obligations','Obrigações',core.obligations,balance.obrigacoes,'Financial Core × Balanço gerencial')
    compare('core-bp-debt','Dívida de longo prazo',core.debt,balance.dividasLongoPrazo,'Financial Core × Balanço gerencial')

    previousPl+=dre.lucroLiquido
    compare('dre-pl-movement','Movimentação do PL',previousPl,balance.pl,'PL de abertura + lucro líquido do Financial Core × BP')

    const acComposition=balance.caixa+balance.contasReceber+balance.estoques+balance.outrosAtivos
    const ancComposition=balance.imobilizado
    compare('bp-ac-composition','Ativo circulante',acComposition,balance.ativoCirculante,'Composição independente do Ativo Circulante')
    compare('bp-anc-composition','Ativo não circulante',ancComposition,balance.ativoNaoCirculante,'Composição independente do Ativo Não Circulante')
    compare('bp-total-assets','Ativo total',balance.ativoCirculante+balance.ativoNaoCirculante,balance.ativoTotal,'AC + ANC × Ativo Total')
    compare('bp-total-liabilities','Passivo total',balance.passivoCirculante+balance.outrosPassivos+balance.passivoNaoCirculante,balance.passivoTotal,'PC + outros passivos + PNC × Passivo Total')
    compare('bp-equation','Equação patrimonial',balance.ativoTotal,balance.passivoTotal+balance.pl,'Ativo = Passivo + Patrimônio Líquido')
  })

  const pending=checks.filter(check=>!check.ok)
  return{checks,pending,overall:pending.length===0,summary:{total:checks.length,ok:checks.length-pending.length,pending:pending.length}}
}

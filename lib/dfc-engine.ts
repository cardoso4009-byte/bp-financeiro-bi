import {financialCore, openingBalance} from './financial-core'
import {monthlyBalance, monthlyData} from './monthly-data'
import type {AnalysisPeriod} from './period-engine'

export type FlowCategory='operational'|'investment'|'financing'
export type CashFlowEvidence={entryId:string;date:string;description:string;cashEffect:number;counterpart:string;category:FlowCategory}

const TOLERANCE=0.01
const money=(n:number)=>Math.round(n*100)/100

/** DFC gerencial pelo método indireto, derivada das demonstrações integradas. */
export function cashFlowEngine(_entries?:unknown,period?:AnalysisPeriod){
  const start=period?.start.slice(0,7)??'2026-01'
  const end=period?.end.slice(0,7)??'2026-12'
  const indices=financialCore.map((core,i)=>({core,i})).filter(({i})=>{
    const key=`2026-${String(i+1).padStart(2,'0')}`
    return key>=start&&key<=end
  })

  let operational=0
  let investment=0
  let financing=0
  const evidence:CashFlowEvidence[]=[]
  const errors:string[]=[]

  for(const {core,i} of indices){
    const previous=i===0?openingBalance:{
      accountsReceivable:financialCore[i-1].accountsReceivable,
      inventory:financialCore[i-1].inventory,
      suppliers:financialCore[i-1].suppliers,
      obligations:financialCore[i-1].obligations,
    }
    const netIncome=core.revenue-core.cost-core.opex-core.depreciation+core.financialResult+core.taxes
    const depreciation=core.depreciation
    const deltaReceivables=core.accountsReceivable-previous.accountsReceivable
    const deltaInventory=core.inventory-previous.inventory
    const deltaSuppliers=core.suppliers-previous.suppliers
    const deltaObligations=core.obligations-previous.obligations
    const operating=money(netIncome+depreciation-deltaReceivables-deltaInventory+deltaSuppliers+deltaObligations)
    const investmentFlow=-core.capex
    const financingChange=money(core.debt-(i===0?openingBalance.debt:financialCore[i-1].debt))

    operational+=operating
    investment+=investmentFlow
    financing+=financingChange

    evidence.push({entryId:`2026-${String(i+1).padStart(2,'0')}-IND`,date:`2026-${String(i+1).padStart(2,'0')}-28`,description:'Reconciliação da geração de caixa pelo método indireto',cashEffect:operating,counterpart:'DRE + Capital de Giro',category:'operational'})
    evidence.push({entryId:`2026-${String(i+1).padStart(2,'0')}-CAPEX`,date:`2026-${String(i+1).padStart(2,'0')}-28`,description:'Investimentos em imobilizado',cashEffect:investmentFlow,counterpart:'1.2.01',category:'investment'})
    if(financingChange!==0)evidence.push({entryId:`2026-${String(i+1).padStart(2,'0')}-FIN`,date:`2026-${String(i+1).padStart(2,'0')}-28`,description:'Variação de financiamentos',cashEffect:financingChange,counterpart:'2.2.01',category:'financing'})
  }

  const firstIndex=indices[0]?.i??0
  const lastIndex=indices[indices.length-1]?.i??11
  const initialCash=firstIndex===0?openingBalance.cash:monthlyData[firstIndex-1].caixaFinal
  const variation=money(operational+investment+financing)
  const finalCash=money(initialCash+variation)
  const balanceCash=monthlyBalance[lastIndex]?.caixa??0
  const reconciliation=money(finalCash-balanceCash)

  if(!indices.length)errors.push('Período sem competências financeiras.')

  return{operational:money(operational),investment:money(investment),financing:money(financing),variation,initialCash,finalCash,balanceCash,reconciliation,status:Math.abs(reconciliation)<TOLERANCE&&errors.length===0?'OK':'REVISAR',evidence,errors}
}

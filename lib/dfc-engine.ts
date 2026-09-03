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
  let netIncome=0
  let depreciation=0
  let deltaReceivables=0
  let deltaInventory=0
  let deltaSuppliers=0
  let deltaObligations=0
  const evidence:CashFlowEvidence[]=[]
  const errors:string[]=[]

  for(const {core,i} of indices){
    const previous=i===0?openingBalance:{
      accountsReceivable:financialCore[i-1].accountsReceivable,
      inventory:financialCore[i-1].inventory,
      suppliers:financialCore[i-1].suppliers,
      obligations:financialCore[i-1].obligations,
    }
    const monthlyNetIncome=core.revenue-core.cost-core.opex-core.depreciation+core.financialResult+core.taxes
    const monthlyDepreciation=core.depreciation
    const monthlyDeltaReceivables=core.accountsReceivable-previous.accountsReceivable
    const monthlyDeltaInventory=core.inventory-previous.inventory
    const monthlyDeltaSuppliers=core.suppliers-previous.suppliers
    const monthlyDeltaObligations=core.obligations-previous.obligations
    const operating=money(monthlyNetIncome+monthlyDepreciation-monthlyDeltaReceivables-monthlyDeltaInventory+monthlyDeltaSuppliers+monthlyDeltaObligations)
    const investmentFlow=-core.capex
    const financingChange=money(core.debt-(i===0?openingBalance.debt:financialCore[i-1].debt))

    operational+=operating
    investment+=investmentFlow
    financing+=financingChange
    netIncome+=monthlyNetIncome
    depreciation+=monthlyDepreciation
    deltaReceivables+=monthlyDeltaReceivables
    deltaInventory+=monthlyDeltaInventory
    deltaSuppliers+=monthlyDeltaSuppliers
    deltaObligations+=monthlyDeltaObligations

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

  return{operational:money(operational),investment:money(investment),financing:money(financing),variation,initialCash,finalCash,balanceCash,reconciliation,status:Math.abs(reconciliation)<TOLERANCE&&errors.length===0?'OK':'REVISAR',evidence,errors,operatingBridge:{netIncome:money(netIncome),depreciation:money(depreciation),deltaReceivables:money(deltaReceivables),deltaInventory:money(deltaInventory),deltaSuppliers:money(deltaSuppliers),deltaObligations:money(deltaObligations)}}
}

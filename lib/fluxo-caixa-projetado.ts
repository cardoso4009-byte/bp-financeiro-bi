import {financialCore, openingBalance} from './financial-core'
import {cashFlowEngine} from './dfc-engine'
export type Scenario='base'|'otimista'|'pessimista'
export type CashForecastRow={month:string;opening:number;inflows:number;operatingOutflows:number;capex:number;financing:number;net:number;closing:number;minimum:number}
export type WorkingCapitalMetrics={pmr:number;pme:number;pmp:number;cicloFinanceiro:number;necessidadeCapitalGiro:number}
const factors:Record<Scenario,number>={base:1,otimista:1.08,pessimista:.92}

/**
 * A projeção base reproduz a DFC indireta do Financial Core.
 * Os cenários apenas aplicam uma premissa explícita sobre a geração operacional;
 * CAPEX e financiamentos continuam vindo da fonte central para não inventar eventos.
 */
export function buildCashForecast(scenario:Scenario='base',_initialCash=openingBalance.cash):CashForecastRow[]{
  let closing=openingBalance.cash
  const f=factors[scenario]
  return financialCore.map((m,i)=>{
    const key=`2026-${String(i+1).padStart(2,'0')}`
    const flow=cashFlowEngine(undefined,{start:key,end:key})
    const operating=flow.operational*f
    const investment=flow.investment
    const financing=flow.financing
    const net=operating+investment+financing
    const opening=closing
    closing=opening+net
    return{month:m.month,opening,inflows:m.cashIn*f,operatingOutflows:Math.max(0,m.cashOut*(scenario==='pessimista'?1.04:scenario==='otimista'?.98:1)),capex:Math.abs(investment),financing,net,closing,minimum:30000}
  })
}

export function workingCapitalMetrics(scenario:Scenario='base'):WorkingCapitalMetrics{
 const f=factors[scenario]
 const annualRevenue=financialCore.reduce((s,m)=>s+m.revenue,0)*f
 const annualCost=financialCore.reduce((s,m)=>s+m.cost,0)*f
 const annualSales=annualRevenue/12
 const annualPurchases=annualCost/12
 const receivables=annualSales*35/30
 const inventory=annualCost*45/365
 const payables=annualPurchases*40/30
 const pmr=35
 const pme=45
 const pmp=40
 const cicloFinanceiro=pmr+pme-pmp
 const necessidadeCapitalGiro=receivables+inventory-payables
 return{pmr,pme,pmp,cicloFinanceiro,necessidadeCapitalGiro}
}
export function forecastStatus(rows:CashForecastRow[]){const min=Math.min(...rows.map(r=>r.closing));if(min<0)return{status:'CRÍTICO',title:'Risco de falta de caixa',detail:'O saldo projetado fica negativo em pelo menos um período.'};if(min<rows[0].minimum)return{status:'ATENÇÃO',title:'Caixa abaixo do mínimo',detail:'A projeção indica pressão de liquidez e exige ação preventiva.'};return{status:'SAUDÁVEL',title:'Caixa projetado dentro do limite',detail:'O saldo permanece acima do caixa mínimo definido.'}}

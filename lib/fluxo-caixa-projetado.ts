import {financialCore, openingBalance} from './financial-core'
import {cashFlowEngine} from './dfc-engine'
type CapexScheduleEntry = { competence:string; plannedAmount:number }
export type Scenario='base'|'otimista'|'pessimista'
export type CashForecastRow={month:string;opening:number;inflows:number;operatingOutflows:number;capex:number;workingCapitalImpact:number;financing:number;net:number;closing:number;minimum:number}
export type WorkingCapitalMetrics={pmr:number;pme:number;pmp:number;cicloFinanceiro:number;necessidadeCapitalGiro:number}
const factors:Record<Scenario,number>={base:1,otimista:1.08,pessimista:.92}

/**
 * A projeção base reproduz a DFC indireta do Financial Core.
 * Os cenários aplicam uma premissa explícita sobre a geração operacional;
 * os componentes exibidos são derivados da mesma ponte para que entradas,
 * saídas, CAPEX, financiamentos e variação de caixa permaneçam reconciliados.
 */
export function buildCashForecast(scenario:Scenario='base',_initialCash=openingBalance.cash,capexSchedule:CapexScheduleEntry[]=[],includeWorkingCapital=false):CashForecastRow[]{
  let closing=openingBalance.cash
  const f=factors[scenario]
  let previousWorkingCapital=0
  return financialCore.map((m,i)=>{
    const key=`2026-${String(i+1).padStart(2,'0')}`
    const flow=cashFlowEngine(undefined,{start:key,end:key})
    const operating=flow.operational*f
    const scheduledCapex=capexSchedule.filter(e=>e.competence===key).reduce((s,e)=>s+Math.abs(e.plannedAmount),0)
    const investment=capexSchedule.some(e=>e.competence===key)?-scheduledCapex:flow.investment
    const financing=flow.financing
    const monthlyRevenue=m.revenue*f
    const monthlyCost=m.cost*f
    const receivables=monthlyRevenue*35/30
    const inventory=monthlyCost*45/30
    const payables=monthlyCost*40/30
    const workingCapitalNeed=receivables+inventory-payables
    const workingCapitalImpact=includeWorkingCapital?(previousWorkingCapital-workingCapitalNeed):0
    previousWorkingCapital=workingCapitalNeed
    const inflows=m.cashIn*f
    const operatingOutflows=Math.max(0,inflows-operating)
    const net=operating+investment+financing+workingCapitalImpact
    const opening=closing
    closing=opening+net
    return{month:m.month,opening,inflows,operatingOutflows,capex:Math.abs(investment),workingCapitalImpact,financing,net,closing,minimum:30000}
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

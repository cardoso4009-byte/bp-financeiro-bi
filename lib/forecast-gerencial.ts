import type { FinancialEntry } from './lancamentos-data'
import type { ActionPlanItem } from './action-plan-store'

type Bucket = { revenue:number; opex:number; capex:number; financing:number }
export type ForecastRow = Bucket & { competence:string; isActual:boolean; source:'Realizado'|'Forecast'; net:number }
export type AnnualForecast = { rows:ForecastRow[]; annualBudget:Bucket; actualToDate:Bucket; forecastAnnual:Bucket; gap:Bucket; confidence:'Alta'|'Média'|'Baixa'; openActions:number; overdueActions:number }

const zero=():Bucket=>({revenue:0,opex:0,capex:0,financing:0})
const add=(a:Bucket,b:Bucket)=>({revenue:a.revenue+b.revenue,opex:a.opex+b.opex,capex:a.capex+b.capex,financing:a.financing+b.financing})
function entriesByMonth(entries:FinancialEntry[], competence:string){return entries.filter(e=>e.competence===competence).reduce((a,e)=>{const v=Math.abs(e.value);if(e.type==='Receita')a.revenue+=v;if(e.type==='Despesa')a.opex+=v;if(e.type==='CAPEX')a.capex+=v;if(e.type==='Financiamento')a.financing+=v;return a},zero())}
function budgetByMonth(items:any[], competence:string){return items.filter(x=>x.competence===competence).reduce((a,x)=>{const v=Math.abs(Number(x.budget)||0);if(x.type==='Receita')a.revenue+=v;if(x.type==='Despesa')a.opex+=v;if(x.type==='CAPEX')a.capex+=v;if(x.type==='Financiamento')a.financing+=v;return a},zero())}
export function buildAnnualForecast(entries:FinancialEntry[], budgetItems:any[], year:number, asOf:string, actions:ActionPlanItem[]=[]):AnnualForecast{
 const months=Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`)
 const cutoff=asOf.slice(0,7)
 const actualMonths=months.filter(m=>m<=cutoff)
 const futureMonths=months.filter(m=>m>cutoff)
 const actualToDate=actualMonths.reduce((a,m)=>add(a,entriesByMonth(entries,m)),zero())
 const annualBudget=months.reduce((a,m)=>add(a,budgetByMonth(budgetItems,m)),zero())
 const historical=actualMonths.map(m=>entriesByMonth(entries,m)).filter(x=>x.revenue+x.opex+x.capex+x.financing>0)
 const avg=(key:keyof Bucket)=>historical.length?historical.reduce((s,x)=>s+x[key],0)/historical.length:0
 const future= futureMonths.reduce((a,m)=>{const b=budgetByMonth(budgetItems,m);const hasBudget=Object.values(b).some(v=>v>0);const projected=hasBudget?b:{revenue:avg('revenue'),opex:avg('opex'),capex:avg('capex'),financing:avg('financing')};return add(a,projected)},zero())
 const forecastAnnual=add(actualToDate,future)
 const gap={revenue:forecastAnnual.revenue-annualBudget.revenue,opex:forecastAnnual.opex-annualBudget.opex,capex:forecastAnnual.capex-annualBudget.capex,financing:forecastAnnual.financing-annualBudget.financing}
 const open=actions.filter(a=>a.status==='Pendente'||a.status==='Em andamento')
 const overdue=open.filter(a=>a.dueDate&&a.dueDate<asOf).length
 const confidence=historical.length>=6?'Alta':historical.length>=3?'Média':'Baixa'
 const rows=months.map(m=>{const isActual=m<=cutoff;const b=isActual?entriesByMonth(entries,m):budgetByMonth(budgetItems,m);const net=b.revenue-b.opex-b.capex+b.financing;return {...b,competence:m,isActual,source:isActual?'Realizado':'Forecast',net}})
 return {rows,annualBudget,actualToDate,forecastAnnual,gap,confidence,openActions:open.length,overdueActions:overdue}
}

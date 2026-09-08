import type { AnnualForecast, ForecastRow } from './forecast-gerencial'

export type ForecastScenarioKey = 'base'|'otimista'|'pessimista'
export type ForecastScenario = { key:ForecastScenarioKey; label:string; revenueFactor:number; opexFactor:number; capexFactor:number; financingFactor:number; finalResult:number; gap:number; risk:'Baixo'|'Médio'|'Alto' }

export function applyForecastScenario(base:AnnualForecast,key:ForecastScenarioKey):ForecastScenario{
 const factors={base:[1,1,1,1],otimista:[1.08,.95,.9,1],pessimista:[.92,1.08,1.05,1.03]}[key]
 const [rf,of,cf,ff]=factors
 const annual=base.forecastAnnual, budget=base.annualBudget
 const result=annual.revenue*rf-annual.opex*of-annual.capex*cf+annual.financing*ff
 const budgetResult=budget.revenue-budget.opex-budget.capex+budget.financing
 const gap=result-budgetResult
 const risk=gap>=0?'Baixo':gap>=-Math.max(Math.abs(budgetResult)*.1,1)?'Médio':'Alto'
 return {key,label:key==='base'?'Base':key==='otimista'?'Otimista':'Pessimista',revenueFactor:rf,opexFactor:of,capexFactor:cf,financingFactor:ff,finalResult:result,gap,risk}
}

export function scenarioRows(rows:ForecastRow[],key:ForecastScenarioKey){
 const [rf,of,cf,ff]={base:[1,1,1,1],otimista:[1.08,.95,.9,1],pessimista:[.92,1.08,1.05,1.03]}[key]
 return rows.map(r=>{const revenue=r.revenue*rf,opex=r.opex*of,capex=r.capex*cf,financing=r.financing*ff;return {...r,revenue,opex,capex,financing,net:revenue-opex-capex+financing}})
}

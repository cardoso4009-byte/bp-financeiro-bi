import type { ProjectionPeriod } from './cashflow-projection'

export type Scenario = { name:string; revenueFactor:number; payablesFactor:number; capexFactor:number; financingFactor:number }
export type ScenarioResult = { name:string; finalCash:number; minimumCash:number; minimumMonth:string; critical:boolean; periods:ProjectionPeriod[] }

export const defaultScenarios:Scenario[] = [
  {name:'Base',revenueFactor:1,payablesFactor:1,capexFactor:1,financingFactor:1},
  {name:'Otimista',revenueFactor:1.1,payablesFactor:0.95,capexFactor:0.9,financingFactor:1},
  {name:'Pessimista',revenueFactor:0.9,payablesFactor:1.08,capexFactor:1,financingFactor:1},
]

export function runScenario(base:ProjectionPeriod[], scenario:Scenario):ScenarioResult {
  let cash=base[0]?.openingCash||0
  const periods:ProjectionPeriod[]=base.map(p=>{
    const openingCash=cash
    const receivables=p.receivables*scenario.revenueFactor
    const payables=p.payables*scenario.payablesFactor
    const financing=p.financing*scenario.financingFactor
    const capex=p.capex*scenario.capexFactor
    const projectedNet=receivables-payables+financing-capex
    cash+=projectedNet
    const risk:ProjectionPeriod['risk']=cash<0?'critical':cash<openingCash*0.2?'attention':'normal'
    return {...p,openingCash,receivables,payables,financing,capex,projectedNet,closingCash:cash,risk}
  })
  const minimumCash=periods.length?Math.min(...periods.map(p=>p.closingCash)):cash
  const minimumMonth=periods.find(p=>p.closingCash===minimumCash)?.month||'—'
  return {name:scenario.name,finalCash:periods.at(-1)?.closingCash||cash,minimumCash,minimumMonth,critical:minimumCash<0,periods}
}

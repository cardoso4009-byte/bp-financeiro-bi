'use client'

import { useMemo, useState } from 'react'
import { ReportPeriodFilter, DEFAULT_REPORT_PERIOD } from '@/components/report-period-filter'
import { competence } from '@/lib/report-period'
import { buildV2FinancialBase } from '@/lib/v2-financial-base'
import { buildV2ForecastReport } from '@/lib/v2-forecast'
import { readV2BrowserStore } from '@/lib/v2-browser-storage'
import { readV2BudgetEntries } from '@/lib/v2-budget-storage'
import { readV2CostCenters } from '@/lib/v2-cost-center-storage'
import { readV2ForecastEntries } from '@/lib/v2-forecast-storage'
import { buildForecastScenario, buildScenarioCashBridge, FORECAST_SCENARIOS, type ForecastScenario } from '@/lib/v2-forecast-scenarios'
import { readCapexSchedule } from '@/lib/capex-schedule'
import { workingCapitalData } from '@/lib/capital-giro-engine'
import { buildWorkingCapitalForecast } from '@/lib/capital-giro-forecast'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const periods=Array.from({length:12},(_,i)=>`2026-${String(i+1).padStart(2,'0')}`)

export default function CenariosForecastV2(){
 const [period,setPeriod]=useState({...DEFAULT_REPORT_PERIOD,month:12})
 const [scenario,setScenario]=useState<ForecastScenario>('base')
 const base=useMemo(()=>buildV2FinancialBase(readV2BrowserStore().entries),[])
 const budget=useMemo(()=>readV2BudgetEntries(),[])
 const centers=useMemo(()=>readV2CostCenters(),[])
 const forecast=useMemo(()=>readV2ForecastEntries(),[])
 const cutoff=competence(period.year,period.month)
 const report=useMemo(()=>buildV2ForecastReport(base,budget,forecast,centers,cutoff,periods),[base,budget,forecast,centers,cutoff])
 const result=useMemo(()=>buildForecastScenario(report.lines,scenario),[report.lines,scenario])
 const capexSchedule=useMemo(()=>readCapexSchedule(),[])
 const capexByScenario=useMemo(()=>FORECAST_SCENARIOS.map(s=>{const x=buildForecastScenario(report.lines,s.id);const capex=capexSchedule.filter(entry=>entry.competence>cutoff).reduce((sum,entry)=>sum+Math.abs(entry.plannedAmount),0)*s.expenseFactor;return {id:s.id,label:s.label,capex,result:x.result,delta:x.deltaToBase}}),[report.lines,capexSchedule,cutoff])
 const selectedCapex=capexByScenario.find(x=>x.id===scenario) ?? capexByScenario[0]
 const futurePeriods=periods.filter(p=>p>cutoff)
 const workingCapitalBase=workingCapitalData.find(row=>row.month===cutoff) ?? workingCapitalData[workingCapitalData.length-1]
 const capitalGiroByScenario=useMemo(()=>FORECAST_SCENARIOS.map(s=>{
   const adjustedLines=report.lines.map(line=>{
     const factor=line.movementClass==='receita'?s.revenueFactor:['custo','opex','financeiro','imposto','capex'].includes(line.movementClass)?s.expenseFactor:1
     return {...line,forecast:line.forecast*factor}
   })
   const wc=buildWorkingCapitalForecast(adjustedLines,futurePeriods,{pmrDias:workingCapitalBase?.diasReceber ?? 30,pmeDias:workingCapitalBase?.diasEstoque ?? 30,pmpDias:workingCapitalBase?.diasFornecedores ?? 30},workingCapitalBase?.necessidadeCapitalGiro ?? 0)
   return {id:s.id,label:s.label,workingCapitalNeed:wc.lines.at(-1)?.workingCapitalNeed ?? 0,cashImpact:wc.totalCashImpact,cashImpactLines:wc.lines.map(line=>({period:line.period,cashImpact:line.cashImpact}))}
 }),[report.lines,futurePeriods,workingCapitalBase])
 const selectedCapitalGiro=capitalGiroByScenario.find(x=>x.id===scenario) ?? capitalGiroByScenario[0]
 const cashByScenario=useMemo(()=>FORECAST_SCENARIOS.map(s=>{
   const wc=capitalGiroByScenario.find(x=>x.id===s.id)
   const cash=buildScenarioCashBridge(report.lines,futurePeriods,s.id,capexSchedule,wc?.cashImpactLines ?? [])
   return {id:s.id,label:s.label,...cash}
 }),[report.lines,futurePeriods,capexSchedule,capitalGiroByScenario])
 const selectedCash=cashByScenario.find(x=>x.id===scenario) ?? cashByScenario[0]
 return <main className="page">
  <style>{`.page{max-width:1250px;margin:auto;padding:28px;font-family:Arial,sans-serif;color:#10243b;background:#f4f7fb;min-height:100vh}.head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:20px}.eyebrow{font-size:11px;color:#6c8298;font-weight:800;letter-spacing:.1em}.head h1{margin:6px 0;font-size:30px}.head p{margin:0;color:#6c8298}.filter{background:#fff;border:1px solid #dce6f0;border-radius:12px;padding:10px 14px}.tabs{display:flex;gap:8px;margin-bottom:14px}.tab{border:1px solid #d4e0eb;background:#fff;border-radius:9px;padding:10px 16px;font-weight:800;cursor:pointer}.tab.active{background:#17304a;color:#fff}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}.card,.panel{background:#fff;border:1px solid #dce6f0;border-radius:14px}.card{padding:17px}.card span{display:block;color:#70869c;font-size:12px}.card strong{display:block;font-size:23px;margin-top:7px}.card small{display:block;margin-top:5px;color:#8094a8}.panel{padding:20px;margin-bottom:14px}.panel h2{margin:0;font-size:17px}.title{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.title span{font-size:11px;color:#7b8fa4}.note{padding:13px;border-radius:10px;background:#f7f9fc;border:1px solid #e4ebf2;color:#536b80;font-size:12px;line-height:1.5}.table{width:100%;border-collapse:collapse;font-size:12px}.table th,.table td{padding:10px;border-bottom:1px solid #edf1f5;text-align:right}.table th:first-child,.table td:first-child{text-align:left}.positive{font-weight:800}@media(max-width:800px){.cards{grid-template-columns:1fr 1fr}.head{flex-direction:column}}@media(max-width:520px){.cards{grid-template-columns:1fr}.tabs{flex-wrap:wrap}}`}</style>
  <header className="head"><div><div className="eyebrow">CONTROLADORIA GERENCIAL</div><h1>Cenários de Forecast</h1><p>Simulação sem alterar o Forecast oficial.</p></div><div className="filter"><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/></div></header>
  <div className="tabs">{FORECAST_SCENARIOS.map(s=><button key={s.id} className={`tab ${scenario===s.id?'active':''}`} onClick={()=>setScenario(s.id)}>{s.label}</button>)}</div>
  <section className="cards"><Metric label="Receita projetada" value={result.revenue}/><Metric label="Gastos projetados" value={Math.abs(result.expenses)}/><Metric label="CAPEX projetado" value={Math.abs(selectedCapex.capex)}/><Metric label="Resultado projetado" value={result.result}/></section><section className="cards"><Metric label="NCG final projetada" value={selectedCapitalGiro.workingCapitalNeed}/><Metric label="Impacto acumulado no caixa" value={selectedCapitalGiro.cashImpact}/><Metric label="Caixa final projetado" value={selectedCash.finalCash}/><Metric label="Mínimo de caixa" value={selectedCash.minimumCash}/></section>
  <section className="panel"><div className="title"><h2>{result.scenario.label}</h2><span>Cutoff {cutoff}</span></div><div className="note">{result.scenario.description} O Forecast oficial permanece inalterado; esta tela aplica apenas fatores de simulação sobre as linhas projetadas.</div></section>
  <section className="panel"><div className="title"><h2>CAPEX por cenário</h2><span>Impacto auxiliar sobre o resultado</span></div><table className="table"><thead><tr><th>Cenário</th><th>CAPEX projetado</th><th>Resultado</th><th>Δ vs Base</th></tr></thead><tbody>{capexByScenario.map(x=><tr key={x.id}><td><b>{x.label}</b></td><td>{brl(Math.abs(x.capex))}</td><td>{brl(x.result)}</td><td>{brl(x.delta)}</td></tr>)}</tbody></table><div className="note" style={{marginTop:12}}>O CAPEX integrado ao Forecast participa da simulação como gasto. A variação por cenário é aplicada somente à análise auxiliar; o Forecast oficial permanece inalterado.</div></section>
  <section className="panel"><div className="title"><h2>Capital de Giro por cenário</h2><span>Impacto auxiliar sobre caixa</span></div><table className="table"><thead><tr><th>Cenário</th><th>NCG final</th><th>Impacto acumulado no caixa</th></tr></thead><tbody>{capitalGiroByScenario.map(x=><tr key={x.id}><td><b>{x.label}</b></td><td>{brl(x.workingCapitalNeed)}</td><td>{brl(x.cashImpact)}</td></tr>)}</tbody></table><div className="note" style={{marginTop:12}}>A NCG é calculada uma vez por cenário e sua variação entra uma única vez na ponte de caixa. O impacto é projetado e não altera o fluxo realizado.</div></section>
  <section className="panel"><div className="title"><h2>Comparação dos cenários</h2><span>Forecast + CAPEX + Capital de Giro + Caixa</span></div><table className="table"><thead><tr><th>Cenário</th><th>Receita</th><th>Gastos</th><th>CAPEX</th><th>Resultado</th><th>Impacto CG</th><th>Caixa final</th></tr></thead><tbody>{FORECAST_SCENARIOS.map(s=>{const x=buildForecastScenario(report.lines,s.id);const cg=capitalGiroByScenario.find(v=>v.id===s.id);const cash=cashByScenario.find(v=>v.id===s.id);return <tr key={s.id}><td><b>{s.label}</b></td><td>{brl(x.revenue)}</td><td>{brl(x.expenses)}</td><td>{brl(Math.abs(cash?.rows.reduce((sum,row)=>sum+row.capexCash,0) ?? 0))}</td><td className="positive">{brl(x.result)}</td><td>{brl(cg?.cashImpact ?? 0)}</td><td>{brl(cash?.finalCash ?? 0)}</td></tr>})}</tbody></table></section>
  <section className="panel"><div className="title"><h2>Ponte de Caixa do Cenário</h2><span>Teste de integração</span></div><table className="table"><thead><tr><th>Competência</th><th>Caixa inicial</th><th>Operacional</th><th>CAPEX</th><th>Capital de Giro</th><th>Impacto líquido</th><th>Caixa final</th></tr></thead><tbody>{selectedCash.rows.map(row=><tr key={row.period}><td><b>{row.period}</b></td><td>{brl(row.opening)}</td><td>{brl(row.operatingCash)}</td><td>{brl(row.capexCash)}</td><td>{brl(row.workingCapitalImpact)}</td><td>{brl(row.netCashImpact)}</td><td>{brl(row.closing)}</td></tr>)}</tbody></table><div className="note" style={{marginTop:12}}>Regra de reconciliação: Caixa inicial + Operacional + CAPEX + Impacto de Capital de Giro = Caixa final. O CAPEX vem exclusivamente do cronograma e a variação da NCG entra exclusivamente pela ponte de Capital de Giro.</div></section><section className="panel"><div className="title"><h2>Governança</h2><span>Simulação auxiliar</span></div><div className="note">Cenários são análises auxiliares. Não substituem o Forecast oficial, não geram rateios e não registram causas ou ações automaticamente. Qualquer divergência de caixa ou dupla contagem deve bloquear a aprovação da integração.</div></section>
 </main>
}
function Metric({label,value}:{label:string;value:number}){return <div className="card"><span>{label}</span><strong>{brl(value)}</strong></div>}

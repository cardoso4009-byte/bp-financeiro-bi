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
import { buildForecastScenario, FORECAST_SCENARIOS, type ForecastScenario } from '@/lib/v2-forecast-scenarios'

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
 const baseResult=useMemo(()=>buildForecastScenario(report.lines,'base'),[report.lines])
 return <main className="page">
  <style>{`.page{max-width:1250px;margin:auto;padding:28px;font-family:Arial,sans-serif;color:#10243b;background:#f4f7fb;min-height:100vh}.head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:20px}.eyebrow{font-size:11px;color:#6c8298;font-weight:800;letter-spacing:.1em}.head h1{margin:6px 0;font-size:30px}.head p{margin:0;color:#6c8298}.filter{background:#fff;border:1px solid #dce6f0;border-radius:12px;padding:10px 14px}.tabs{display:flex;gap:8px;margin-bottom:14px}.tab{border:1px solid #d4e0eb;background:#fff;border-radius:9px;padding:10px 16px;font-weight:800;cursor:pointer}.tab.active{background:#17304a;color:#fff}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}.card,.panel{background:#fff;border:1px solid #dce6f0;border-radius:14px}.card{padding:17px}.card span{display:block;color:#70869c;font-size:12px}.card strong{display:block;font-size:23px;margin-top:7px}.card small{display:block;margin-top:5px;color:#8094a8}.panel{padding:20px;margin-bottom:14px}.panel h2{margin:0;font-size:17px}.title{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.title span{font-size:11px;color:#7b8fa4}.note{padding:13px;border-radius:10px;background:#f7f9fc;border:1px solid #e4ebf2;color:#536b80;font-size:12px;line-height:1.5}.table{width:100%;border-collapse:collapse;font-size:12px}.table th,.table td{padding:10px;border-bottom:1px solid #edf1f5;text-align:right}.table th:first-child,.table td:first-child{text-align:left}.positive{font-weight:800}@media(max-width:800px){.cards{grid-template-columns:1fr 1fr}.head{flex-direction:column}}@media(max-width:520px){.cards{grid-template-columns:1fr}.tabs{flex-wrap:wrap}}`}</style>
  <header className="head"><div><div className="eyebrow">CONTROLADORIA GERENCIAL V2</div><h1>Cenários de Forecast</h1><p>Simulação sem alterar o Forecast oficial.</p></div><div className="filter"><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/></div></header>
  <div className="tabs">{FORECAST_SCENARIOS.map(s=><button key={s.id} className={`tab ${scenario===s.id?'active':''}`} onClick={()=>setScenario(s.id)}>{s.label}</button>)}</div>
  <section className="cards"><Metric label="Receita projetada" value={result.revenue}/><Metric label="Gastos projetados" value={result.expenses}/><Metric label="Resultado projetado" value={result.result}/><Metric label="Variação vs Base" value={result.deltaToBase}/></section>
  <section className="panel"><div className="title"><h2>{result.scenario.label}</h2><span>Cutoff {cutoff}</span></div><div className="note">{result.scenario.description} O Forecast oficial permanece inalterado; esta tela aplica apenas fatores de simulação sobre as linhas projetadas.</div></section>
  <section className="panel"><div className="title"><h2>Comparação dos cenários</h2><span>Mesmo Forecast de origem</span></div><table className="table"><thead><tr><th>Cenário</th><th>Receita</th><th>Gastos</th><th>Resultado</th><th>Δ vs Base</th></tr></thead><tbody>{FORECAST_SCENARIOS.map(s=>{const x=buildForecastScenario(report.lines,s.id);return <tr key={s.id}><td><b>{s.label}</b></td><td>{brl(x.revenue)}</td><td>{brl(x.expenses)}</td><td className="positive">{brl(x.result)}</td><td>{brl(x.deltaToBase)}</td></tr>})}</tbody></table></section>
  <section className="panel"><div className="title"><h2>Governança</h2><span>V2</span></div><div className="note">Cenários são análises auxiliares. Não substituem o Forecast oficial, não geram rateios e não registram causas ou ações automaticamente.</div></section>
 </main>
}
function Metric({label,value}:{label:string;value:number}){return <div className="card"><span>{label}</span><strong>{brl(value)}</strong></div>}

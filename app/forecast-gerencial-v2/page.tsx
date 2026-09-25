'use client'

import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_REPORT_PERIOD, ReportPeriodFilter } from '@/components/report-period-filter'
import type { ReportPeriod } from '@/lib/report-period'
import { competence } from '@/lib/report-period'
import { buildV2FinancialBase } from '@/lib/v2-financial-base'
import { buildV2ForecastReport, type V2ForecastEntry } from '@/lib/v2-forecast'
import { buildBudgetForecastEntries, buildRunRateForecastEntries } from '@/lib/v2-forecast-engine'
import { readV2BrowserStore } from '@/lib/v2-browser-storage'
import { readV2BudgetEntries } from '@/lib/v2-budget-storage'
import { readV2CostCenters } from '@/lib/v2-cost-center-storage'
import { readV2ForecastEntries, writeV2ForecastEntries } from '@/lib/v2-forecast-storage'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number|undefined)=>n===undefined?'—':`${(n*100).toFixed(1).replace('.',',')}%`
const periods=Array.from({length:12},(_,i)=>`2026-${String(i+1).padStart(2,'0')}`)

export default function ForecastGerencialV2(){
 const [period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,month:9})
 const [forecast,setForecast]=useState<V2ForecastEntry[]>([])
 const [source,setSource]=useState<'budget'|'run_rate'>('budget')
 const [message,setMessage]=useState('')
 useEffect(()=>{setForecast(readV2ForecastEntries())},[])
 const cutoff=competence(period.year,period.month)
 const base=useMemo(()=>buildV2FinancialBase(readV2BrowserStore().entries),[])
 const budget=useMemo(()=>readV2BudgetEntries(),[])
 
 const centers=useMemo(()=>readV2CostCenters(),[])
 const futurePeriods=periods.filter(p=>p>cutoff)
 const lookbackPeriods=periods.filter(p=>p<=cutoff).slice(-3)
 const report=useMemo(()=>buildV2ForecastReport(base,budget,forecast,centers,cutoff,periods),[base,budget,forecast,centers,cutoff])
 const generateForecast=()=>{
   const generated=source==='budget'
     ? buildBudgetForecastEntries(budget,{companyId:base.entries[0]?.companyId ?? 'empresa',cutoffPeriod:cutoff,futurePeriods})
     : buildRunRateForecastEntries(base,centers,{companyId:base.entries[0]?.companyId ?? 'empresa',cutoffPeriod:cutoff,futurePeriods,lookbackPeriods})
   const preserved=forecast.filter(entry=>entry.period<=cutoff)
   const next=[...preserved,...generated]
   writeV2ForecastEntries(next)
   setForecast(next)
   setMessage(`${generated.length} projeções geradas por ${source==='budget'?'orçamento':'run rate'}.`)
 }
 const future=report.lines.filter(l=>l.status==='projetado')
 const realized=report.lines.filter(l=>l.status==='realizado')
 const receita=report.lines.filter(l=>l.movementClass==='receita').reduce((s,l)=>s+l.forecast,0)
 const opex=report.lines.filter(l=>l.movementClass==='opex').reduce((s,l)=>s+l.forecast,0)
 const custos=report.lines.filter(l=>l.movementClass==='custo').reduce((s,l)=>s+l.forecast,0)
 const resultado=receita+opex+custos+report.lines.filter(l=>l.movementClass==='financeiro'||l.movementClass==='imposto').reduce((s,l)=>s+l.forecast,0)
 return <main style={{padding:'28px',background:'#f5f7fa',minHeight:'100vh',color:'#172033'}}>
  <header style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'center',marginBottom:20}}>
   <div><small style={{letterSpacing:'.12em',fontWeight:800,color:'#718098'}}>CONTROLADORIA GERENCIAL V2</small><h1 style={{margin:'6px 0'}}>Forecast Gerencial</h1><p style={{margin:0,color:'#718098'}}>Orçamento × Realizado × Forecast • visão anual e mensal</p></div>
   <ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/>
  </header>
  <section style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:12,marginBottom:18}}>
   <Metric label="Orçamento" value={report.budgetTotal}/><Metric label="Realizado" value={report.actualTotal}/><Metric label="Forecast" value={report.forecastTotal}/><Metric label="Gap Orçado × Forecast" value={report.budgetGap}/><Metric label="Gap Realizado × Forecast" value={report.forecastGap}/>
  </section>
  <section style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,marginBottom:18}}>
   <Metric label="Receita Forecast" value={receita}/><Metric label="Custos Forecast" value={custos}/><Metric label="OPEX Forecast" value={opex}/><Metric label="Resultado Forecast" value={resultado}/>
  </section>
  <section style={panel}><div style={title}><h2>Motor de projeção</h2><span>Fonte explícita • sem rateio automático</span></div>
   <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
    <select value={source} onChange={e=>setSource(e.target.value as 'budget'|'run_rate')} style={input}><option value="budget">Orçamento</option><option value="run_rate">Run rate — média dos últimos 3 meses</option></select>
    <button onClick={generateForecast} style={button}>Gerar forecast</button>
    {message && <span style={{fontSize:12,color:'#718098'}}>{message}</span>}
   </div>
   <p style={{fontSize:12,color:'#60778e',marginBottom:0}}>Período de corte: {cutoff}. As competências futuras {futurePeriods.join(', ') || '—'} serão recalculadas pela fonte escolhida. O histórico realizado é preservado.</p>
  </section>
  <section style={panel}><div style={title}><h2>Leitura executiva</h2><span>{realized.length} linhas realizadas • {future.length} projetadas</span></div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}><Note title="Forecast" text="Meses até a competência de corte permanecem como realizado; meses futuros usam o forecast informado."/><Note title="Governança" text="A projeção futura precisa ter fonte explícita. O sistema não cria causa nem redistribui valores automaticamente."/><Note title="Rastreabilidade" text={`${report.forecastEntries} registros de forecast • ${report.unassignedForecastEntries} sem centro de resultado.`}/></div>
  </section>
  <section style={panel}><div style={title}><h2>Forecast por competência</h2><span>Orçado × Forecast</span></div>
   <div style={{overflowX:'auto'}}><table style={table}><thead><tr><th>Competência</th><th>Status</th><th>Orçado</th><th>Realizado</th><th>Forecast</th><th>Gap</th><th>Gap %</th></tr></thead><tbody>{periods.map(p=>{const lines=report.lines.filter(l=>l.period===p);const b=lines.reduce((s,l)=>s+l.budget,0);const a=lines.reduce((s,l)=>s+l.actual,0);const f=lines.reduce((s,l)=>s+l.forecast,0);const gap=f-b;return <tr key={p}><td>{p}</td><td><Badge text={p<=cutoff?'REALIZADO':'PROJETADO'}/></td><td>{brl(b)}</td><td>{brl(a)}</td><td>{brl(f)}</td><td>{brl(gap)}</td><td>{pct(Math.abs(b)>=.005?gap/Math.abs(b):undefined)}</td></tr>})}</tbody></table></div>
  </section>
  <section style={panel}><div style={title}><h2>Desvios por dimensão</h2><span>Centro de resultado • classe financeira</span></div>
   <div style={{overflowX:'auto'}}><table style={table}><thead><tr><th>Centro</th><th>Classe</th><th>Orçado</th><th>Realizado</th><th>Forecast</th><th>Gap</th><th>Gap %</th></tr></thead><tbody>{report.lines.slice(0,40).map((l,i)=><tr key={i}><td>{l.costCenterCode} • {l.costCenterName}</td><td>{l.movementClass}</td><td>{brl(l.budget)}</td><td>{brl(l.actual)}</td><td>{brl(l.forecast)}</td><td>{brl(l.budgetVariance)}</td><td>{pct(l.budgetVariancePercent)}</td></tr>)}</tbody></table></div>
  </section>
 </main>
}
const input={padding:'9px 11px',border:'1px solid #cfdbe7',borderRadius:8,background:'#fff',color:'#172033'} as const
const button={padding:'9px 14px',border:0,borderRadius:8,background:'#17304a',color:'#fff',fontWeight:800,cursor:'pointer'} as const
const panel={background:'#fff',border:'1px solid #dbe5ef',borderRadius:14,padding:18,marginBottom:16}
const title={display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}
const table={width:'100%',borderCollapse:'collapse',fontSize:13} as const
function Metric({label,value}:{label:string;value:number}){return <div style={{background:'#fff',border:'1px solid #dbe5ef',borderRadius:12,padding:16}}><small style={{color:'#718098'}}>{label}</small><strong style={{display:'block',marginTop:8,fontSize:21}}>{brl(value)}</strong></div>}
function Note({title,text}:{title:string;text:string}){return <div style={{background:'#f7fafd',border:'1px solid #e4ebf2',borderRadius:10,padding:14}}><strong>{title}</strong><p style={{fontSize:12,lineHeight:1.5,color:'#60778e'}}>{text}</p></div>}
function Badge({text}:{text:string}){return <span style={{fontSize:10,fontWeight:800,padding:'5px 8px',borderRadius:8,background:'#edf4fb'}}>{text}</span>}

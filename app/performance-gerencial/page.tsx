'use client'

import { useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import { readActionPlan } from '@/lib/action-plan-store'
import { readBudgetPlan } from '@/lib/budget-store'
import { buildPerformanceRows, buildPerformanceSummary } from '@/lib/performance-gerencial'
import { ReportPeriodFilter } from '@/components/report-period-filter'
import { DEFAULT_REPORT_PERIOD, competence, monthLabel, type ReportPeriod } from '@/lib/report-period'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`
function empty(){return {revenue:0,opex:0,capex:0,financing:0}}
function sum(entries:any[]){return entries.reduce((a,e)=>{const v=Math.abs(Number(e.value)||0);if(e.type==='Receita')a.revenue+=v;if(e.type==='Despesa')a.opex+=v;if(e.type==='CAPEX')a.capex+=v;if(e.type==='Financiamento')a.financing+=v;return a},empty())}
function sumBudget(items:any[],months:string[]){return items.reduce((a,x)=>{const month=x.month;const index=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].indexOf(month)+1;const years=months.map(m=>m.slice(0,4));const matching=years.some(y=>months.includes(competence(Number(y),index)));if(!matching)return a;const v=Math.abs(Number(x.budget)||0);if(x.type==='Receita')a.revenue+=v;if(x.type==='Despesa')a.opex+=v;if(x.type==='CAPEX')a.capex+=v;if(x.type==='Financiamento')a.financing+=v;return a},empty())}
export default function PerformanceGerencial(){
 const source=useMemo(()=>readFinancialSource(),[]),actions=useMemo(()=>readActionPlan(),[]),budget=useMemo(()=>readBudgetPlan(),[])
 const [period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,month:12})
 const months=period.view==='mensal'||period.view==='comparativo'?[competence(period.year,period.month)]:Array.from({length:period.month},(_,i)=>competence(period.year,i+1))
 const actual=useMemo(()=>sum(source.entries.filter(e=>months.includes(e.competence))),[source,months])
 const monthlyBudget=useMemo(()=>sumBudget(budget,months),[budget,months])
 const forecast={revenue:actual.revenue,opex:actual.opex,capex:actual.capex,financing:actual.financing}
 const rows=useMemo(()=>buildPerformanceRows(monthlyBudget,actual,forecast,actions),[monthlyBudget,actual,forecast,actions])
 const summary=buildPerformanceSummary(rows,actions)
 const prev=period.month===1?competence(period.year-1,12):competence(period.year,period.month-1)
 const prevActual=sum(source.entries.filter(e=>e.competence===prev)),prevBudget=sumBudget(budget,[prev])
 const prevRows=buildPerformanceRows(prevBudget,prevActual,prevActual,actions),prevSummary=buildPerformanceSummary(prevRows,actions)
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Performance Gerencial</h1><p>Orçado → Realizado → Forecast → Desvio → Ação → Impacto</p></div></header>
  <section className="panel wide"><ReportPeriodFilter value={period} onChange={setPeriod} years={[2025,2026]}/></section>
  <div className="cards"><Metric title="Orçamento" value={brl(summary.totalBudget)}/><Metric title="Realizado" value={brl(summary.totalActual)}/><Metric title="Forecast" value={brl(summary.totalForecast)}/><Metric title="Desvio" value={brl(summary.totalDeviation)}/><Metric title="Ações abertas" value={String(summary.openActions)}/><Metric title="Ações atrasadas" value={String(summary.overdueActions)}/></div>
  {period.view==='comparativo'&&<section className="panel wide"><div className="panel-title"><h2>Comparativo</h2><span>{monthLabel(period.month)}/{period.year} × {monthLabel(period.month===1?12:period.month-1)}/{period.month===1?period.year-1:period.year}</span></div><div className="rows"><div className="row"><span>Desvio atual</span><b>{brl(summary.totalDeviation)}</b></div><div className="row"><span>Desvio anterior</span><b>{brl(prevSummary.totalDeviation)}</b></div><div className="row"><span>Variação do desvio</span><b>{prevSummary.totalDeviation===0?'—':`${(((summary.totalDeviation-prevSummary.totalDeviation)/Math.abs(prevSummary.totalDeviation))*100).toFixed(1).replace('.',',')}%`}</b></div></div></section>}
  <section className="panel wide"><div className="panel-title"><div><h2>Painel de Performance</h2><span>Desvios acima de 3% entram em acompanhamento; acima de 5%, prioridade crítica.</span></div><a href="/orcamento-analitico" style={{fontWeight:800}}>Ver orçamento analítico →</a></div><div style={{display:'grid',gap:12}}>{rows.map(r=><PerformanceRow key={r.key} row={r}/>)}</div></section>
  <section className="panel wide"><div className="panel-title"><h2>Leitura executiva</h2><span>O que exige decisão</span></div><div className="grid">{rows.map(r=><div className="note" key={r.key}><strong>{r.label} • {toneLabel(r.tone)}</strong><p>Orçado: {brl(r.budget)} • Realizado: {brl(r.actual)}</p><p>Desvio: <b>{brl(r.deviation)} ({pct(r.deviationPct)})</b> • Forecast: {brl(r.forecast)}</p><small><b>Responsável:</b> {r.owner}</small><p style={{marginBottom:0}}>{r.action}</p></div>)}</div></section>
  <section className="panel wide"><div className="panel-title"><h2>Regra de gestão</h2><span>Governança</span></div><div className="note">A comparação transforma o número em decisão: identificar o desvio, validar a causa, definir responsável, estabelecer prazo e acompanhar o impacto financeiro. Quando não houver orçamento cadastrado, a linha permanece neutra para evitar criar uma meta fictícia.</div></section>
 </main>
}
function toneLabel(t:string){return t==='critical'?'CRÍTICO':t==='attention'?'ATENÇÃO':t==='positive'?'FAVORÁVEL':'DENTRO DO LIMITE'}
function Metric({title,value}:{title:string;value:string}){return <div className="card"><span>{title}</span><strong>{value}</strong><small>Período selecionado</small></div>}
function PerformanceRow({row}:{row:any}){return <article className="panel" style={{margin:0}}><div className="panel-title"><div><span style={{fontSize:11,fontWeight:800}}>{toneLabel(row.tone)}</span><h2 style={{marginTop:4}}>{row.label}</h2></div><strong>{pct(row.deviationPct)}</strong></div><div className="grid"><div className="note"><small>Orçamento</small><p><b>{brl(row.budget)}</b></p></div><div className="note"><small>Realizado</small><p><b>{brl(row.actual)}</b></p></div><div className="note"><small>Forecast</small><p><b>{brl(row.forecast)}</b></p></div><div className="note"><small>Desvio</small><p><b>{brl(row.deviation)}</b></p><small>{row.deviation>0?'Acima do orçamento':'Abaixo do orçamento'}</small></div><div className="note"><small>Responsável</small><p><b>{row.owner}</b></p><small>{row.action}</small></div></div></article>}

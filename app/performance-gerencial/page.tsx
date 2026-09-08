'use client'

import { useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import { readActionPlan } from '@/lib/action-plan-store'
import { readBudgetPlan } from '@/lib/budget-store'
import { buildPerformanceRows, buildPerformanceSummary } from '@/lib/performance-gerencial'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`

export default function PerformanceGerencial(){
 const source=useMemo(()=>readFinancialSource(),[])
 const actions=useMemo(()=>readActionPlan(),[])
 const budget=useMemo(()=>readBudgetPlan(),[])
 const [month,setMonth]=useState('2026-09')
 const actual=useMemo(()=>sum(source.entries.filter(e=>e.competence===month)),[source,month])
 const monthlyBudget=useMemo(()=>sumBudget(budget,month),[budget,month])
 const forecast={revenue:actual.revenue,opex:actual.opex,capex:actual.capex,financing:actual.financing}
 const rows=useMemo(()=>buildPerformanceRows(monthlyBudget,actual,forecast,actions),[monthlyBudget,actual,forecast,actions])
 const summary=buildPerformanceSummary(rows,actions)
 const months=Array.from(new Set([...source.entries.map(e=>e.competence),...source.entries.map(e=>e.competence)])).sort()
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Performance Gerencial</h1><p>Orçamento → Realizado → Forecast → Desvio → Ação → Impacto</p></div><select value={month} onChange={e=>setMonth(e.target.value)}>{months.map(m=><option key={m}>{m}</option>)}</select></header>
  <div className="cards"><Metric title="Orçamento" value={brl(summary.totalBudget)}/><Metric title="Realizado" value={brl(summary.totalActual)}/><Metric title="Forecast" value={brl(summary.totalForecast)}/><Metric title="Desvio" value={brl(summary.totalDeviation)}/><Metric title="Ações abertas" value={String(summary.openActions)}/><Metric title="Ações atrasadas" value={String(summary.overdueActions)}/></div>
  <section className="panel wide"><div className="panel-title"><div><h2>Painel de Performance</h2><span>Desvios acima de 3% entram em acompanhamento; acima de 5%, prioridade crítica.</span></div><a href="/orcamento-analitico" style={{fontWeight:800}}>Ver orçamento analítico →</a></div>
   <div style={{display:'grid',gap:12}}>{rows.map(r=><PerformanceRow key={r.key} row={r}/>)}</div>
  </section>
  <section className="panel wide"><div className="panel-title"><h2>Leitura executiva</h2><span>O que exige decisão</span></div><div className="grid">{rows.map(r=><div className="note" key={r.key}><strong>{r.label} • {toneLabel(r.tone)}</strong><p>Orçado: {brl(r.budget)} • Realizado: {brl(r.actual)}</p><p>Desvio: <b>{brl(r.deviation)} ({pct(r.deviationPct)})</b> • Forecast: {brl(r.forecast)}</p><small><b>Responsável:</b> {r.owner}</small><p style={{marginBottom:0}}>{r.action}</p></div>)}</div></section>
  <section className="panel wide"><div className="panel-title"><h2>Regra de gestão</h2><span>Governança</span></div><div className="note">A comparação transforma o número em decisão: identificar o desvio, validar a causa, definir responsável, estabelecer prazo e acompanhar o impacto financeiro. Quando não houver orçamento cadastrado, a linha permanece neutra para evitar criar uma meta fictícia.</div></section>
 </main>
}
function sum(entries:any[]){return entries.reduce((a,e)=>{const v=Math.abs(e.value);if(e.type==='Receita')a.revenue+=v;if(e.type==='Despesa')a.opex+=v;if(e.type==='CAPEX')a.capex+=v;if(e.type==='Financiamento')a.financing+=v;return a},{revenue:0,opex:0,capex:0,financing:0})}
function sumBudget(items:any[],month:string){return items.filter(x=>x.month===month).reduce((a,x)=>{if(x.type==='Receita')a.revenue+=Math.abs(Number(x.budget)||0);if(x.type==='Despesa')a.opex+=Math.abs(Number(x.budget)||0);if(x.type==='CAPEX')a.capex+=Math.abs(Number(x.budget)||0);if(x.type==='Financiamento')a.financing+=Math.abs(Number(x.budget)||0);return a},{revenue:0,opex:0,capex:0,financing:0})}
function toneLabel(t:string){return t==='critical'?'CRÍTICO':t==='attention'?'ATENÇÃO':t==='positive'?'FAVORÁVEL':'DENTRO DO LIMITE'}
function Metric({title,value}:{title:string;value:string}){return <div className="card"><span>{title}</span><strong>{value}</strong><small>Performance</small></div>}
function PerformanceRow({row}:{row:any}){return <article className="panel" style={{margin:0}}><div className="panel-title"><div><span style={{fontSize:11,fontWeight:800}}>{toneLabel(row.tone)}</span><h2 style={{marginTop:4}}>{row.label}</h2></div><strong>{pct(row.deviationPct)}</strong></div><div className="grid"><div className="note"><small>Orçamento</small><p><b>{brl(row.budget)}</b></p></div><div className="note"><small>Realizado</small><p><b>{brl(row.actual)}</b></p></div><div className="note"><small>Forecast</small><p><b>{brl(row.forecast)}</b></p></div><div className="note"><small>Desvio</small><p><b>{brl(row.deviation)}</b></p><small>{row.deviation>0?'Acima do orçamento':'Abaixo do orçamento'}</small></div><div className="note"><small>Responsável</small><p><b>{row.owner}</b></p><small>{row.action}</small></div></div></article>}

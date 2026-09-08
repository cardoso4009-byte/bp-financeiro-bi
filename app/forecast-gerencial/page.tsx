'use client'
import {useMemo,useState} from 'react'
import {readFinancialSource} from '@/lib/financial-source'
import {readActionPlan} from '@/lib/action-plan-store'
import {readBudgetPlan} from '@/lib/budget-store'
import {buildAnnualForecast} from '@/lib/forecast-gerencial'
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
export default function ForecastGerencial(){
 const source=useMemo(()=>readFinancialSource(),[]),actions=useMemo(()=>readActionPlan(),[]),budget=useMemo(()=>readBudgetPlan(),[])
 const [asOf,setAsOf]=useState('2026-09-08'), year=Number(asOf.slice(0,4))||2026
 const f=useMemo(()=>buildAnnualForecast(source.entries,budget,year,asOf,actions),[source,budget,year,asOf,actions])
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}><header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Forecast Gerencial</h1><p>Realizado acumulado + projeção dos meses futuros = visão antecipada do resultado</p></div><label><small>Data-base</small><input type="date" value={asOf} onChange={e=>setAsOf(e.target.value)}/></label></header>
 <div className="cards"><Metric title="Orçamento anual" value={brl(net(f.annualBudget))}/><Metric title="Realizado até a data-base" value={brl(net(f.actualToDate))}/><Metric title="Forecast anual" value={brl(net(f.forecastAnnual))}/><Metric title="Gap projetado" value={brl(net(f.gap))}/><Metric title="Confiança" value={f.confidence}/><Metric title="Ações atrasadas" value={String(f.overdueActions)}/></div>
 <section className="panel wide"><div className="panel-title"><div><h2>Orçado × Forecast</h2><span>Receita, OPEX, CAPEX e financiamento</span></div><a href="/performance-gerencial" style={{fontWeight:800}}>Ver performance →</a></div><div className="grid">{['revenue','opex','capex','financing'].map(k=><Compare key={k} label={label(k)} budget={f.annualBudget[k as keyof typeof f.annualBudget]} forecast={f.forecastAnnual[k as keyof typeof f.forecastAnnual]} />)}</div></section>
 <section className="panel wide"><div className="panel-title"><h2>Evolução mensal</h2><span>Realizado até a data-base • Forecast a partir do mês seguinte</span></div><div className="rows">{f.rows.map(r=><div className="row" key={r.competence} style={{display:'grid',gridTemplateColumns:'120px 110px 1fr 1fr 1fr',gap:12,padding:'10px 0',alignItems:'center'}}><b>{r.competence}</b><span>{r.source}</span><span>Receita {brl(r.revenue)}</span><span>OPEX {brl(r.opex)}</span><strong>Resultado {brl(r.net)}</strong></div>)}</div></section>
 <section className="panel wide"><div className="panel-title"><h2>Leitura executiva</h2><span>Antecipação de risco</span></div><div className="grid"><div className="note"><strong>O que já aconteceu</strong><p>O realizado até a data-base usa a Base Financeira da competência. Não há projeção sobre meses já realizados.</p></div><div className="note"><strong>O que deve acontecer</strong><p>Meses futuros usam o orçamento quando disponível. Sem orçamento, o sistema utiliza a média dos meses realizados disponíveis.</p></div><div className="note"><strong>Confiabilidade</strong><p>Confiança {f.confidence.toLowerCase()}: quanto maior o histórico realizado, mais robusta a tendência estatística simples.</p></div><div className="note"><strong>Governança</strong><p>{f.openActions} ações abertas e {f.overdueActions} atrasadas precisam ser consideradas na reunião de resultado.</p><a href="/governanca" style={{fontWeight:800}}>Abrir governança →</a></div></div></section>
 </main>
}
function net(x:{revenue:number;opex:number;capex:number;financing:number}){return x.revenue-x.opex-x.capex+x.financing}
function label(k:string){return k==='revenue'?'Receita':k==='opex'?'OPEX':k==='capex'?'CAPEX':'Financiamento'}
function Metric({title,value}:{title:string;value:string}){return <div className="card"><span>{title}</span><strong>{value}</strong><small>Forecast</small></div>}
function Compare({label,budget,forecast}:{label:string;budget:number;forecast:number}){const gap=forecast-budget;return <div className="note"><small>{label}</small><h2>{brl(forecast)}</h2><p>Orçamento: {brl(budget)}</p><p>Gap: <b>{brl(gap)}</b></p></div>}

'use client'
import {useMemo,useState} from 'react'
import {readFinancialSource} from '@/lib/financial-source'
import {readActionPlan} from '@/lib/action-plan-store'
import {readBudgetPlan} from '@/lib/budget-store'
import {buildAnnualForecast} from '@/lib/forecast-gerencial'
import {ReportPeriodFilter} from '@/components/report-period-filter'
import {DEFAULT_REPORT_PERIOD,competence,monthLabel,type ReportPeriod} from '@/lib/report-period'
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const empty={revenue:0,opex:0,capex:0,financing:0}
const net=(x:{revenue:number;opex:number;capex:number;financing:number})=>x.revenue-x.opex-x.capex+x.financing
function aggregate(rows:{revenue:number;opex:number;capex:number;financing:number}[]){return rows.reduce((a,r)=>({revenue:a.revenue+r.revenue,opex:a.opex+r.opex,capex:a.capex+r.capex,financing:a.financing+r.financing}),{...empty})}
export default function ForecastGerencial(){
 const source=useMemo(()=>readFinancialSource(),[]),actions=useMemo(()=>readActionPlan(),[]),budget=useMemo(()=>readBudgetPlan(),[])
 const [period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,month:12}), [asOf,setAsOf]=useState('2026-09-08')
 const f=useMemo(()=>buildAnnualForecast(source.entries,budget,period.year,asOf,actions),[source,budget,period.year,asOf,actions])
 const currentMonths=period.view==='mensal'||period.view==='comparativo'?[competence(period.year,period.month)]:f.rows.filter(r=>Number(r.competence.slice(5,7))<=period.month).map(r=>r.competence)
 const previousMonth=period.month===1?12:period.month-1,previousYear=period.month===1?period.year-1:period.year
 const previousRows=f.rows.filter(r=>r.competence===competence(previousYear,previousMonth))
 const currentRows=f.rows.filter(r=>currentMonths.includes(r.competence))
 const current=aggregate(currentRows),previous=aggregate(previousRows)
 const variation=net(previous)!==0?(net(current)-net(previous))/Math.abs(net(previous)):null
 const rows=period.view==='comparativo'?[...currentRows,...previousRows.filter(r=>!currentMonths.includes(r.competence))]:currentRows
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}><header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Forecast Gerencial</h1><p>Realizado + projeção futura = visão antecipada do resultado</p></div></header>
 <section className="panel wide"><ReportPeriodFilter value={period} onChange={setPeriod} years={[2025,2026]}/><div className="filters" style={{marginTop:12}}><label>Data-base <input type="date" value={asOf} onChange={e=>setAsOf(e.target.value)}/></label><span className="note">A data-base separa realizado e forecast. O período selecionado define a visão do relatório.</span></div></section>
 <div className="cards"><Metric title="Orçamento anual" value={brl(net(f.annualBudget))}/><Metric title="Período selecionado" value={brl(net(current))}/><Metric title="Forecast anual" value={brl(net(f.forecastAnnual))}/><Metric title="Gap projetado" value={brl(net(f.gap))}/><Metric title="Confiança" value={f.confidence}/><Metric title="Ações atrasadas" value={String(f.overdueActions)}/></div>
 {period.view==='comparativo'&&<section className="panel wide"><div className="panel-title"><div><h2>Comparativo</h2><span>{monthLabel(period.month)}/{period.year} × {monthLabel(previousMonth)}/{previousYear}</span></div></div><div className="rows"><div className="row"><span>Resultado atual</span><b>{brl(net(current))}</b></div><div className="row"><span>Resultado anterior</span><b>{brl(net(previous))}</b></div><div className="row"><span>Variação</span><b>{variation===null?'—':`${(variation*100).toFixed(1).replace('.',',')}%`}</b></div></div></section>}
 <section className="panel wide"><div className="panel-title"><div><h2>Orçado × Forecast</h2><span>Receita, OPEX, CAPEX e financiamento</span></div><a href="/performance-gerencial" style={{fontWeight:800}}>Ver performance →</a></div><div className="grid">{['revenue','opex','capex','financing'].map(k=><Compare key={k} label={label(k)} budget={f.annualBudget[k as keyof typeof f.annualBudget]} forecast={f.forecastAnnual[k as keyof typeof f.forecastAnnual]}/>)}</div></section>
 <section className="panel wide"><div className="panel-title"><h2>Evolução do período</h2><span>{period.view==='acumulado'?`Acumulado até ${monthLabel(period.month)}/${period.year}`:`Visão ${monthLabel(period.month)}/${period.year}`}</span></div><div className="rows">{rows.map(r=><div className="row" key={r.competence} style={{display:'grid',gridTemplateColumns:'120px 110px 1fr 1fr 1fr',gap:12,padding:'10px 0',alignItems:'center'}}><b>{r.competence}</b><span>{r.source}</span><span>Receita {brl(r.revenue)}</span><span>OPEX {brl(r.opex)}</span><strong>Resultado {brl(r.net)}</strong></div>)}</div></section>
 <section className="panel wide"><div className="panel-title"><h2>Leitura executiva</h2><span>Antecipação de risco</span></div><div className="grid"><div className="note"><strong>Realizado</strong><p>O realizado é calculado a partir da Base Financeira por competência até a data-base informada.</p></div><div className="note"><strong>Forecast</strong><p>Meses futuros usam o orçamento quando disponível; sem orçamento, utilizam a média histórica dos meses realizados.</p></div><div className="note"><strong>Confiabilidade</strong><p>Confiança {f.confidence.toLowerCase()}: depende da quantidade de histórico realizado disponível.</p></div><div className="note"><strong>Governança</strong><p>{f.openActions} ações abertas e {f.overdueActions} atrasadas precisam entrar na reunião de resultado.</p><a href="/governanca" style={{fontWeight:800}}>Abrir governança →</a></div></div></section>
 </main>
}
function Metric({title,value}:{title:string;value:string}){return <div className="card"><span>{title}</span><strong>{value}</strong><small>Período selecionado</small></div>}
function label(k:string){return k==='revenue'?'Receita':k==='opex'?'OPEX':k==='capex'?'CAPEX':'Financiamento'}
function Compare({label,budget,forecast}:{label:string;budget:number;forecast:number}){const gap=forecast-budget;return <div className="note"><small>{label}</small><h2>{brl(forecast)}</h2><p>Orçamento: {brl(budget)}</p><p>Gap: <b>{brl(gap)}</b></p></div>}

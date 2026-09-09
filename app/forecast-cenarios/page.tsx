'use client'
import {useMemo,useState} from 'react'
import {readFinancialSource} from '@/lib/financial-source'
import {readActionPlan} from '@/lib/action-plan-store'
import {readBudgetPlan} from '@/lib/budget-store'
import {buildAnnualForecast} from '@/lib/forecast-gerencial'
import {applyForecastScenario,scenarioRows,type ForecastScenarioKey} from '@/lib/forecast-scenarios'
import {ReportPeriodFilter} from '@/components/report-period-filter'
import {DEFAULT_REPORT_PERIOD,competence,monthLabel,type ReportPeriod} from '@/lib/report-period'
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const net=(r:{revenue:number;opex:number;capex:number;financing:number})=>r.revenue-r.opex-r.capex+r.financing
function aggregate(rows:{revenue:number;opex:number;capex:number;financing:number}[]){return rows.reduce((a,r)=>({revenue:a.revenue+r.revenue,opex:a.opex+r.opex,capex:a.capex+r.capex,financing:a.financing+r.financing}),{revenue:0,opex:0,capex:0,financing:0})}
export default function ForecastCenarios(){
 const source=useMemo(()=>readFinancialSource(),[]),budget=useMemo(()=>readBudgetPlan(),[]),actions=useMemo(()=>readActionPlan(),[])
 const [period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,month:12}),[asOf,setAsOf]=useState('2026-09-08'),[selected,setSelected]=useState<ForecastScenarioKey>('base')
 const base=useMemo(()=>buildAnnualForecast(source.entries,budget,period.year,asOf,actions),[source,budget,period.year,asOf,actions])
 const scenarios=(['base','otimista','pessimista'] as ForecastScenarioKey[]).map(k=>applyForecastScenario(base,k));const active=scenarios.find(x=>x.key===selected)!
 const months=period.view==='mensal'||period.view==='comparativo'?[competence(period.year,period.month)]:base.rows.filter(r=>Number(r.competence.slice(5,7))<=period.month).map(r=>r.competence)
 const previousMonth=period.month===1?12:period.month-1,previousYear=period.month===1?period.year-1:period.year
 const currentRows=scenarioRows(base.rows,selected).filter(r=>months.includes(r.competence));const previousRows=scenarioRows(base.rows,selected).filter(r=>r.competence===competence(previousYear,previousMonth))
 const current=aggregate(currentRows),previous=aggregate(previousRows),variation=net(previous)!==0?(net(current)-net(previous))/Math.abs(net(previous)):null
 const rows=period.view==='comparativo'?[...currentRows,...previousRows.filter(r=>!months.includes(r.competence))]:currentRows
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}><header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Forecast por Cenários</h1><p>Base • Otimista • Pessimista — impacto financeiro antes da decisão</p></div><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/></header>
 <section className="panel wide"><div className="filters" style={{marginTop:0}}><label>Data-base <input type="date" value={asOf} onChange={e=>setAsOf(e.target.value)}/></label><span className="note">O período define a competência analisada; a data-base separa realizado e forecast.</span></div></section>
 <div className="cards">{scenarios.map(s=><button key={s.key} onClick={()=>setSelected(s.key)} className="card" style={{textAlign:'left',border:selected===s.key?'2px solid currentColor':undefined}}><span>{s.label}</span><strong>{brl(s.finalResult)}</strong><small>Gap vs orçamento: {brl(s.gap)} • Risco {s.risk}</small></button>)}</div>
 {period.view==='comparativo'&&<section className="panel wide"><div className="panel-title"><h2>Comparativo — {active.label}</h2><span>{monthLabel(period.month)}/{period.year} × {monthLabel(previousMonth)}/{previousYear}</span></div><div className="rows"><div className="row"><span>Resultado atual</span><b>{brl(net(current))}</b></div><div className="row"><span>Resultado anterior</span><b>{brl(net(previous))}</b></div><div className="row"><span>Variação</span><b>{variation===null?'—':`${(variation*100).toFixed(1).replace('.',',')}%`}</b></div></div></section>}
 <section className="panel wide"><div className="panel-title"><div><h2>Cenário {active.label}</h2><span>Fatores aplicados sobre o forecast dinâmico</span></div><strong>{active.risk}</strong></div><div className="grid">{[['Receita',active.revenueFactor],['OPEX',active.opexFactor],['CAPEX',active.capexFactor],['Financiamento',active.financingFactor]].map(([label,factor])=><div className="note" key={label as string}><small>{label as string}</small><h2>{(((factor as number)-1)*100).toFixed(0)}%</h2><p>Variação sobre forecast</p></div>)}</div></section>
 <section className="panel wide"><div className="panel-title"><h2>Resultado do período por cenário</h2><span>{period.view==='acumulado'?`Acumulado até ${monthLabel(period.month)}/${period.year}`:`Visão ${monthLabel(period.month)}/${period.year}`}</span></div><div className="rows">{rows.map(r=><div className="row" key={`${selected}-${r.competence}`} style={{display:'grid',gridTemplateColumns:'110px 110px 1fr 1fr',gap:12,padding:'10px 0'}}><b>{r.competence}</b><span>{r.source}</span><span>Receita {brl(r.revenue)}</span><strong>Resultado {brl(r.net)}</strong></div>)}</div></section>
 <section className="panel wide"><div className="panel-title"><h2>Decisão gerencial</h2><span>Uso recomendado</span></div><div className="note">Use o cenário <b>Base</b> como referência, o <b>Otimista</b> para testar oportunidades e o <b>Pessimista</b> para dimensionar proteção de caixa, redução de custos e contingência. O cenário explicita premissas; não substitui a decisão do gestor.</div></section></main>
}

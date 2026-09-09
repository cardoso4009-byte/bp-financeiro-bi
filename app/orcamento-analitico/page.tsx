'use client'

import { useEffect, useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import type { FinancialEntry } from '@/lib/lancamentos-data'
import { initialBudgetAnalytic, readBudgetAnalytic, writeBudgetAnalytic, type BudgetAnalyticLine } from '@/lib/budget-analytic-store'
import ReportPeriodFilter from '@/components/report-period-filter'
import { DEFAULT_REPORT_PERIOD, monthLabel, type ReportPeriod } from '@/lib/report-period'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`
const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function actualFor(entries:FinancialEntry[], line:BudgetAnalyticLine){
  return entries.filter(e=>e.competence===line.competence && e.type===line.type && e.category===line.account && e.costCenter===line.costCenter).reduce((s,e)=>s+Math.abs(e.value),0)
}

export default function OrcamentoAnalitico(){
  const [lines,setLines]=useState<BudgetAnalyticLine[]>(initialBudgetAnalytic)
  const [entries,setEntries]=useState<FinancialEntry[]>([])
  const [editing,setEditing]=useState(false)
  const [period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,month:12})
  const [center,setCenter]=useState('Todos')
  const [type,setType]=useState<'Todos'|'Receita'|'Despesa'|'CAPEX'>('Todos')

  useEffect(()=>{setLines(readBudgetAnalytic());setEntries(readFinancialSource().entries)},[])
  useEffect(()=>{if(typeof window!=='undefined')writeBudgetAnalytic(lines)},[lines])

  const periodCompetences=useMemo(()=>{
    if(period.view==='mensal'||period.view==='comparativo') return new Set([`${period.year}-${String(period.month).padStart(2,'0')}`])
    return new Set(Array.from({length:period.month},(_,i)=>`${period.year}-${String(i+1).padStart(2,'0')}`))
  },[period])
  const previousCompetences=useMemo(()=>{
    const month=period.month===1?12:period.month-1
    const year=period.month===1?period.year-1:period.year
    return new Set([`${year}-${String(month).padStart(2,'0')}`])
  },[period])

  const enriched=useMemo(()=>lines.map(l=>{const actual=actualFor(entries,l);const deviation=actual-l.budget;return {...l,actual,deviation,rate:l.budget?deviation/Math.abs(l.budget):actual?1:0}}),[lines,entries])
  const filtered=enriched.filter(l=>periodCompetences.has(l.competence)&&(center==='Todos'||l.costCenter===center)&&(type==='Todos'||l.type===type))
  const previous=period.view==='comparativo'?enriched.filter(l=>previousCompetences.has(l.competence)&&(center==='Todos'||l.costCenter===center)&&(type==='Todos'||l.type===type)):[]
  const totalBudget=filtered.reduce((s,l)=>s+l.budget,0), totalActual=filtered.reduce((s,l)=>s+l.actual,0), totalDeviation=totalActual-totalBudget
  const prevBudget=previous.reduce((s,l)=>s+l.budget,0), prevActual=previous.reduce((s,l)=>s+l.actual,0)
  const centers=[...new Set(lines.map(l=>l.costCenter))]
  const accounts=[...new Set(lines.map(l=>l.account))]
  const centerSummary=useMemo(()=>centers.map(c=>{const rows=filtered.filter(l=>l.costCenter===c);const b=rows.reduce((s,l)=>s+l.budget,0);const a=rows.reduce((s,l)=>s+l.actual,0);return {c,b,a,d:a-b,r:b?(a-b)/Math.abs(b):0}}).filter(r=>r.b||r.a),[filtered,centers])
  const accountSummary=useMemo(()=>accounts.map(a=>{const rows=filtered.filter(l=>l.account===a);const b=rows.reduce((s,l)=>s+l.budget,0);const act=rows.reduce((s,l)=>s+l.actual,0);return {a,b,act,d:act-b,r:b?(act-b)/Math.abs(b):0}}).filter(r=>r.b||r.act).sort((x,y)=>Math.abs(y.d)-Math.abs(x.d)),[filtered,accounts])
  const update=(id:string, value:string)=>setLines(prev=>prev.map(l=>l.id===id?{...l,budget:Math.max(0,Number(value.replace(',','.'))||0)}:l))
  const viewLabel=period.view==='mensal'?'Mensal':period.view==='acumulado'?'Acumulado':'Comparativo'
  const previousLabel=period.month===1?`Dez/${period.year-1}`:`${monthLabel(period.month-1)}/${period.year}`
  const comparisonBudgetDelta=prevBudget?totalBudget-prevBudget:0
  const comparisonActualDelta=prevActual?totalActual-prevActual:0

  return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
    <header><div><small>PLANEJAMENTO E CONTROLADORIA</small><h1>Orçamento por Conta & Centro de Custo</h1><p>Planejamento detalhado • execução • desvios por responsável</p></div><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/></header>
    <div className="report-period-context"><strong>Visão {viewLabel}</strong><span>{monthLabel(period.month)}/{period.year}{period.view==='acumulado'?' • janeiro até o mês selecionado':''}{period.view==='comparativo'?` • comparado com ${previousLabel}`:''}</span></div>

    <div className="cards"><Card title="Orçamento" value={totalBudget}/><Card title="Realizado" value={totalActual}/><Card title="Desvio" value={totalDeviation}/><Card title="Desvio %" value={totalBudget?totalDeviation/Math.abs(totalBudget):0} percent/></div>

    {period.view==='comparativo'&&<section className="panel wide"><div className="panel-title"><h2>Comparativo do período</h2><span>{monthLabel(period.month)}/{period.year} × {previousLabel}</span></div><div className="cards"><Card title="Orçamento atual" value={totalBudget} sub={prevBudget?`Anterior ${brl(prevBudget)} • ${brl(comparisonBudgetDelta)}`:'Sem base anterior'}/><Card title="Realizado atual" value={totalActual} sub={prevActual?`Anterior ${brl(prevActual)} • ${brl(comparisonActualDelta)}`:'Sem base anterior'}/><Card title="Desvio atual" value={totalDeviation} sub="Realizado − orçamento"/></div></section>}

    <section className="panel wide"><div className="panel-title"><h2>Visão por centro de custo</h2><span>Realizado − orçamento</span></div><div className="table-wrap"><table><thead><tr><th>Centro de custo</th><th>Orçamento</th><th>Realizado</th><th>Desvio</th><th>Desvio %</th></tr></thead><tbody>{centerSummary.map(r=><tr key={r.c}><td><b>{r.c}</b></td><td>{brl(r.b)}</td><td>{brl(r.a)}</td><td>{brl(r.d)}</td><td>{pct(r.r)}</td></tr>)}</tbody></table></div></section>

    <section className="panel wide"><div className="panel-title"><h2>Visão por conta</h2><span>Maiores impactos primeiro</span></div><div className="table-wrap"><table><thead><tr><th>Conta</th><th>Tipo</th><th>Centro</th><th>Orçamento</th><th>Realizado</th><th>Desvio</th><th>%</th></tr></thead><tbody>{accountSummary.map(r=>{const first=filtered.find(l=>l.account===r.a);return <tr key={r.a}><td><b>{r.a}</b></td><td>{first?.type}</td><td>{first?.costCenter}</td><td>{brl(r.b)}</td><td>{brl(r.act)}</td><td>{brl(r.d)}</td><td>{pct(r.r)}</td></tr>})}</tbody></table></div></section>

    <section className="panel wide"><div className="panel-title"><h2>Matriz de orçamento</h2><span>{editing?'Edição habilitada':'Somente consulta'} <button className="primary-btn" onClick={()=>setEditing(v=>!v)}>{editing?'Concluir edição':'Editar orçamento'}</button></span></div><div className="table-wrap"><table><thead><tr><th>Mês</th><th>Tipo</th><th>Conta</th><th>Centro de custo</th><th>Projeto</th><th>Orçamento</th><th>Realizado</th><th>Desvio</th></tr></thead><tbody>{filtered.map(l=><tr key={l.id}><td>{l.competence}</td><td>{l.type}</td><td><b>{l.account}</b></td><td>{l.costCenter}</td><td>{l.project||'—'}</td><td>{editing?<input inputMode="decimal" value={l.budget} onChange={e=>update(l.id,e.target.value)} style={{width:110}}/>:brl(l.budget)}</td><td>{brl(l.actual)}</td><td>{brl(l.deviation)} <small>({pct(l.rate)})</small></td></tr>)}</tbody></table></div><div className="note"><strong>Governança:</strong> o realizado é conciliado por competência, tipo, conta e centro de custo. A visão mensal, acumulada e comparativa usa a mesma base analítica. O orçamento permanece separado e editável.</div></section>

    <section className="panel wide"><div className="panel-title"><h2>Leitura gerencial</h2><span>Controladoria</span></div><div className="note"><strong>{totalDeviation<=0?'Execução dentro ou abaixo do orçamento':'Execução acima do orçamento'}</strong><p>{totalBudget?`O período filtrado apresenta ${brl(totalDeviation)} de desvio, equivalente a ${pct(totalDeviation/Math.abs(totalBudget))} do orçamento.`:'Não há orçamento informado para os filtros selecionados.'}</p><p>{period.view==='acumulado'?'A visão acumulada consolida janeiro até o mês selecionado. ':''}O próximo objetivo é ligar esta matriz ao fluxo de caixa projetado, responsáveis, aprovação e trilha de alterações.</p></div></section>
  </main>
}
function Card({title,value,percent=false,sub}:{title:string;value:number;percent?:boolean;sub?:string}){return <div className="card"><span>{title}</span><strong>{percent?pct(value):brl(value)}</strong><small>{sub|| (percent?'Realizado − orçamento':'Período selecionado')}</small></div>}

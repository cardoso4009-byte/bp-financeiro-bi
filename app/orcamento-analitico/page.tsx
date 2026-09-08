'use client'

import { useEffect, useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import type { FinancialEntry } from '@/lib/lancamentos-data'
import { initialBudgetAnalytic, readBudgetAnalytic, writeBudgetAnalytic, type BudgetAnalyticLine } from '@/lib/budget-analytic-store'

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
  const [month,setMonth]=useState('Todos')
  const [center,setCenter]=useState('Todos')
  const [type,setType]=useState<'Todos'|'Receita'|'Despesa'|'CAPEX'>('Todos')

  useEffect(()=>{setLines(readBudgetAnalytic());setEntries(readFinancialSource().entries)},[])
  useEffect(()=>{if(typeof window!=='undefined')writeBudgetAnalytic(lines)},[lines])

  const enriched=useMemo(()=>lines.map(l=>{const actual=actualFor(entries,l);const deviation=actual-l.budget;return {...l,actual,deviation,rate:l.budget?deviation/Math.abs(l.budget):actual?1:0}}),[lines,entries])
  const filtered=enriched.filter(l=>(month==='Todos'||l.competence===`2026-${String(months.indexOf(month)+1).padStart(2,'0')}`)&&(center==='Todos'||l.costCenter===center)&&(type==='Todos'||l.type===type))
  const totalBudget=filtered.reduce((s,l)=>s+l.budget,0), totalActual=filtered.reduce((s,l)=>s+l.actual,0), totalDeviation=totalActual-totalBudget
  const centers=[...new Set(lines.map(l=>l.costCenter))]
  const accounts=[...new Set(lines.map(l=>l.account))]
  const centerSummary=useMemo(()=>centers.map(c=>{const rows=filtered.filter(l=>l.costCenter===c);const b=rows.reduce((s,l)=>s+l.budget,0);const a=rows.reduce((s,l)=>s+l.actual,0);return {c,b,a,d:a-b,r:b?(a-b)/Math.abs(b):0}}).filter(r=>r.b||r.a),[filtered,centers])
  const accountSummary=useMemo(()=>accounts.map(a=>{const rows=filtered.filter(l=>l.account===a);const b=rows.reduce((s,l)=>s+l.budget,0);const act=rows.reduce((s,l)=>s+l.actual,0);return {a,b,act,d:act-b,r:b?(act-b)/Math.abs(b):0}}).filter(r=>r.b||r.act).sort((x,y)=>Math.abs(y.d)-Math.abs(x.d)),[filtered,accounts])
  const update=(id:string, value:string)=>setLines(prev=>prev.map(l=>l.id===id?{...l,budget:Math.max(0,Number(value.replace(',','.'))||0)}:l))

  return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
    <header><div><small>PLANEJAMENTO E CONTROLADORIA</small><h1>Orçamento por Conta & Centro de Custo</h1><p>Planejamento detalhado • execução • desvios por responsável</p></div><div className="period-controls"><label>Filtros analíticos</label><div><select value={month} onChange={e=>setMonth(e.target.value)}><option>Todos</option>{months.map(m=><option key={m}>{m}</option>)}</select><select value={center} onChange={e=>setCenter(e.target.value)}><option>Todos</option>{centers.map(c=><option key={c}>{c}</option>)}</select><select value={type} onChange={e=>setType(e.target.value as typeof type)}><option>Todos</option><option>Receita</option><option>Despesa</option><option>CAPEX</option></select></div></div></header>

    <div className="cards"><Card title="Orçamento" value={totalBudget}/><Card title="Realizado" value={totalActual}/><Card title="Desvio" value={totalDeviation}/><Card title="Desvio %" value={totalBudget?totalDeviation/Math.abs(totalBudget):0} percent/></div>

    <section className="panel wide"><div className="panel-title"><h2>Visão por centro de custo</h2><span>Realizado − orçamento</span></div><div className="table-wrap"><table><thead><tr><th>Centro de custo</th><th>Orçamento</th><th>Realizado</th><th>Desvio</th><th>Desvio %</th></tr></thead><tbody>{centerSummary.map(r=><tr key={r.c}><td><b>{r.c}</b></td><td>{brl(r.b)}</td><td>{brl(r.a)}</td><td>{brl(r.d)}</td><td>{pct(r.r)}</td></tr>)}</tbody></table></div></section>

    <section className="panel wide"><div className="panel-title"><h2>Visão por conta</h2><span>Maiores impactos primeiro</span></div><div className="table-wrap"><table><thead><tr><th>Conta</th><th>Tipo</th><th>Centro</th><th>Orçamento</th><th>Realizado</th><th>Desvio</th><th>%</th></tr></thead><tbody>{accountSummary.map(r=>{const first=filtered.find(l=>l.account===r.a);return <tr key={r.a}><td><b>{r.a}</b></td><td>{first?.type}</td><td>{first?.costCenter}</td><td>{brl(r.b)}</td><td>{brl(r.act)}</td><td>{brl(r.d)}</td><td>{pct(r.r)}</td></tr>})}</tbody></table></div></section>

    <section className="panel wide"><div className="panel-title"><h2>Matriz de orçamento</h2><span>{editing?'Edição habilitada':'Somente consulta'} <button className="primary-btn" onClick={()=>setEditing(v=>!v)}>{editing?'Concluir edição':'Editar orçamento'}</button></span></div><div className="table-wrap"><table><thead><tr><th>Mês</th><th>Tipo</th><th>Conta</th><th>Centro de custo</th><th>Projeto</th><th>Orçamento</th><th>Realizado</th><th>Desvio</th></tr></thead><tbody>{filtered.map(l=><tr key={l.id}><td>{months[Number(l.competence.slice(5))-1]}/2026</td><td>{l.type}</td><td><b>{l.account}</b></td><td>{l.costCenter}</td><td>{l.project||'—'}</td><td>{editing?<input inputMode="decimal" value={l.budget} onChange={e=>update(l.id,e.target.value)} style={{width:110}}/>:brl(l.budget)}</td><td>{brl(l.actual)}</td><td>{brl(l.deviation)} <small>({pct(l.rate)})</small></td></tr>)}</tbody></table></div><div className="note"><strong>Governança:</strong> o realizado é conciliado por competência, tipo, conta e centro de custo. O orçamento permanece separado e editável. Na próxima camada, esta matriz será ampliada para todo o ano e permitirá responsáveis, aprovação e trilha de alterações.</div></section>

    <section className="panel wide"><div className="panel-title"><h2>Leitura gerencial</h2><span>Controladoria</span></div><div className="note"><strong>{totalDeviation<=0?'Execução dentro ou abaixo do orçamento':'Execução acima do orçamento'}</strong><p>{totalBudget?`O período filtrado apresenta ${brl(totalDeviation)} de desvio, equivalente a ${pct(totalDeviation/Math.abs(totalBudget))} do orçamento.`:'Não há orçamento informado para os filtros selecionados.'}</p><p>O próximo objetivo é ligar esta matriz ao fluxo de caixa projetado: cada compromisso orçado deverá gerar impacto esperado no caixa e ser comparado com contas a pagar/receber.</p></div></section>
  </main>
}
function Card({title,value,percent=false}:{title:string;value:number;percent?:boolean}){return <div className="card"><span>{title}</span><strong>{percent?pct(value):brl(value)}</strong><small>{percent?'Realizado − orçamento':'Período filtrado'}</small></div>}

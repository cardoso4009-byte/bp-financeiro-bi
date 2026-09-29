'use client'

import { useEffect, useMemo, useState } from 'react'
import { readCapexProjects } from '@/lib/capex-storage'
import { readCapexSchedule, writeCapexSchedule, type CapexScheduleEntry } from '@/lib/capex-schedule'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const months=['2026-09','2026-10','2026-11','2026-12']
const label=(v:string)=>{const [y,m]=v.split('-');return new Date(Number(y),Number(m)-1,1).toLocaleDateString('pt-BR',{month:'short',year:'numeric'}).replace('.','')}
export default function CapexCronograma(){
 const [projects]=useState(()=>readCapexProjects())
 const [entries,setEntries]=useState<CapexScheduleEntry[]>([])
 const [editing,setEditing]=useState(false)
 useEffect(()=>setEntries(readCapexSchedule()),[])
 const save=(next:CapexScheduleEntry[])=>{setEntries(next);writeCapexSchedule(next)}
 const value=(projectId:string,competence:string)=>entries.find(e=>e.projectId===projectId&&e.competence===competence)?.plannedAmount??0
 const setValue=(projectId:string,competence:string,v:string)=>{
  const amount=Number(v)||0
  const existing=entries.find(e=>e.projectId===projectId&&e.competence===competence)
  if(existing) save(entries.map(e=>e.id===existing.id?{...e,plannedAmount:amount}:e))
  else save([...entries,{id:`capex-sch-${Date.now()}-${projectId}-${competence}`,projectId,competence,plannedAmount:amount}])
 }
 const totals=useMemo(()=>months.map(m=>entries.filter(e=>e.competence===m).reduce((s,e)=>s+e.plannedAmount,0)),[entries])
 const total=totals.reduce((a,b)=>a+b,0)
 return <main className="bp-view bp-container">
  <header className="bp-header"><div><small>GESTÃO FINANCEIRA • INVESTIMENTOS</small><h1>Cronograma CAPEX</h1><p>Projeto → competência → desembolso previsto</p></div><button className="secondary-btn" onClick={()=>setEditing(v=>!v)}>{editing?'Concluir edição':'Editar cronograma'}</button></header>
  <section className="cards"><Metric label="Total programado" value={total}/>{months.slice(1).map((m,i)=><Metric key={m} label={label(m)} value={totals[i+1]}/>)}</section>
  <section className="bp-card"><div className="bp-card-title"><div><small>PROGRAMAÇÃO MENSAL</small><h2>Desembolsos previstos</h2><p className="bp-muted">Os valores são informados por competência e não são rateados automaticamente.</p></div><span>{entries.length} lançamento(s)</span></div>
   <div className="table-wrap"><table><thead><tr><th>Projeto</th>{months.map(m=><th key={m}>{label(m)}</th>)}<th>Total</th></tr></thead><tbody>
    {projects.map(p=>{const row=months.map(m=>value(p.id,m));return <tr key={p.id}><td><b>{p.code}</b><br/><span className="bp-muted">{p.name}</span></td>{months.map((m,i)=><td key={m}>{editing?<input className="compact-field" type="number" min="0" value={row[i]} onChange={e=>setValue(p.id,m,e.target.value)}/>:brl(row[i])}</td>)}<td><b>{brl(row.reduce((a,b)=>a+b,0))}</b></td></tr>})}
   </tbody><tfoot><tr><th>Total</th>{totals.map((v,i)=><th key={months[i]}>{brl(v)}</th>)}<th>{brl(total)}</th></tr></tfoot></table></div>
  </section>
  <section className="grid"><section className="bp-card"><div className="bp-card-title"><h2>Governança</h2></div><div className="note">O cronograma representa desembolso previsto. Ele não altera automaticamente CAPEX realizado, orçamento, Forecast oficial ou lançamentos contábeis.</div></section><section className="bp-card"><div className="bp-card-title"><h2>Próxima integração</h2></div><div className="note"><b>Cronograma CAPEX → Fluxo de Caixa → Forecast</b><p>Depois da homologação desta base, os desembolsos poderão alimentar a visão projetada de caixa de forma explícita e rastreável.</p></div></section></section>
 </main>
}
function Metric({label,value}:{label:string;value:number}){return <div className="card"><span>{label}</span><strong>{brl(value)}</strong></div>}

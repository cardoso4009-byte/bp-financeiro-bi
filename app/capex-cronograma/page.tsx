'use client'

import { useEffect, useMemo, useState } from 'react'
import { readCapexProjects } from '@/lib/capex-storage'
import { readCapexSchedule, writeCapexSchedule, type CapexScheduleEntry } from '@/lib/capex-schedule'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const months=['2026-09','2026-10','2026-11','2026-12']
const label=(v:string)=>{const [y,m]=v.split('-');return new Date(Number(y),Number(m)-1,1).toLocaleDateString('pt-BR',{month:'short',year:'numeric'}).replace('.','')}
const competenceFromDate=(date:string)=>date?.slice(0,7)??''
const formatDate=(date?:string)=>date?new Date(date+'T12:00:00').toLocaleDateString('pt-BR'):'—'

export default function CapexCronograma(){
 const [projects]=useState(()=>readCapexProjects())
 const [entries,setEntries]=useState<CapexScheduleEntry[]>([])
 const [editing,setEditing]=useState(false)
 const [projectId,setProjectId]=useState('')
 const [plannedDate,setPlannedDate]=useState('')
 const [plannedAmount,setPlannedAmount]=useState('')
 const [note,setNote]=useState('')

 useEffect(()=>{
  const current=readCapexSchedule()
  setEntries(current.map(e=>e.plannedDate?e:{...e,plannedDate:e.competence+'-01'}))
  if(current.length && !projectId) setProjectId(current[0].projectId)
 },[])

 const save=(next:CapexScheduleEntry[])=>{setEntries(next);writeCapexSchedule(next)}

 const addEntry=()=>{
  const amount=Number(plannedAmount)
  if(!projectId||!plannedDate||!amount||amount<0) return
  const competence=competenceFromDate(plannedDate)
  save([...entries,{id:'capex-sch-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),projectId,competence,plannedAmount:amount,plannedDate,note:note.trim()||undefined}])
  setPlannedAmount('')
  setNote('')
 }

 const updateEntry=(id:string,patch:Partial<CapexScheduleEntry>)=>{
  save(entries.map(e=>{
   if(e.id!==id) return e
   const next={...e,...patch}
   if(next.plannedDate) next.competence=competenceFromDate(next.plannedDate)
   return next
  }))
 }

 const removeEntry=(id:string)=>save(entries.filter(e=>e.id!==id))

 const totals=useMemo(()=>months.map(m=>entries.filter(e=>e.competence===m).reduce((s,e)=>s+e.plannedAmount,0)),[entries])
 const total=totals.reduce((a,b)=>a+b,0)
 const projectName=(id:string)=>{const p=projects.find(x=>x.id===id);return p?p.code+' • '+p.name:id}

 return <main className="bp-view bp-container">
  <header className="bp-header"><div><small>GESTÃO FINANCEIRA • INVESTIMENTOS</small><h1>Cronograma CAPEX</h1><p>Projeto → data prevista → competência → desembolso</p></div><button className="secondary-btn" onClick={()=>setEditing(v=>!v)}>{editing?'Concluir edição':'Editar cronograma'}</button></header>

  <section className="cards"><Metric label="Total programado" value={total}/>{months.slice(1).map((m,i)=><Metric key={m} label={label(m)} value={totals[i+1]}/>)}</section>

  {editing&&<section className="bp-card" style={{marginBottom:16}}>
   <div className="bp-card-title"><div><small>NOVO DESEMBOLSO</small><h2>Programar desembolso</h2><p className="bp-muted">Informe a data prevista. A competência é definida automaticamente pela data.</p></div></div>
   <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr 1fr 1.4fr auto',gap:12,alignItems:'end'}}>
    <label>Projeto<select className="compact-field" value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.code} • {p.name}</option>)}</select></label>
    <label>Data prevista<input className="compact-field" type="date" value={plannedDate} onChange={e=>setPlannedDate(e.target.value)}/></label>
    <label>Valor<input className="compact-field" type="number" min="0" step="0.01" placeholder="0,00" value={plannedAmount} onChange={e=>setPlannedAmount(e.target.value)}/></label>
    <label>Observação<input className="compact-field" type="text" placeholder="Ex.: parcela 1 / fornecedor" value={note} onChange={e=>setNote(e.target.value)}/></label>
    <button className="secondary-btn" onClick={addEntry}>+ Adicionar</button>
   </div>
   {plannedDate&&<div className="note" style={{marginTop:12}}>Competência calculada: <b>{label(competenceFromDate(plannedDate))}</b></div>}
  </section>}

  <section className="bp-card"><div className="bp-card-title"><div><small>PROGRAMAÇÃO MENSAL</small><h2>Desembolsos previstos</h2><p className="bp-muted">Os valores são consolidados por competência e não são rateados automaticamente.</p></div><span>{entries.length} lançamento(s)</span></div>
   <div className="table-wrap"><table><thead><tr><th>Projeto</th>{months.map(m=><th key={m}>{label(m)}</th>)}<th>Total</th></tr></thead><tbody>
    {projects.map(p=>{const row=months.map(m=>entries.filter(e=>e.projectId===p.id&&e.competence===m).reduce((s,e)=>s+e.plannedAmount,0));return <tr key={p.id}><td><b>{p.code}</b><br/><span className="bp-muted">{p.name}</span></td>{row.map((v,i)=><td key={months[i]}>{brl(v)}</td>)}<td><b>{brl(row.reduce((a,b)=>a+b,0))}</b></td></tr>})}
   </tbody><tfoot><tr><th>Total</th>{totals.map((v,i)=><th key={months[i]}>{brl(v)}</th>)}<th>{brl(total)}</th></tr></table></div>
  </section>

  {editing&&<section className="bp-card" style={{marginTop:16}}><div className="bp-card-title"><div><small>LANÇAMENTOS DETALHADOS</small><h2>Datas e desembolsos</h2><p className="bp-muted">Cada desembolso possui data própria e sua competência acompanha a data.</p></div></div>
   <div className="table-wrap"><table><thead><tr><th>Projeto</th><th>Data prevista</th><th>Competência</th><th>Valor</th><th>Observação</th><th></th></tr></thead><tbody>
    {entries.map(e=><tr key={e.id}><td>{projectName(e.projectId)}</td><td><input className="compact-field" type="date" value={e.plannedDate??(e.competence+'-01')} onChange={x=>updateEntry(e.id,{plannedDate:x.target.value})}/></td><td>{label(e.competence)}</td><td><input className="compact-field" type="number" min="0" step="0.01" value={e.plannedAmount} onChange={x=>updateEntry(e.id,{plannedAmount:Number(x.target.value)||0})}/></td><td><input className="compact-field" type="text" value={e.note??''} onChange={x=>updateEntry(e.id,{note:x.target.value||undefined})}/><div className="bp-muted" style={{fontSize:11,marginTop:4}}>Previsto: {formatDate(e.plannedDate)}</div></td><td><button className="secondary-btn" onClick={()=>removeEntry(e.id)}>Excluir</button></td></tr>)}
   </tbody></table></div>
  </section>}

  <section className="grid"><section className="bp-card"><div className="bp-card-title"><h2>Governança</h2></div><div className="note">O cronograma representa desembolso previsto. A data informa quando o caixa deverá ser impactado. Ele não altera automaticamente CAPEX realizado, orçamento, Forecast oficial ou lançamentos contábeis.</div></section><section className="bp-card"><div className="bp-card-title"><h2>Próxima integração</h2></div><div className="note"><b>Cronograma CAPEX → Fluxo de Caixa → Forecast</b><p>Os desembolsos passam a ter data explícita, permitindo alimentar a visão projetada de caixa de forma rastreável.</p></div></section></section>
 </main>
}

function Metric({label,value}:{label:string;value:number}){return <div className="card"><span>{label}</span><strong>{brl(value)}</strong></div>}

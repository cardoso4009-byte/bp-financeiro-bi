'use client'

import {useMemo,useState} from 'react'
import {readFinancialSource} from '@/lib/financial-source'
import {buildAccountingIndicatorCards,calculateFinancialIndicators} from '@/lib/financial-indicators'
import {buildFinancialDiagnosis,type DiagnosisSeverity} from '@/lib/financial-diagnosis'
import {readActionPlan,writeActionPlan,type ActionPlanItem,type ActionPriority,type ActionStatus} from '@/lib/action-plan-store'
import {monthlyBalance} from '@/lib/monthly-data'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const priorities:ActionPriority[]=['Crítica','Alta','Média','Baixa']
const statuses:ActionStatus[]=['Pendente','Em andamento','Concluído','Cancelado']
const today=()=>new Date().toISOString().slice(0,10)

export default function PlanoAcaoPage(){
 const source=useMemo(()=>readFinancialSource(),[])
 const data=useMemo(()=>calculateFinancialIndicators(source.entries),[source.entries])
 const accounting=useMemo(()=>buildAccountingIndicatorCards(monthlyBalance.length-1),[])
 const diagnoses=useMemo(()=>buildFinancialDiagnosis(accounting.snapshot,data.indicators),[accounting.snapshot,data.indicators])
 const [items,setItems]=useState<ActionPlanItem[]>(()=>readActionPlan())
 const [selected,setSelected]=useState(diagnoses[0]?.key||'')
 const diagnosis=diagnoses.find(d=>d.key===selected)||diagnoses[0]
 const [responsible,setResponsible]=useState('')
 const [dueDate,setDueDate]=useState('')
 const [priority,setPriority]=useState<ActionPriority>('Alta')
 const [impact,setImpact]=useState('0')
 const [notes,setNotes]=useState('')
 const [filter,setFilter]=useState<ActionStatus|'Todos'>('Todos')
 const filtered=filter==='Todos'?items:items.filter(i=>i.status===filter)
 const totalExpected=items.reduce((s,i)=>s+i.expectedImpact,0)
 const totalActual=items.reduce((s,i)=>s+i.actualImpact,0)
 const open=items.filter(i=>i.status!=='Concluído'&&i.status!=='Cancelado').length

 function create(){
  if(!diagnosis)return
  const item:ActionPlanItem={id:`action-${Date.now()}`,createdAt:new Date().toISOString(),title:diagnosis.title,area:areaFrom(diagnosis.key),diagnosisKey:diagnosis.key,signal:diagnosis.signal,action:diagnosis.action,responsible:responsible||'A definir',dueDate:dueDate||today(),priority,status:'Pendente',expectedImpact:Number(impact)||0,actualImpact:0,notes}
  const next=[item,...items]; setItems(next); writeActionPlan(next); setResponsible('');setDueDate('');setImpact('0');setNotes('')
 }
 function update(id:string,patch:Partial<ActionPlanItem>){const next=items.map(i=>i.id===id?{...i,...patch}:i);setItems(next);writeActionPlan(next)}
 function remove(id:string){const next=items.filter(i=>i.id!==id);setItems(next);writeActionPlan(next)}

 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Plano de Ação Gerencial</h1><p>Diagnóstico → Prioridade → Responsável → Prazo → Impacto → Resultado</p></div></header>
  <section className="panel wide" style={{marginBottom:18}}><div className="panel-title"><div><h2>Converter diagnóstico em ação</h2><span>As ações partem dos sinais identificados no módulo de Indicadores</span></div><span>{diagnoses.filter(d=>d.severity==='critical').length} críticos</span></div>
   <div className="grid">
    <div className="rows"><label>Diagnóstico<select value={selected} onChange={e=>setSelected(e.target.value)}>{diagnoses.map(d=><option key={d.key} value={d.key}>{severityLabel(d.severity)} — {d.title}</option>)}</select></label><div className="note"><b>{diagnosis?.signal}</b><p style={{margin:'6px 0'}}>{diagnosis?.action}</p></div></div>
    <div className="rows"><label>Responsável<input value={responsible} onChange={e=>setResponsible(e.target.value)} placeholder="Ex.: Financeiro / Gestor"/></label><label>Prazo<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label><label>Prioridade<select value={priority} onChange={e=>setPriority(e.target.value as ActionPriority)}>{priorities.map(p=><option key={p}>{p}</option>)}</select></label><label>Impacto financeiro esperado<input type="number" value={impact} onChange={e=>setImpact(e.target.value)} placeholder="0"/></label><label>Observações<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Premissas, próximos passos ou evidências"/></label><button onClick={create}>Adicionar ao plano de ação</button></div>
   </div>
  </section>
  <section className="panel wide" style={{marginBottom:18}}><div className="panel-title"><h2>Acompanhamento</h2><span>{open} ações abertas</span></div><div className="indicator-grid"><Metric title="Ações abertas" value={String(open)} detail="Pendentes + em andamento"/><Metric title="Impacto esperado" value={brl(totalExpected)} detail="Estimativa cadastrada"/><Metric title="Impacto realizado" value={brl(totalActual)} detail="Resultado informado"/><Metric title="Execução financeira" value={totalExpected?`${((totalActual/totalExpected)*100).toFixed(1).replace('.',',')}%`:'0,0%'} detail="Realizado ÷ esperado"/></div></section>
  <section className="panel wide"><div className="panel-title"><div><h2>Plano de ação</h2><span>Persistido no navegador</span></div><select value={filter} onChange={e=>setFilter(e.target.value as ActionStatus|'Todos')}><option>Todos</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>
   {!filtered.length?<div className="note">Nenhuma ação cadastrada. Selecione um diagnóstico acima para criar a primeira ação.</div>:<div className="rows">{filtered.map(i=><ActionRow key={i.id} item={i} onUpdate={update} onDelete={remove}/>)}</div>}
  </section>
 </main>
}
function areaFrom(key:string){if(key.includes('liquidity')||key.includes('ncg'))return 'Capital de Giro';if(key.includes('pmr')||key.includes('pmp')||key.includes('cycle'))return 'Ciclo Financeiro';if(key.includes('margin')||key.includes('ebitda'))return 'Rentabilidade';if(key.includes('debt'))return 'Endividamento';if(key.includes('roic')||key.includes('fixed'))return 'Investimentos';return 'Financeiro'}
function severityLabel(s:DiagnosisSeverity){return s==='critical'?'CRÍTICO':s==='attention'?'ATENÇÃO':'POSITIVO'}
function Metric({title,value,detail}:{title:string;value:string;detail:string}){return <div className="indicator"><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>}
function ActionRow({item,onUpdate,onDelete}:{item:ActionPlanItem;onUpdate:(id:string,p:Partial<ActionPlanItem>)=>void;onDelete:(id:string)=>void}){return <div className="row" style={{display:'grid',gridTemplateColumns:'1fr auto',gap:18,alignItems:'start',padding:'16px 0'}}><span><b>{item.title}</b><small style={{display:'block',opacity:.75,marginTop:3}}>{item.area} • {item.signal}</small><small style={{display:'block',marginTop:4}}>{item.action}</small><small style={{display:'block',opacity:.7,marginTop:4}}>Responsável: {item.responsible} • Prazo: {item.dueDate} • Impacto: {item.expectedImpact.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})}</small>{item.notes&&<small style={{display:'block',opacity:.7,marginTop:3}}>{item.notes}</small>}</span><span style={{display:'grid',gap:6,justifyItems:'end'}}><select value={item.priority} onChange={e=>onUpdate(item.id,{priority:e.target.value as ActionPriority})}>{priorities.map(p=><option key={p}>{p}</option>)}</select><select value={item.status} onChange={e=>onUpdate(item.id,{status:e.target.value as ActionStatus})}>{statuses.map(s=><option key={s}>{s}</option>)}</select>{item.status==='Concluído'&&<input type="number" value={item.actualImpact} onChange={e=>onUpdate(item.id,{actualImpact:Number(e.target.value)||0})} placeholder="Impacto realizado"/>}<button onClick={()=>onDelete(item.id)}>Excluir</button></span></div>}

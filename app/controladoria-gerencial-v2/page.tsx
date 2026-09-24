'use client'

import { useMemo, useState } from 'react'
import { ReportPeriodFilter, DEFAULT_REPORT_PERIOD } from '@/components/report-period-filter'
import { competence } from '@/lib/report-period'
import { buildV2FinancialBase } from '@/lib/v2-financial-base'
import { buildV2BudgetReport } from '@/lib/v2-budget'
import { readV2BrowserStore } from '@/lib/v2-browser-storage'
import { readV2CostCenters } from '@/lib/v2-cost-center-storage'
import { readV2BudgetEntries } from '@/lib/v2-budget-storage'
import { buildManagementAlerts, createManagementAction, DEFAULT_MANAGEMENT_THRESHOLDS, type V2ManagementAction, type V2ManagementAlert, type ManagementCauseType, type ManagementAlertLevel } from '@/lib/v2-management'
import { buildManagementDrilldown, updateManagementAlertCause, updateManagementAction, validateManagementAction } from '@/lib/v2-management-workflow'
import { readV2ManagementActions, writeV2ManagementActions, readV2ManagementAlerts, writeV2ManagementAlerts } from '@/lib/v2-management-storage'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const levelLabel:Record<ManagementAlertLevel,string>={normal:'Normal',atencao:'Atenção',critico:'Crítico'}
const levelClass=(l:ManagementAlertLevel)=>l==='critico'?'critical':l==='atencao'?'attention':'normal'

export default function ControladoriaGerencialV2(){
 const [period,setPeriod]=useState({...DEFAULT_REPORT_PERIOD,month:12})
 const [selected,setSelected]=useState<string|null>(null)
 const [causeType,setCauseType]=useState<ManagementCauseType>('nao_classificada')
 const [causeNote,setCauseNote]=useState('')
 const [actionDescription,setActionDescription]=useState('')
 const [owner,setOwner]=useState('')
 const [dueDate,setDueDate]=useState('')
 const [actions,setActions]=useState<V2ManagementAction[]>(()=>readV2ManagementActions())
 const [savedAlerts,setSavedAlerts]=useState<V2ManagementAlert[]>(()=>readV2ManagementAlerts())
 const store=useMemo(()=>readV2BrowserStore(),[])
 const entries=useMemo(()=>store.entries,[store])
 const budget=useMemo(()=>readV2BudgetEntries(),[])
 const centers=useMemo(()=>readV2CostCenters(),[])
 const base=useMemo(()=>buildV2FinancialBase(entries),[entries])
 const selectedCompetence=competence(period.year,period.month)
 const report=useMemo(()=>buildV2BudgetReport(base,budget,centers,selectedCompetence),[base,budget,centers,selectedCompetence])
 const alerts=useMemo(()=>buildManagementAlerts(report.lines,DEFAULT_MANAGEMENT_THRESHOLDS).map(alert=>{const saved=savedAlerts.find(item=>item.id===alert.id);return saved?{...alert,causeType:saved.causeType,causeNote:saved.causeNote,actionIds:saved.actionIds,createdAt:saved.createdAt,updatedAt:saved.updatedAt}:alert}),[report.lines,savedAlerts])
 const filtered=alerts.filter(a=>a.level!=='normal')
 const current=selected?alerts.find(a=>a.id===selected):undefined
 const drilldown=current?buildManagementDrilldown(current,base.entries,actions):undefined
 const metrics=useMemo(()=>({open:actions.filter(a=>a.status==='aberta').length,inProgress:actions.filter(a=>a.status==='em_andamento').length,done:actions.filter(a=>a.status==='concluida').length,overdue:actions.filter(a=>Boolean(a.dueDate)&&a.dueDate! < new Date().toISOString().slice(0,10)&&!['concluida','cancelada'].includes(a.status)).length,noCause:alerts.filter(a=>a.level!=='normal'&&!a.causeNote).length,noAction:alerts.filter(a=>a.level!=='normal'&&!actions.some(x=>x.alertId===a.id)).length}),[actions,alerts])
 const saveCause=()=>{if(!current)return;const updated=updateManagementAlertCause(current,causeType,causeNote);const next=alerts.map(a=>a.id===updated.id?updated:a);setSavedAlerts(next);writeV2ManagementAlerts(next);setCauseNote(updated.causeNote??'')}
 const addAction=()=>{if(!current)return;const errors=validateManagementAction(actionDescription);if(errors.length){window.alert(errors[0]);return}const now=new Date().toISOString();const created={...createManagementAction(current.id,actionDescription,now),owner:owner||undefined,dueDate:dueDate||undefined};const nextActions=[...actions,created];const nextAlerts=alerts.map(a=>a.id===current.id?{...a,actionIds:[...a.actionIds,created.id],updatedAt:now}:a);setActions(nextActions);writeV2ManagementActions(nextActions);setSavedAlerts(nextAlerts);writeV2ManagementAlerts(nextAlerts);setActionDescription('');setOwner('');setDueDate('')}
 const updateActionStatus=(id:string,status:V2ManagementAction['status'])=>{const next=actions.map(x=>x.id===id?updateManagementAction(x,{status}):x);setActions(next);writeV2ManagementActions(next)}
 return <main className="page">
  <style>{`.page{max-width:1400px;margin:auto;padding:28px;font-family:Arial,sans-serif;color:#10243b}.head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.head-actions{display:flex;align-items:flex-start;gap:8px}.action-link{display:inline-flex;align-items:center;padding:10px 13px;border:1px solid #cbd9e6;border-radius:9px;background:#fff;color:#205a85;text-decoration:none;font-size:12px;font-weight:800;white-space:nowrap}.action-link:hover{background:#f4f8fc}.eyebrow{font-size:11px;color:#6c8298;font-weight:800;letter-spacing:.1em}.head h1{margin:6px 0;font-size:30px}.head p{margin:0;color:#6c8298}.filter{background:#fff;border:1px solid #dce6f0;border-radius:12px;padding:10px 14px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:22px 0}.card,.panel{background:#fff;border:1px solid #dce6f0;border-radius:14px}.card{padding:18px}.card span{display:block;color:#70869c;font-size:12px}.card strong{display:block;font-size:24px;margin-top:7px}.card small{display:block;margin-top:5px;color:#8094a8}.panel{padding:20px}.panel h2{margin:0;font-size:17px}.panel-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.panel-title span{font-size:11px;color:#7b8fa4}.layout{display:grid;grid-template-columns:1.35fr .9fr;gap:14px}.row{display:grid;grid-template-columns:1.3fr .8fr .8fr .8fr .65fr;gap:10px;padding:11px 0;border-top:1px solid #edf1f5;align-items:center;font-size:12px}.row b{text-align:right}.badge{justify-self:end;padding:5px 8px;border-radius:999px;font-weight:800}.badge.critical{background:#ffe4e4;color:#b42318}.badge.attention{background:#fff0cc;color:#8a5b00}.badge.normal{background:#e5f7ec;color:#18794e}.alert{padding:13px;border-top:1px solid #edf1f5;cursor:pointer}.alert:first-child{border-top:0}.alert strong{font-size:13px}.alert small{display:block;color:#73879a;margin-top:4px}.detail{margin-top:15px;background:#f7f9fc;border-radius:10px;padding:14px}.detail dl{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 0}.detail dt{font-size:10px;color:#7b8fa4;text-transform:uppercase}.detail dd{margin:2px 0 0;font-weight:700}.note{margin-top:15px;padding:13px;border-left:4px solid #4d8ed8;background:#f4f8fd;color:#52697e;font-size:12px}@media(max-width:900px){.head-actions{flex-direction:column;align-items:stretch}.cards{grid-template-columns:repeat(2,1fr)}.layout{grid-template-columns:1fr}}@media(max-width:600px){.page{padding:16px}.cards{grid-template-columns:1fr}.row{grid-template-columns:1fr 1fr}.row>:nth-child(n+3){display:none}}.detail-form{display:grid;grid-template-columns:1fr 2fr 100px;gap:8px;margin-top:12px}.detail-form input,.detail-form select,.detail-form button{padding:9px;border:1px solid #d5e0eb;border-radius:8px;background:#fff}.detail-form button{font-weight:800;cursor:pointer}.drill{margin-top:12px;padding:10px;background:#fff;border:1px solid #e2e9f0;border-radius:8px;font-size:11px}.drill div{padding:5px 0;border-top:1px solid #edf1f5}`}</style>
  <div className="head"><div><div className="eyebrow">CONTROLADORIA GERENCIAL V2</div><h1>Causa → Alerta → Ação</h1><p>Desvios Orçado × Realizado com rastreabilidade até a Base Financeira V2.</p></div><div className="head-actions"><a className="action-link" href="/plano-acao-gerencial-v2">Plano de Ação →</a><div className="filter"><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/></div></div></div>
  <div className="cards"><div className="card"><span>Ações abertas</span><strong>{metrics.open}</strong><small>Em acompanhamento</small></div><div className="card"><span>Em andamento</span><strong>{metrics.inProgress}</strong><small>Execução ativa</small></div><div className="card"><span>Concluídas</span><strong>{metrics.done}</strong><small>Encerradas</small></div><div className="card"><span>Ações vencidas</span><strong>{metrics.overdue}</strong><small>Exigem acompanhamento</small></div></div>
  <div className="cards"><div className="card"><span>Linhas analisadas</span><strong>{alerts.length}</strong><small>Competência selecionada</small></div><div className="card"><span>Alertas</span><strong>{filtered.length}</strong><small>Acima do limite de atenção</small></div><div className="card"><span>Sem causa</span><strong>{metrics.noCause}</strong><small>Alertas sem justificativa registrada</small></div><div className="card"><span>Sem ação</span><strong>{metrics.noAction}</strong><small>Alertas sem ação vinculada</small></div></div>
  <div className="layout">
   <section className="panel"><div className="panel-title"><h2>Desvios por dimensão</h2><span>Sem rateio ou ajuste artificial</span></div>
    <div className="row" style={{fontWeight:800}}><span>DIMENSÃO</span><span>ORÇADO</span><span>REALIZADO</span><span>DESVIO</span><span>STATUS</span></div>
    {alerts.map(a=><div className="row" key={a.id}><span><b>{a.label}</b></span><span>{brl(a.budget)}</span><span>{brl(a.actual)}</span><span>{brl(a.variance)}</span><span className={'badge '+levelClass(a.level)}>{levelLabel[a.level]}</span></div>)}
    {!alerts.length&&<p>Não há linhas orçamentárias para a competência selecionada.</p>}
   </section>
   <section className="panel"><div className="panel-title"><h2>Alertas que exigem análise</h2><span>{filtered.length} itens</span></div>
    {filtered.map(a=><div className="alert" key={a.id} onClick={()=>{setSelected(a.id);setCauseType(a.causeType??'nao_classificada');setCauseNote(a.causeNote??'')}}><strong>{a.label}</strong><span className={'badge '+levelClass(a.level)}>{levelLabel[a.level]}</span><small>Desvio {brl(a.variance)} {a.variancePercent!==undefined?'• '+(a.variancePercent*100).toFixed(1).replace('.',',')+'%':''}</small></div>)}
    {!filtered.length&&<p>Nenhum alerta acima do limite configurado.</p>}
    {current&&<div className="detail"><b>Detalhamento do alerta</b><dl><div><dt>Competência</dt><dd>{current.period}</dd></div><div><dt>Origem</dt><dd>{drilldown?.entries.length??0} lançamento(s)</dd></div><div><dt>Causa</dt><dd>{current.causeType??'A registrar'}</dd></div><div><dt>Ações</dt><dd>{drilldown?.actions.length??0}</dd></div></dl>
    <div className="detail-form"><select value={causeType} onChange={e=>setCauseType(e.target.value as ManagementCauseType)}><option value="nao_classificada">Não classificada</option><option value="volume">Volume</option><option value="preco">Preço</option><option value="mix">Mix</option><option value="timing">Timing</option><option value="outro">Outro</option></select><input value={causeNote} onChange={e=>setCauseNote(e.target.value)} placeholder="Descreva a causa identificada"/><button onClick={saveCause}>Registrar causa</button><input value={actionDescription} onChange={e=>setActionDescription(e.target.value)} placeholder="Nova ação corretiva"/><input value={owner} onChange={e=>setOwner(e.target.value)} placeholder="Responsável"/><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/><button onClick={addAction}>Criar ação</button></div>
    <div className="drill"><b>Lançamentos de origem</b>{drilldown?.entries.map(e=><div key={e.id}>{e.date} • {e.description} • {brl(e.amount)}</div>)}<b style={{display:'block',marginTop:10}}>Ações registradas</b>{drilldown?.actions.map(a=><div key={a.id}>{a.description} • {a.owner??'Sem responsável'} • {a.dueDate??'Sem prazo'} • <select value={a.status} onChange={e=>updateActionStatus(a.id,e.target.value as V2ManagementAction['status'])}><option value="aberta">Aberta</option><option value="em_andamento">Em andamento</option><option value="concluida">Concluída</option><option value="cancelada">Cancelada</option></select></div>)}</div>
    <div className="note">A causa não é inferida pelo sistema. O usuário registra a explicação e a ação corretiva com responsável e prazo.</div></div>}
   </section>
  </div>
 </main>
}

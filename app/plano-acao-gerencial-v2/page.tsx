'use client'

import { useMemo, useState } from 'react'
import type { V2ManagementAction, ManagementActionStatus } from '@/lib/v2-management'
import { readV2ManagementActions, writeV2ManagementActions, readV2ManagementAlerts } from '@/lib/v2-management-storage'
import { updateManagementAction } from '@/lib/v2-management-workflow'

const statusLabel: Record<ManagementActionStatus,string> = { aberta:'Aberta', em_andamento:'Em andamento', concluida:'Concluída', cancelada:'Cancelada' }
const statusClass: Record<ManagementActionStatus,string> = { aberta:'open', em_andamento:'progress', concluida:'done', cancelada:'cancelled' }
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function PlanoAcaoGerencialV2(){
  const [actions,setActions]=useState<V2ManagementAction[]>(()=>readV2ManagementActions())
  const [filter,setFilter]=useState<'todas'|ManagementActionStatus>('todas')
  const alerts=useMemo(()=>readV2ManagementAlerts(),[])
  const alertMap=useMemo(()=>new Map(alerts.map(alert=>[alert.id,alert])),[alerts])
  const today=new Date().toISOString().slice(0,10)
  const visible=useMemo(()=>actions.filter(action=>filter==='todas'||action.status===filter).sort((a,b)=>(a.dueDate||'9999-12-31').localeCompare(b.dueDate||'9999-12-31')),[actions,filter])
  const metrics=useMemo(()=>({
    total:actions.length,
    aberta:actions.filter(a=>a.status==='aberta').length,
    em_andamento:actions.filter(a=>a.status==='em_andamento').length,
    concluida:actions.filter(a=>a.status==='concluida').length,
    atrasada:actions.filter(a=>Boolean(a.dueDate)&&a.dueDate!<today&&a.status!=='concluida'&&a.status!=='cancelada').length,
  }),[actions,today])
  function changeStatus(action:V2ManagementAction,status:ManagementActionStatus){
    const updated=updateManagementAction(action,{status})
    const next=actions.map(item=>item.id===action.id?updated:item)
    setActions(next)
    writeV2ManagementActions(next)
  }
  return <main>
    <style>{`
      :root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}*{box-sizing:border-box}
      body{margin:0;background:#f3f7fb;color:#102a43}main{min-height:100vh;padding:28px;background:linear-gradient(180deg,#edf5fc 0,#f7fafc 260px)}
      .wrap{max-width:1380px;margin:0 auto}.top{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:22px}
      .eyebrow{font-size:11px;font-weight:800;letter-spacing:.13em;color:#3276a8}h1{margin:5px 0 6px;font-size:30px}.subtitle{margin:0;color:#65798d;font-size:13px}
      .back{display:inline-flex;padding:9px 13px;border:1px solid #cbd9e6;border-radius:9px;background:#fff;color:#205a85;text-decoration:none;font-size:12px;font-weight:700}
      .metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px}.metric{padding:16px;border:1px solid #d8e4ee;border-radius:13px;background:#fff;box-shadow:0 3px 12px rgba(20,55,85,.04)}
      .metric span{display:block;color:#72869a;font-size:11px;text-transform:uppercase;letter-spacing:.06em}.metric strong{display:block;margin-top:6px;font-size:25px}
      .toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.filters{display:flex;gap:7px;flex-wrap:wrap}
      button{border:1px solid #cbd9e6;border-radius:8px;background:#fff;padding:8px 11px;color:#36566f;font-weight:700;font-size:12px;cursor:pointer}button.active{background:#173f61;color:#fff;border-color:#173f61}
      .hint{font-size:11px;color:#71869a}.board{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;align-items:start}
      .column{min-height:260px;padding:11px;border:1px solid #d8e4ee;border-radius:13px;background:rgba(255,255,255,.75)}.column-title{display:flex;justify-content:space-between;align-items:center;margin:2px 3px 10px;font-size:12px;font-weight:800}
      .column-title span{padding:3px 7px;border-radius:99px;background:#edf3f8;color:#527087}.action{padding:13px;margin-bottom:9px;border:1px solid #d9e5ee;border-radius:11px;background:#fff}.action:last-child{margin-bottom:0}
      .action-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.action strong{font-size:13px;line-height:1.35}
      .badge{padding:4px 7px;border-radius:99px;font-size:9px;font-weight:800;text-transform:uppercase;white-space:nowrap}.badge.open{background:#fff4d7;color:#8a6100}.badge.progress{background:#e8f3ff;color:#27618e}.badge.done{background:#e6f7ee;color:#22724b}.badge.cancelled{background:#eef1f4;color:#697989}
      .meta{margin-top:9px;color:#71859a;font-size:10px;line-height:1.5}.meta b{color:#415c72}.overdue{color:#b44b3e!important;font-weight:800}.actions{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}.actions button{padding:6px 8px;font-size:10px}
      .empty{padding:28px 8px;text-align:center;color:#8295a7;font-size:11px}.footer-note{margin-top:18px;padding:12px 14px;border:1px dashed #cbd9e6;border-radius:10px;background:#fff;color:#667d91;font-size:11px}
      @media(max-width:1050px){.metrics{grid-template-columns:repeat(3,1fr)}.board{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){main{padding:16px}.top{align-items:flex-start;flex-direction:column}.metrics{grid-template-columns:repeat(2,1fr)}.board{grid-template-columns:1fr}}
    `}</style>
    <div className="wrap">
      <div className="top"><div><div className="eyebrow">CONTROLADORIA GERENCIAL V2</div><h1>Plano de Ação</h1><p className="subtitle">Acompanhamento das ações originadas pelos alertas de variação.</p></div><a className="back" href="/controladoria-gerencial-v2">← Voltar para Controladoria</a></div>
      <section className="metrics"><Metric label="Total de ações" value={metrics.total}/><Metric label="Abertas" value={metrics.aberta}/><Metric label="Em andamento" value={metrics.em_andamento}/><Metric label="Concluídas" value={metrics.concluida}/><Metric label="Atrasadas" value={metrics.atrasada}/></section>
      <div className="toolbar"><div className="filters">{(['todas','aberta','em_andamento','concluida','cancelada'] as const).map(value=><button key={value} className={filter===value?'active':''} onClick={()=>setFilter(value)}>{value==='todas'?'Todas':statusLabel[value]}</button>)}</div><div className="hint">As alterações são persistidas localmente no navegador.</div></div>
      <section className="board">
        {(['aberta','em_andamento','concluida','cancelada'] as ManagementActionStatus[]).map(status=>{
          const column=visible.filter(action=>action.status===status)
          return <div className="column" key={status}><div className="column-title"><span>{statusLabel[status]}</span><span>{column.length}</span></div>
            {column.length===0?<div className="empty">Nenhuma ação nesta etapa.</div>:column.map(action=>{
              const alert=alertMap.get(action.alertId)
              const overdue=Boolean(action.dueDate)&&action.dueDate!<today&&action.status!=='concluida'&&action.status!=='cancelada'
              return <article className="action" key={action.id}><div className="action-head"><strong>{action.description}</strong><span className={'badge '+statusClass[action.status]}>{statusLabel[action.status]}</span></div>
                <div className="meta"><div><b>Alerta:</b> {alert?.label||action.alertId}</div><div><b>Competência:</b> {alert?.period||'—'}</div><div><b>Responsável:</b> {action.owner||'Não definido'}</div>
                  <div className={overdue?'overdue':''}><b>Prazo:</b> {action.dueDate?new Date(action.dueDate+'T00:00:00').toLocaleDateString('pt-BR'):'Não definido'}{overdue?' • ATRASADA':''}</div>
                  {alert&&<div><b>Variação:</b> {brl(alert.variance)}{alert.variancePercent!==undefined?' • '+(alert.variancePercent*100).toFixed(1).replace('.',',')+'%':''}</div>}
                </div>
                {status!=='concluida'&&status!=='cancelada'&&<div className="actions">{status==='aberta'&&<button onClick={()=>changeStatus(action,'em_andamento')}>Iniciar</button>}{status==='em_andamento'&&<button onClick={()=>changeStatus(action,'concluida')}>Concluir</button>}<button onClick={()=>changeStatus(action,'cancelada')}>Cancelar</button></div>}
                {(status==='concluida'||status==='cancelada')&&<div className="actions"><button onClick={()=>changeStatus(action,'aberta')}>Reabrir</button></div>}
              </article>
            })}
          </div>
        })}
      </section>
      <div className="footer-note">Governança: o plano de ação não cria causas automaticamente. Cada ação permanece vinculada ao alerta que originou a decisão e à sua competência.</div>
    </div>
  </main>
}
function Metric({label,value}:{label:string;value:number}){return <div className="metric"><span>{label}</span><strong>{value}</strong></div>}

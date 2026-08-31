'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { agingSummary, openReceivablesPayables } from '@/lib/contas-receber-pagar'
import { readFinancialSource } from '@/lib/financial-source'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function AgingExecutiveAlerts(){
 const pathname=usePathname()
 const [target,setTarget]=useState<HTMLElement|null>(null)
 useEffect(()=>{
  if(pathname!=='/') return
  const cards=document.querySelector('.content .cards')
  if(!cards) return
  const host=document.createElement('div')
  host.className='aging-executive-host'
  cards.insertAdjacentElement('afterend',host)
  setTarget(host)
  return()=>host.remove()
 },[pathname])
 const entries=useMemo(()=>pathname==='/'?readFinancialSource().entries:[],[pathname])
 const items=useMemo(()=>openReceivablesPayables(entries,'2026-12-31'),[entries])
 if(pathname!=='/'||!target) return null
 const overdue=items.filter(i=>i.daysOverdue>0)
 const overdueReceivable=overdue.filter(i=>i.direction==='Receber').reduce((s,i)=>s+Math.abs(i.value),0)
 const overduePayable=overdue.filter(i=>i.direction==='Pagar').reduce((s,i)=>s+Math.abs(i.value),0)
 const receivable=items.filter(i=>i.direction==='Receber').reduce((s,i)=>s+Math.abs(i.value),0)
 const payable=items.filter(i=>i.direction==='Pagar').reduce((s,i)=>s+Math.abs(i.value),0)
 const aging90=agingSummary(items).find(x=>x.aging==='> 90 dias')
 const overduePct=receivable?overdueReceivable/receivable:0
 const risk=overduePct>=0.3?'Alto':overduePct>=0.1?'Atenção':'Controlado'
 const riskColor=risk==='Alto'?'#b42318':risk==='Atenção'?'#b54708':'#067647'
 const dueSoon=items.filter(i=>i.daysOverdue===0)
 const dueSoonReceivable=dueSoon.filter(i=>i.direction==='Receber').reduce((s,i)=>s+Math.abs(i.value),0)
 const dueSoonPayable=dueSoon.filter(i=>i.direction==='Pagar').reduce((s,i)=>s+Math.abs(i.value),0)
 return createPortal(<section className="panel wide aging-executive-alerts" style={{margin:'16px 0'}}>
  <div className="panel-title"><div><h2>Alertas de Liquidez — Aging</h2><span>Visão executiva • Data-base 31/12/2026</span></div><span style={{color:riskColor,fontWeight:700}}>● Risco {risk}</span></div>
  <div className="grid">
   <Alert icon="⚠" title="Recebíveis vencidos" value={brl(overdueReceivable)} detail={`${overdue.filter(i=>i.direction==='Receber').length} título(s) • ${(overduePct*100).toFixed(1).replace('.',',')}% da carteira`} color="#b42318"/>
   <Alert icon="◷" title="Recebimentos a vencer" value={brl(dueSoonReceivable)} detail={`${dueSoon.filter(i=>i.direction==='Receber').length} título(s) em aberto`} color="#b54708"/>
   <Alert icon="↕" title="Obrigações em aberto" value={brl(payable)} detail={`${items.filter(i=>i.direction==='Pagar').length} obrigação(ões) • ${brl(overduePayable)} vencidas`} color="#175cd3"/>
   <Alert icon="◉" title="Faixa > 90 dias" value={brl((aging90?.receber||0)+(aging90?.pagar||0))} detail="Maior concentração de risco do Aging" color="#7f56d9"/>
  </div>
  <div className="note" style={{marginTop:12}}><strong>Leitura executiva:</strong> {overdueReceivable>0?`há ${brl(overdueReceivable)} em recebíveis vencidos, reduzindo a previsibilidade do caixa.`:'não há recebíveis vencidos na data-base.'} {dueSoonPayable>0?` Existem ${brl(dueSoonPayable)} em obrigações a vencer.`:''} <a href="/contas-receber-pagar" style={{fontWeight:700,marginLeft:6}}>Abrir Aging →</a></div>
 </section>,target)
}
function Alert({icon,title,value,detail,color}:{icon:string;title:string;value:string;detail:string;color:string}){return <div className="note" style={{borderLeft:`4px solid ${color}`,minHeight:92}}><div style={{fontSize:12,fontWeight:700,color}}>{icon} {title}</div><strong style={{display:'block',fontSize:20,marginTop:8}}>{value}</strong><small style={{display:'block',marginTop:5,color:'#667085'}}>{detail}</small></div>}

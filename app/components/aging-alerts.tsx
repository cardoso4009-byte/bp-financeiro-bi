'use client'

import { useMemo } from 'react'
import { agingSummary, openReceivablesPayables } from '@/lib/contas-receber-pagar'
import { readFinancialSource } from '@/lib/financial-source'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function AgingAlerts(){
 const entries=readFinancialSource().entries
 const items=useMemo(()=>openReceivablesPayables(entries,'2026-12-31'),[entries])
 const summary=agingSummary(items)
 const overdue=items.filter(i=>i.daysOverdue>0)
 const overdueReceivable=overdue.filter(i=>i.direction==='Receber').reduce((s,i)=>s+Math.abs(i.value),0)
 const overduePayable=overdue.filter(i=>i.direction==='Pagar').reduce((s,i)=>s+Math.abs(i.value),0)
 const dueSoon=items.filter(i=>i.daysOverdue===0)
 const dueSoonReceivable=dueSoon.filter(i=>i.direction==='Receber').reduce((s,i)=>s+Math.abs(i.value),0)
 const dueSoonPayable=dueSoon.filter(i=>i.direction==='Pagar').reduce((s,i)=>s+Math.abs(i.value),0)
 const openReceivable=items.filter(i=>i.direction==='Receber').reduce((s,i)=>s+Math.abs(i.value),0)
 const overduePct=openReceivable?overdueReceivable/openReceivable:0
 const risk=overduePct>=0.3?'Alto':overduePct>=0.1?'Atenção':'Controlado'
 const riskIcon=risk==='Alto'?'🔴':risk==='Atenção'?'🟡':'🟢'
 const aging90=summary.find(s=>s.aging==='> 90 dias')
 return <section className="panel wide" style={{marginTop:16}}>
  <div className="panel-title"><div><h2>Alertas de Liquidez — Aging</h2><span>Visão executiva • Data-base 31/12/2026</span></div><span>{riskIcon} Risco {risk}</span></div>
  <div className="grid">
   <AlertCard icon="🔴" title="Recebíveis vencidos" value={brl(overdueReceivable)} detail={`${overdue.filter(i=>i.direction==='Receber').length} título(s) • ${(overduePct*100).toFixed(1).replace('.',',')}% da carteira`} tone="danger"/>
   <AlertCard icon="🟡" title="Próximos vencimentos" value={brl(dueSoonReceivable)} detail={`${dueSoon.filter(i=>i.direction==='Receber').length} recebimento(s) a vencer`} tone="warning"/>
   <AlertCard icon="🔵" title="Obrigações em aberto" value={brl(openReceivable?overduePayable+dueSoonPayable:overduePayable+dueSoonPayable)} detail={`${items.filter(i=>i.direction==='Pagar').length} obrigação(ões) • acompanhe o caixa`} tone="info"/>
   <AlertCard icon="🟣" title="Risco > 90 dias" value={brl((aging90?.receber||0)+(aging90?.pagar||0))} detail="Valores na faixa de maior risco" tone="neutral"/>
  </div>
  <div className="note" style={{marginTop:12}}><strong>Leitura executiva:</strong> {overdueReceivable>0?`há ${brl(overdueReceivable)} em recebíveis vencidos, pressionando a previsibilidade do caixa.`:'não há recebíveis vencidos na data-base.'} {overduePayable>0?`As obrigações vencidas somam ${brl(overduePayable)} e devem ser consideradas no plano de caixa.`:''} <a href="/contas-receber-pagar" style={{fontWeight:700,marginLeft:6}}>Abrir Aging →</a></div>
 </section>
}
function AlertCard({icon,title,value,detail,tone}:{icon:string;title:string;value:string;detail:string;tone:string}){return <div className="note" style={{borderLeft:'4px solid',borderLeftColor:tone==='danger'?'#b42318':tone==='warning'?'#b54708':tone==='info'?'#175cd3':'#7f56d9',minHeight:92}}><div style={{fontSize:12,fontWeight:700}}>{icon} {title}</div><strong style={{display:'block',fontSize:20,marginTop:8}}>{value}</strong><small style={{display:'block',marginTop:5,color:'#667085'}}>{detail}</small></div>}

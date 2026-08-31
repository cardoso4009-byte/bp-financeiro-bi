'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { openReceivablesPayables } from '@/lib/contas-receber-pagar'
import { readFinancialSource } from '@/lib/financial-source'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

type Group={name:string;value:number;count:number;direction:'Receber'|'Pagar'}

export default function AgingManagementPanel(){
 const pathname=usePathname()
 const [target,setTarget]=useState<HTMLElement|null>(null)
 useEffect(()=>{
  if(pathname!=='/') return
  const anchor=document.querySelector('.aging-executive-alerts')
  if(!anchor) return
  const host=document.createElement('div')
  host.className='aging-management-host'
  anchor.insertAdjacentElement('afterend',host)
  setTarget(host)
  return()=>host.remove()
 },[pathname])
 const entries=useMemo(()=>pathname==='/'?readFinancialSource().entries:[],[pathname])
 const items=useMemo(()=>openReceivablesPayables(entries,'2026-12-31'),[entries])
 if(pathname!=='/'||!target) return null
 const overdue=items.filter(i=>i.daysOverdue>0)
 const groups=useMemo(()=>{
  const map=new Map<string,Group>()
  overdue.forEach(i=>{const key=`${i.direction}|${i.category}`;const old=map.get(key);map.set(key,{name:i.category,direction:i.direction,value:(old?.value||0)+Math.abs(i.value),count:(old?.count||0)+1})})
  return Array.from(map.values()).sort((a,b)=>b.value-a.value).slice(0,6)
 },[overdue])
 const recv=groups.filter(g=>g.direction==='Receber')
 const pay=groups.filter(g=>g.direction==='Pagar')
 const top=groups[0]
 return createPortal(<section className="panel wide aging-management-panel" style={{margin:'16px 0'}}>
  <div className="panel-title"><div><h2>Prioridades de Controladoria</h2><span>Itens vencidos • concentração por categoria</span></div><a href="/contas-receber-pagar" style={{fontWeight:700}}>Abrir Aging →</a></div>
  <div className="grid">
   <Priority title="Cobrança prioritária" items={recv} color="#b42318" empty="Nenhum recebível vencido."/>
   <Priority title="Obrigações prioritárias" items={pay} color="#175cd3" empty="Nenhuma obrigação vencida."/>
  </div>
  <div className="note" style={{marginTop:12}}><strong>Recomendação:</strong> {top?`priorize ${top.direction==='Receber'?'a cobrança':'a negociação'} de ${top.name}, com ${brl(top.value)} distribuídos em ${top.count} título(s).`:'a carteira está sem itens vencidos.'} <span style={{marginLeft:8}}>A análise detalhada continua disponível no Aging.</span></div>
 </section>,target)
}
function Priority({title,items,color,empty}:{title:string;items:Group[];color:string;empty:string}){return <div className="note" style={{minHeight:150}}><div style={{fontWeight:750,color}}>{title}</div>{items.length?items.map((g,i)=><div key={`${g.direction}-${g.name}`} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'10px 0',borderBottom:'1px solid #e4e7ec'}}><span><b>{i+1}. {g.name}</b><small style={{display:'block',color:'#667085'}}>{g.count} título(s)</small></span><strong>{brl(g.value)}</strong></div>):<p style={{color:'#667085'}}>{empty}</p>}</div>}

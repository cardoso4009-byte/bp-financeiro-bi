'use client'

import {useState} from 'react'
import type { FinancialEntry } from '@/lib/lancamentos-data'

type Props={entries:FinancialEntry[];title?:string}
const brl=(v:number)=>Math.abs(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function FinancialDrilldown({entries,title='Detalhamento financeiro'}:Props){
 const [open,setOpen]=useState<Record<string,boolean>>({})
 const toggle=(key:string)=>setOpen(p=>({...p,[key]:!p[key]}))
 const centers=[...new Set(entries.map(e=>e.costCenter||'Sem centro de custo'))]
 const categories=(center:string)=>[...new Set(entries.filter(e=>(e.costCenter||'Sem centro de custo')===center).map(e=>e.category||'Sem categoria'))]
 const months=(center:string,category:string)=>[...new Set(entries.filter(e=>(e.costCenter||'Sem centro de custo')===center&&(e.category||'Sem categoria')===category).map(e=>e.competence||e.date?.slice(0,7)||'Sem competência'))].sort()
 const leaf=(center:string,category:string,month:string)=>entries.filter(e=>(e.costCenter||'Sem centro de custo')===center&&(e.category||'Sem categoria')===category&&(e.competence||e.date?.slice(0,7)||'Sem competência')===month)
 const value=(items:FinancialEntry[])=>items.reduce((s,e)=>s+Math.abs(e.value),0)
 return <section className="panel wide"><div className="panel-title"><div><h2>{title}</h2><span>+ expande • − recolhe • Centro de Custo → Categoria → Mês → Lançamento</span></div><span>Base financeira única</span></div><div style={{display:'grid',gap:6}}>{centers.map(center=>{const cOpen=!!open[`c:${center}`];return <div key={center}><button type="button" onClick={()=>toggle(`c:${center}`)} style={rowStyle(0)}><Expand open={cOpen}/><strong>{center}</strong><span style={{marginLeft:'auto'}}>{brl(value(entries.filter(e=>(e.costCenter||'Sem centro de custo')===center)))}</span></button>{cOpen&&categories(center).map(category=>{const k=`c:${center}|cat:${category}`,catOpen=!!open[k];return <div key={k}><button type="button" onClick={()=>toggle(k)} style={rowStyle(1)}><Expand open={catOpen}/>{category}<span style={{marginLeft:'auto'}}>{brl(value(entries.filter(e=>(e.costCenter||'Sem centro de custo')===center&&(e.category||'Sem categoria')===category)))}</span></button>{catOpen&&months(center,category).map(month=>{const mk=`${k}|m:${month}`,mOpen=!!open[mk],items=leaf(center,category,month);return <div key={mk}><button type="button" onClick={()=>toggle(mk)} style={rowStyle(2)}><Expand open={mOpen}/>{month}<span style={{marginLeft:'auto'}}>{brl(value(items))}</span></button>{mOpen&&items.map(e=><button key={e.id} type="button" onClick={()=>toggle(`${mk}|e:${e.id}`)} style={rowStyle(3)}><span style={{width:24,display:'inline-block'}}>•</span><span style={{textAlign:'left'}}><strong>{e.description||`Lançamento ${e.id}`}</strong><small style={{display:'block',color:'#667085'}}>{e.type} • {e.status} • venc. {e.dueDate}</small></span><span style={{marginLeft:'auto'}}>{brl(e.value)}</span></button>)}</div>})}</div>})}</div>})}</div></section>
}
function Expand({open}:{open:boolean}){return <span className="expand-btn" style={{display:'inline-grid',placeItems:'center',width:24,height:24,marginRight:8,border:'1px solid #cbd5e1',borderRadius:6,background:'#fff'}}>{open?'−':'+'}</span>}
function rowStyle(level:number):React.CSSProperties{return {display:'flex',alignItems:'center',width:'100%',border:0,borderBottom:'1px solid #edf1f5',background:level===0?'#f7f9fc':'transparent',padding:`10px ${12+level*28}px`,cursor:'pointer',textAlign:'left',fontSize:level===0?14:13,color:'#172b4d'}}

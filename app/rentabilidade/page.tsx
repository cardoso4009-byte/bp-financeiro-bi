'use client'

import { useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`

type Row={name:string;receita:number;opex:number;resultado:number;children?:Row[]}

export default function Rentabilidade(){
 const entries=useMemo(()=>readFinancialSource().entries,[])
 const [expanded,setExpanded]=useState<Set<string>>(new Set(['all']))
 const toggle=(k:string)=>setExpanded(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n})
 const receitas=entries.filter(e=>e.type==='Receita')
 const despesas=entries.filter(e=>e.type==='Despesa')
 const receita=receitas.reduce((s,e)=>s+Math.abs(e.value),0)
 const opex=despesas.reduce((s,e)=>s+Math.abs(e.value),0)
 const resultado=receita-opex
 const margem=receita?resultado/receita:0
 const centers=useMemo(()=>{
  const map=new Map<string,Row>()
  entries.forEach(e=>{if(!['Receita','Despesa'].includes(e.type))return;const key=e.costCenter||'Sem centro de custo';const r=map.get(key)||{name:key,receita:0,opex:0,resultado:0};if(e.type==='Receita')r.receita+=Math.abs(e.value);else r.opex+=Math.abs(e.value);r.resultado=r.receita-r.opex;map.set(key,r)})
  return Array.from(map.values()).sort((a,b)=>b.resultado-a.resultado).map(c=>({...c,children:Array.from(new Set(entries.filter(e=>e.costCenter===c.name&&['Receita','Despesa'].includes(e.type)).map(e=>e.category))).map(cat=>{const es=entries.filter(e=>e.costCenter===c.name&&e.category===cat&&['Receita','Despesa'].includes(e.type));const r=es.filter(e=>e.type==='Receita').reduce((s,e)=>s+Math.abs(e.value),0);const o=es.filter(e=>e.type==='Despesa').reduce((s,e)=>s+Math.abs(e.value),0);return {name:cat,receita:r,opex:o,resultado:r-o,children:Array.from(new Set(es.map(e=>e.competence))).sort().map(m=>{const ms=es.filter(e=>e.competence===m);const mr=ms.filter(e=>e.type==='Receita').reduce((s,e)=>s+Math.abs(e.value),0);const mo=ms.filter(e=>e.type==='Despesa').reduce((s,e)=>s+Math.abs(e.value),0);return {name:m,receita:mr,opex:mo,resultado:mr-mo}})}})}))
 },[entries])
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1500,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Rentabilidade Gerencial</h1><p>Receita • OPEX • Resultado • Margem • Centro de custo • Categoria • Mês</p></div><div className="period">2026</div></header>
  <div className="cards"><Metric title="Receita" value={brl(receita)}/><Metric title="OPEX" value={brl(opex)}/><Metric title="Resultado" value={brl(resultado)}/><Metric title="Margem" value={pct(margem)}/></div>
  <section className="panel wide"><div className="panel-title"><div><h2>Mapa de Rentabilidade</h2><span>+ expande • − recolhe • Centro de custo → Categoria → Mês</span></div><span>Base financeira única</span></div><div className="table-wrap"><table><thead><tr><th style={{textAlign:'left'}}>Dimensão</th><th>Receita</th><th>OPEX</th><th>Resultado</th><th>Margem</th></tr></thead><tbody><tr className="group-row" onClick={()=>toggle('all')} style={{cursor:'pointer'}}><td><Expand open={expanded.has('all')}/><b>Total</b></td><td>{brl(receita)}</td><td>{brl(opex)}</td><td><b>{brl(resultado)}</b></td><td><b>{pct(margem)}</b></td></tr>{expanded.has('all')&&centers.map(c=><Center key={c.name} row={c} expanded={expanded} toggle={toggle} prefix={c.name}/>)}</tbody></table></div></section>
  <div className="grid"><section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Onde está a margem</span></div><div className="note"><strong>Resultado:</strong> {brl(resultado)} sobre {brl(receita)} de receita, com margem de {pct(margem)}.<br/><br/>Use o drill-down para identificar os centros de custo e categorias que mais contribuem ou pressionam o resultado.</div></section><section className="panel"><div className="panel-title"><h2>Critério</h2><span>Governança</span></div><div className="note">Receitas são tratadas como contribuição positiva e despesas como OPEX. CAPEX e financiamentos ficam fora desta visão para evitar distorção da rentabilidade operacional.</div></section></div>
 </main>
}
function Center({row,expanded,toggle,prefix}:{row:Row;expanded:Set<string>;toggle:(k:string)=>void;prefix:string}){const open=expanded.has(prefix);return <><tr className="group-row" onClick={()=>toggle(prefix)} style={{cursor:'pointer'}}><td style={{paddingLeft:20}}><Expand open={open}/><b>{row.name}</b></td><td>{brl(row.receita)}</td><td>{brl(row.opex)}</td><td><b>{brl(row.resultado)}</b></td><td>{pct(row.receita?row.resultado/row.receita:0)}</td></tr>{open&&row.children?.map(cat=><Category key={cat.name} row={cat} expanded={expanded} toggle={toggle} prefix={`${prefix}|${cat.name}`}/>)}</>}
function Category({row,expanded,toggle,prefix}:{row:Row;expanded:Set<string>;toggle:(k:string)=>void;prefix:string}){const open=expanded.has(prefix);return <><tr className="item-row" onClick={()=>toggle(prefix)} style={{cursor:'pointer'}}><td style={{paddingLeft:48}}><Expand open={open}/>{row.name}</td><td>{brl(row.receita)}</td><td>{brl(row.opex)}</td><td>{brl(row.resultado)}</td><td>{pct(row.receita?row.resultado/row.receita:0)}</td></tr>{open&&row.children?.map(m=><tr key={m.name} className="item-row"><td style={{paddingLeft:78}}>↳ {m.name}</td><td>{brl(m.receita)}</td><td>{brl(m.opex)}</td><td>{brl(m.resultado)}</td><td>{pct(m.receita?m.resultado/m.receita:0)}</td></tr>)}</>}
function Expand({open}:{open:boolean}){return <span className="expand-btn" style={{display:'inline-grid',placeItems:'center',width:24,height:24,marginRight:8,border:'1px solid #cbd5e1',borderRadius:6,background:'#fff'}}>{open?'−':'+'}</span>}
function Metric({title,value}:{title:string;value:string}){return <div className="card"><span>{title}</span><strong>{value}</strong><small>Rentabilidade gerencial</small></div>}

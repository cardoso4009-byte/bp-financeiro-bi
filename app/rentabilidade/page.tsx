'use client'

import { useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import { buildFinancialDrilldown, type DrillNode } from '@/lib/drilldown-model'
import type { FinancialEntry } from '@/lib/lancamentos-data'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`

export default function Rentabilidade(){
 const entries=useMemo(()=>readFinancialSource().entries as FinancialEntry[],[])
 const [expanded,setExpanded]=useState<Set<string>>(new Set())
 const [selected,setSelected]=useState<FinancialEntry|null>(null)
 const toggle=(k:string)=>setExpanded(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n})
 const nodes=useMemo(()=>buildFinancialDrilldown(entries),[entries])
 const operational=entries.filter(e=>['Receita','Despesa'].includes(e.type))
 const receita=operational.filter(e=>e.type==='Receita').reduce((s,e)=>s+Math.abs(e.value),0)
 const opex=operational.filter(e=>e.type==='Despesa').reduce((s,e)=>s+Math.abs(e.value),0)
 const resultado=receita-opex, margem=receita?resultado/receita:0
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1500,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Rentabilidade Gerencial</h1><p>Receita • OPEX • Resultado • Margem • Conta • Centro de custo • Categoria • Mês</p></div><div className="period">2026</div></header>
  <div className="cards"><Metric title="Receita" value={brl(receita)}/><Metric title="OPEX" value={brl(opex)}/><Metric title="Resultado" value={brl(resultado)}/><Metric title="Margem" value={pct(margem)}/></div>
  <section className="panel wide"><div className="panel-title"><div><h2>Mapa de Rentabilidade</h2><span>+ expande • − recolhe • Conta → Centro de custo → Categoria → Mês → Lançamento</span></div><span>Base financeira única</span></div><div className="table-wrap"><table><thead><tr><th style={{textAlign:'left'}}>Dimensão</th><th>Valor</th></tr></thead><tbody>{nodes.map(n=><Node key={n.key} node={n} expanded={expanded} toggle={toggle} onSelect={setSelected}/>)}</tbody></table></div></section>
  {selected&&<section className="panel wide" style={{border:'1px solid rgba(40,168,255,.35)'}}><div className="panel-title"><div><h2>Detalhamento do lançamento</h2><span>Registro original da Base Financeira • ID {selected.id}</span></div><button onClick={()=>setSelected(null)} style={{border:0,background:'transparent',cursor:'pointer',fontSize:18}}>×</button></div><div className="grid"><Info label="Descrição" value={selected.description}/><Info label="Tipo" value={selected.type}/><Info label="Categoria" value={selected.category}/><Info label="Centro de custo" value={selected.costCenter}/><Info label="Competência" value={selected.competence}/><Info label="Vencimento" value={selected.dueDate}/><Info label="Status" value={selected.status}/><Info label="Valor" value={brl(Math.abs(selected.value))}/></div></section>}
  <div className="grid"><section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Onde está a margem</span></div><div className="note"><strong>Resultado:</strong> {brl(resultado)} sobre {brl(receita)} de receita, com margem de {pct(margem)}.<br/><br/>A hierarquia permite rastrear a rentabilidade até o lançamento original.</div></section><section className="panel"><div className="panel-title"><h2>Critério</h2><span>Governança</span></div><div className="note">Receitas são tratadas como contribuição positiva e despesas como OPEX. CAPEX e financiamentos ficam fora desta visão operacional.</div></section></div>
 </main>
}
function Node({node,expanded,toggle,onSelect,depth=0}:{node:DrillNode;expanded:Set<string>;toggle:(k:string)=>void;onSelect:(e:FinancialEntry)=>void;depth?:number}){const open=expanded.has(node.key),isEntry=node.dimension==='entry';return <><tr className={depth===0?'group-row':'item-row'} onClick={()=>isEntry?onSelect(node.entry!):toggle(node.key)} style={{cursor:'pointer'}}><td style={{paddingLeft:16+depth*28}}>{!isEntry&&<Expand open={open}/>}<span>{node.label}</span></td><td className="amount">{brl(node.value)}</td></tr>{open&&node.children.map(c=><Node key={c.key} node={c} expanded={expanded} toggle={toggle} onSelect={onSelect} depth={depth+1}/>)}</>}
function Info({label,value}:{label:string;value:string}){return <div className="note"><small>{label}</small><strong style={{display:'block',marginTop:4}}>{value}</strong></div>}
function Expand({open}:{open:boolean}){return <span className="expand-btn" style={{display:'inline-grid',placeItems:'center',width:24,height:24,marginRight:8,border:'1px solid #cbd5e1',borderRadius:6,background:'#fff'}}>{open?'−':'+'}</span>}
function Metric({title,value}:{title:string;value:string}){return <div className="card"><span>{title}</span><strong>{value}</strong><small>Rentabilidade gerencial</small></div>}

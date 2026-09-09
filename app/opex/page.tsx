'use client'
import { useEffect, useMemo, useState } from 'react'
import { initialEntries, type FinancialEntry } from '@/lib/lancamentos-data'
import { readFinancialSource } from '@/lib/financial-source'
import ReportPeriodFilter, { type ReportPeriod } from '@/components/report-period-filter'
import { REPORT_MONTHS, competence } from '@/lib/report-period'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct = (n:number) => `${n.toFixed(1).replace('.',',')}%`
type Node={key:string;label:string;value:number;children?:Node[]}

export default function Opex(){
 const [entries,setEntries]=useState<FinancialEntry[]>(initialEntries)
 const [period,setPeriod]=useState<ReportPeriod>({year:2026,month:2,view:'mensal'})
 const [expanded,setExpanded]=useState<Set<string>>(new Set())
 useEffect(()=>setEntries(readFinancialSource().entries),[])

 const opex=useMemo(()=>entries.filter(e=>e.type==='Despesa'),[entries])
 const scopeMonths=useMemo(()=>period.view==='mensal'||period.view==='comparativo'?[period.month]:Array.from({length:period.month},(_,i)=>i+1),[period])
 const scopeKeys=useMemo(()=>new Set(scopeMonths.map(m=>competence(period.year,m))),[scopeMonths,period.year])
 const scoped=useMemo(()=>opex.filter(e=>scopeKeys.has(e.competence)),[opex,scopeKeys])
 const total=scoped.reduce((s,e)=>s+Math.abs(e.value),0)
 const paid=scoped.filter(e=>e.status==='Pago').reduce((s,e)=>s+Math.abs(e.value),0)
 const open=total-paid
 const monthly=REPORT_MONTHS.map((_,i)=>opex.filter(e=>e.competence===competence(period.year,i+1)).reduce((s,e)=>s+Math.abs(e.value),0))
 const centers=useMemo(()=>group(scoped,e=>e.costCenter),[scoped])
 const categories=useMemo(()=>group(scoped,e=>e.category),[scoped])
 const selected=useMemo(()=>opex.filter(e=>e.competence===competence(period.year,period.month)),[opex,period.year,period.month])
 const selectedTotal=selected.reduce((s,e)=>s+Math.abs(e.value),0)
 const previousKey=period.month===1?competence(period.year-1,12):competence(period.year,period.month-1)
 const previousTotal=opex.filter(e=>e.competence===previousKey).reduce((s,e)=>s+Math.abs(e.value),0)
 const variance=period.view==='comparativo'?total-previousTotal:total-total*.97
 const toggle=(k:string)=>setExpanded(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n})
 const label=period.view==='mensal'?`${REPORT_MONTHS[period.month-1]}/${period.year}`:`Jan–${REPORT_MONTHS[period.month-1]}/${period.year}`
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>OPEX Gerencial</h1><p>Despesas operacionais • Centro de custo • Conta • Orçado × Realizado</p></div><ReportPeriodFilter value={period} onChange={p=>{setPeriod(p);setExpanded(new Set())}} years={[2026]}/></header>
  <div className="cards"><Card title="OPEX" value={total} sub={label}/><Card title="Pago" value={paid} sub={`${pct(total?paid/total*100:0)} do período`}/><Card title="Em aberto" value={open} sub="A pagar"/><Card title={period.view==='comparativo'?'Variação vs anterior':'Desvio'} value={variance} sub={period.view==='comparativo'?`Anterior: ${brl(previousTotal)}`:'Realizado − orçamento demonstrativo'}/></div>
  <section className="panel wide"><div className="panel-title"><div><h2>OPEX mensal</h2><span>Competência • evolução Jan–Dez</span></div><span>{brl(total)} em {label}</span></div><div className="table-wrap"><table><thead><tr><td>Mês</td>{REPORT_MONTHS.map(m=><td key={m}>{m}</td>)}<td>Total</td></tr></thead><tbody><tr><td><b>OPEX</b></td>{monthly.map((v,i)=><td key={i}>{brl(v)}</td>)}<td><b>{brl(monthly.reduce((s,v)=>s+v,0))}</b></td></tr></tbody></table></div></section>
  <div className="grid"><section className="panel"><div className="panel-title"><div><h2>Por centro de custo</h2><span>+ expande • − recolhe</span></div><span>{label}</span></div><table><thead><tr><td>Centro de custo</td><td>Valor</td><td>%</td></tr></thead><tbody>{centers.map(n=><NodeRow key={n.key} node={n} total={total} expanded={expanded} toggle={toggle}/>)}</tbody></table></section><section className="panel"><div className="panel-title"><div><h2>Por categoria</h2><span>Conta gerencial</span></div><span>{label}</span></div><table><thead><tr><td>Categoria</td><td>Valor</td><td>%</td></tr></thead><tbody>{categories.map(n=><NodeRow key={n.key} node={n} total={total} expanded={expanded} toggle={toggle}/>)}</tbody></table></section></div>
  <section className="panel wide"><div className="panel-title"><div><h2>Drill-down do mês</h2><span>{REPORT_MONTHS[period.month-1]}/{period.year} • {selected.length} lançamentos</span></div><span>{brl(selectedTotal)}</span></div><div className="table-wrap"><table><thead><tr><td>Data</td><td>Centro de custo</td><td>Categoria</td><td>Descrição</td><td>Status</td><td>Valor</td></tr></thead><tbody>{selected.length?selected.map(e=><tr key={e.id}><td>{e.date.split('-').reverse().join('/')}</td><td>{e.costCenter}</td><td>{e.category}</td><td>{e.description}</td><td>{e.status}</td><td className="negative">{brl(Math.abs(e.value))}</td></tr>):<tr><td colSpan={6}>Nenhum lançamento de OPEX na competência selecionada.</td></tr>}</tbody></table></div></section>
  {period.view==='comparativo'&&<section className="panel wide"><div className="panel-title"><div><h2>Análise Comparativa</h2><span>{REPORT_MONTHS[period.month-1]}/{period.year} × {period.month===1?`Dez/${period.year-1}`:`${REPORT_MONTHS[period.month-2]}/${period.year}`}</span></div><span>OPEX</span></div><div className="rows"><div className="row"><span>Período atual</span><b>{brl(total)}</b></div><div className="row"><span>Período anterior</span><b>{brl(previousTotal)}</b></div><div className="row"><span>Variação</span><b>{brl(variance)}</b></div></div></section>}
  <section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Controladoria</span></div><div className="note">O OPEX realizado é consolidado diretamente dos lançamentos classificados como <strong>Despesa</strong>. Mensal considera a competência selecionada; Acumulado soma janeiro até o mês escolhido; Comparativo confronta o período selecionado com o imediatamente anterior.</div></section>
 </main>
}
function group(entries:FinancialEntry[],key:(e:FinancialEntry)=>string):Node[]{const map=new Map<string,FinancialEntry[]>();entries.forEach(e=>{const k=key(e)||'Não informado';map.set(k,[...(map.get(k)||[]),e])});return Array.from(map.entries()).map(([k,items])=>({key:k,label:k,value:items.reduce((s,e)=>s+Math.abs(e.value),0),children:Array.from(new Set(items.map(e=>e.category))).map(c=>({key:`${k}::${c}`,label:c,value:items.filter(e=>e.category===c).reduce((s,e)=>s+Math.abs(e.value),0)}))})).sort((a,b)=>b.value-a.value)}
function NodeRow({node,total,expanded,toggle}:{node:Node;total:number;expanded:Set<string>;toggle:(k:string)=>void}){const open=expanded.has(node.key);return <><tr className="group-row" onClick={()=>toggle(node.key)}><td><button type="button" className="expand-btn" onClick={e=>{e.stopPropagation();toggle(node.key)}}>{open?'−':'+'}</button><b>{node.label}</b></td><td>{brl(node.value)}</td><td>{pct(total?node.value/total*100:0)}</td></tr>{open&&node.children?.map(c=><tr className="item-row" key={c.key}><td style={{paddingLeft:36}}>↳ {c.label}</td><td>{brl(c.value)}</td><td>{pct(total?c.value/total*100:0)}</td></tr>)}</>}
function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}

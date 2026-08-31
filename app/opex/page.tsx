'use client'
import {useEffect,useMemo,useState} from 'react'
import {initialEntries,type FinancialEntry} from '@/lib/lancamentos-data'
import {readFinancialSource} from '@/lib/financial-source'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${n.toFixed(1).replace('.',',')}%`
const MONTHS=['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12']
const ML=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
type Node={key:string;label:string;value:number;children?:Node[]}
export default function Opex(){
 const[entries,setEntries]=useState<FinancialEntry[]>(initialEntries),[month,setMonth]=useState('2026-02'),[expanded,setExpanded]=useState<Set<string>>(new Set())
 useEffect(()=>setEntries(readFinancialSource().entries),[])
 const opex=useMemo(()=>entries.filter(e=>e.type==='Despesa'),[entries])
 const total=opex.reduce((s,e)=>s+Math.abs(e.value),0)
 const paid=opex.filter(e=>e.status==='Pago').reduce((s,e)=>s+Math.abs(e.value),0)
 const open=total-paid
 const monthly=MONTHS.map(m=>opex.filter(e=>e.competence===m).reduce((s,e)=>s+Math.abs(e.value),0))
 const centers=useMemo(()=>group(opex,e=>e.costCenter),[opex])
 const categories=useMemo(()=>group(opex,e=>e.category),[opex])
 const selected=opex.filter(e=>e.competence===month)
 const selectedTotal=selected.reduce((s,e)=>s+Math.abs(e.value),0)
 const budget=total*.97
 const variance=total-budget
 const toggle=(k:string)=>setExpanded(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n})
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>OPEX Gerencial</h1><p>Despesas operacionais • Centro de custo • Conta • Orçado × Realizado</p></div><div style={{display:'grid',gap:6}}><span style={{fontSize:10,color:'#718098'}}>MÊS EM ANÁLISE</span><select value={month} onChange={e=>{setMonth(e.target.value);setExpanded(new Set())}} style={{padding:10,border:'1px solid #dbe1e8',borderRadius:9}}>{MONTHS.map((m,i)=><option key={m} value={m}>{ML[i]}/2026</option>)}</select></div></header>
  <div className="cards"><Card title="OPEX Total" value={total} sub="Base financeira"/><Card title="Pago" value={paid} sub={`${pct(total?paid/total*100:0)} do OPEX`}/><Card title="Em aberto" value={open} sub="A pagar"/><Card title="Desvio" value={variance} sub="Realizado − orçamento demonstrativo"/></div>
  <section className="panel wide"><div className="panel-title"><div><h2>OPEX mensal</h2><span>Competência • evolução Jan–Dez</span></div><span>{brl(total)} no período</span></div><div className="table-wrap"><table><thead><tr><td>Mês</td>{ML.map(m=><td key={m}>{m}</td>)}<td>Total</td></tr></thead><tbody><tr><td><b>OPEX</b></td>{monthly.map((v,i)=><td key={i}>{brl(v)}</td>)}<td><b>{brl(total)}</b></td></tr></tbody></table></div></section>
  <div className="grid"><section className="panel"><div className="panel-title"><div><h2>Por centro de custo</h2><span>+ expande • − recolhe</span></div><span>Realizado</span></div><table><thead><tr><td>Centro de custo</td><td>Valor</td><td>%</td></tr></thead><tbody>{centers.map(n=><NodeRow key={n.key} node={n} total={total} expanded={expanded} toggle={toggle} entries={opex} month={month}/>)}</tbody></table></section><section className="panel"><div className="panel-title"><div><h2>Por categoria</h2><span>Conta gerencial</span></div><span>Realizado</span></div><table><thead><tr><td>Categoria</td><td>Valor</td><td>%</td></tr></thead><tbody>{categories.map(n=><NodeRow key={n.key} node={n} total={total} expanded={expanded} toggle={toggle} entries={opex} month={month}/>)}</tbody></table></section></div>
  <section className="panel wide"><div className="panel-title"><div><h2>Drill-down do mês</h2><span>{ML[Number(month.slice(5))-1]}/2026 • {selected.length} lançamentos</span></div><span>{brl(selectedTotal)}</span></div><div className="table-wrap"><table><thead><tr><td>Data</td><td>Centro de custo</td><td>Categoria</td><td>Descrição</td><td>Status</td><td>Valor</td></tr></thead><tbody>{selected.length?selected.map(e=><tr key={e.id}><td>{e.date.split('-').reverse().join('/')}</td><td>{e.costCenter}</td><td>{e.category}</td><td>{e.description}</td><td>{e.status}</td><td className="negative">{brl(Math.abs(e.value))}</td></tr>):<tr><td colSpan={6}>Nenhum lançamento de OPEX na competência selecionada.</td></tr>}</tbody></table></div></section>
  <section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Controladoria</span></div><div className="note">O OPEX realizado é consolidado diretamente dos lançamentos classificados como <strong>Despesa</strong>. A estrutura permite analisar centro de custo, categoria e lançamento de origem. O orçamento mostrado nesta etapa é demonstrativo e será substituído por uma base orçamentária oficial por mês, conta e centro de custo.</div></section>
 </main>
}
function group(entries:FinancialEntry[],key:(e:FinancialEntry)=>string):Node[]{const map=new Map<string,FinancialEntry[]>();entries.forEach(e=>{const k=key(e)||'Não informado';map.set(k,[...(map.get(k)||[]),e])});return Array.from(map.entries()).map(([k,items])=>({key:k,label:k,value:items.reduce((s,e)=>s+Math.abs(e.value),0),children:Array.from(new Set(items.map(e=>e.category))).map(c=>({key:`${k}::${c}`,label:c,value:items.filter(e=>e.category===c).reduce((s,e)=>s+Math.abs(e.value),0)}))})).sort((a,b)=>b.value-a.value)}
function NodeRow({node,total,expanded,toggle,entries,month}:{node:Node;total:number;expanded:Set<string>;toggle:(k:string)=>void;entries:FinancialEntry[];month:string}){const open=expanded.has(node.key);return <><tr className="group-row" onClick={()=>toggle(node.key)}><td><button type="button" className="expand-btn" onClick={e=>{e.stopPropagation();toggle(node.key)}}>{open?'−':'+'}</button><b>{node.label}</b></td><td>{brl(node.value)}</td><td>{pct(total?node.value/total*100:0)}</td></tr>{open&&node.children?.map(c=><tr className="item-row" key={c.key}><td style={{paddingLeft:36}}>↳ {c.label}</td><td>{brl(c.value)}</td><td>{pct(total?c.value/total*100:0)}</td></tr>)}</>}
function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}

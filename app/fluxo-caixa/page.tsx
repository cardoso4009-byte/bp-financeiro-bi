'use client'
import { useMemo, useState } from 'react'
import { buildCashForecast, forecastStatus, type Scenario } from '@/lib/fluxo-caixa-projetado'
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const months=['Set','Out','Nov','Dez','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago']
type Kind='inflows'|'operatingOutflows'|'capex'|'financing'
const groups=[
 {key:'inflows' as Kind,label:'Entradas',children:['Recebimentos de clientes','Outras receitas']},
 {key:'operatingOutflows' as Kind,label:'Saídas Operacionais',children:['Pessoal','Fornecedores','Impostos','Administrativas','Comerciais']},
 {key:'capex' as Kind,label:'CAPEX',children:['Equipamentos','Obras','Tecnologia']},
 {key:'financing' as Kind,label:'Financiamentos',children:['Novos financiamentos','Amortizações','Juros']},
]
export default function FluxoCaixa(){
 const [scenario,setScenario]=useState<Scenario>('base'); const [start,setStart]=useState(0); const [end,setEnd]=useState(11); const [expanded,setExpanded]=useState<Set<string>>(new Set())
 const all=useMemo(()=>buildCashForecast(scenario),[scenario]); const rows=all.slice(start,end+1); const status=forecastStatus(rows)
 const min=Math.min(...rows.map(r=>r.closing)); const max=Math.max(...rows.map(r=>r.closing))
 const total=(field:Kind|'net')=>rows.reduce((s,r)=>s+r[field],0)
 const toggle=(key:string)=>setExpanded(prev=>{const next=new Set(prev);next.has(key)?next.delete(key):next.add(key);return next})
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1500,margin:'0 auto'}}><header><div><small>PLANEJAMENTO FINANCEIRO</small><h1>Fluxo de Caixa Gerencial</h1><p>Período de análise • Cenários • Alertas de liquidez • Drill-down</p></div><div className="period-controls"><label>Período de análise</label><div><select value={start} onChange={e=>{setStart(Number(e.target.value));setExpanded(new Set())}}>{months.map((m,i)=><option key={m} value={i}>Início: {m}</option>)}</select><select value={end} onChange={e=>setEnd(Math.max(start,Number(e.target.value)))}>{months.map((m,i)=><option key={m} value={i}>Fim: {m}</option>)}</select></div><div className="segmented">{(['base','otimista','pessimista'] as Scenario[]).map(s=><button type="button" key={s} className={scenario===s?'selected':''} onClick={()=>setScenario(s)}>{s[0].toUpperCase()+s.slice(1)}</button>)}</div></div></header>
 <div className="cards"><Card title="Caixa Inicial" value={rows[0].opening}/><Card title="Menor Caixa" value={min}/><Card title="Maior Caixa" value={max}/><Card title="Caixa Final" value={rows[rows.length-1].closing}/></div>
 <section className="panel wide"><div className="panel-title"><div><h2>Projeção mensal</h2><span>+ expande • − recolhe • Grupo → categoria → detalhe</span></div><span>{status.status}</span></div><div className="table-wrap"><table><thead><tr><th style={{textAlign:'left'}}>Conta</th>{rows.map(r=><th key={r.month}>{r.month}</th>)}<th>Total</th></tr></thead><tbody>
 <CashLine label="Caixa Inicial" values={rows.map(r=>r.opening)} bold/>
 {groups.map(g=><CashGroup key={g.key} group={g} rows={rows} expanded={expanded} toggle={toggle} total={total}/>) }
 <CashLine label="Variação de Caixa" values={rows.map(r=>r.net)} bold/>
 <CashLine label="Caixa Final" values={rows.map(r=>r.closing)} bold totalOverride={rows[rows.length-1].closing}/>
 </tbody></table></div></section>
 <div className="grid"><section className="panel"><div className="panel-title"><h2>Diagnóstico</h2><span>{status.status}</span></div><div className="note"><strong>{status.title}</strong><p>{status.detail}</p><p>Caixa mínimo: <strong>{brl(rows[0].minimum)}</strong>.</p></div></section><section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Decisão</span></div><div className="rows"><div className="row"><span>Entradas projetadas</span><b>{brl(total('inflows'))}</b></div><div className="row"><span>Saídas operacionais</span><b>{brl(total('operatingOutflows'))}</b></div><div className="row"><span>CAPEX</span><b>{brl(total('capex'))}</b></div><div className="row"><span>Variação acumulada</span><b>{brl(rows[rows.length-1].closing-rows[0].opening)}</b></div></div></section></div>
 <section className="panel"><div className="panel-title"><h2>Alavancas de caixa</h2><span>Consultoria</span></div><div className="note">Use os cenários para testar recebimentos, custos, CAPEX e financiamentos. Próximo refinamento: conectar PMR, PME e PMP do Capital de Giro ao impacto automático nesta projeção.</div></section></main>
}
function CashGroup({group,rows,expanded,toggle,total}:{group:{key:Kind;label:string;children:string[]};rows:any[];expanded:Set<string>;toggle:(key:string)=>void;total:(field:Kind|'net')=>number}){const open=expanded.has(group.key);const vals=rows.map(r=>group.key==='operatingOutflows'||group.key==='capex'?-r[group.key]:r[group.key]);return <><tr className="group-row" onClick={()=>toggle(group.key)} style={{cursor:'pointer'}}><td><ExpandIcon open={open} onClick={()=>toggle(group.key)} label={group.label}/><b>{group.label}</b></td>{vals.map(r=><td key={Math.random()}>{brl(r)}</td>)}<td><b>{brl(vals.reduce((s:number,v:number)=>s+v,0))}</b></td></tr>{open&&group.children.map((child,i)=><tr key={child} className="item-row"><td style={{paddingLeft:34}}>↳ {child}</td>{vals.map((v,j)=><td key={j} style={{color:'#667085'}}>{brl(v*(i===0?0.52:i===1?0.18:i===2?0.12:i===3?0.10:0.08))}</td>)}<td>—</td></tr>)}</>}
function ExpandIcon({open,onClick,label}:{open:boolean;onClick:()=>void;label:string}){return <button type="button" className="expand-btn" aria-label={open?`Recolher ${label}`:`Expandir ${label}`} onClick={e=>{e.stopPropagation();onClick()}}>{open?'−':'+'}</button>}
function CashLine({label,values,bold,totalOverride}:{label:string;values:number[];bold?:boolean;totalOverride?:number}){const total=totalOverride??values.reduce((s,v)=>s+v,0);return <tr><td>{bold?<b>{label}</b>:label}</td>{values.map((v,i)=><td key={i}>{bold?<b>{brl(v)}</b>:brl(v)}</td>)}<td>{bold?<b>{brl(total)}</b>:brl(total)}</td></tr>}
function Card({title,value}:{title:string,value:number}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>projeção</small></div>}

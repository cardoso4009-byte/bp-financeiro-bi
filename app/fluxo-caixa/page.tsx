'use client'
import { useMemo, useState } from 'react'
import { buildCashForecast, forecastStatus, type Scenario } from '@/lib/fluxo-caixa-projetado'
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const months=['Set','Out','Nov','Dez','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago']
export default function FluxoCaixa(){
 const [scenario,setScenario]=useState<Scenario>('base'); const [start,setStart]=useState(0); const [end,setEnd]=useState(11)
 const all=useMemo(()=>buildCashForecast(scenario),[scenario]); const rows=all.slice(start,end+1); const status=forecastStatus(rows)
 const min=Math.min(...rows.map(r=>r.closing)); const max=Math.max(...rows.map(r=>r.closing))
 const total=(field:'inflows'|'operatingOutflows'|'capex'|'financing'|'net')=>rows.reduce((s,r)=>s+r[field],0)
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1500,margin:'0 auto'}}><header><div><small>PLANEJAMENTO FINANCEIRO</small><h1>Fluxo de Caixa Projetado</h1><p>Período de análise • Cenários • Alertas de liquidez</p></div><div className="period-controls"><label>Período de análise</label><div><select value={start} onChange={e=>setStart(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i}>Início: {m}</option>)}</select><select value={end} onChange={e=>setEnd(Math.max(start,Number(e.target.value)))}>{months.map((m,i)=><option key={m} value={i}>Fim: {m}</option>)}</select></div><div className="segmented">{(['base','otimista','pessimista'] as Scenario[]).map(s=><button key={s} className={scenario===s?'selected':''} onClick={()=>setScenario(s)}>{s[0].toUpperCase()+s.slice(1)}</button>)}</div></div></header>
 <div className="cards"><Card title="Caixa Inicial" value={rows[0].opening}/><Card title="Menor Caixa" value={min}/><Card title="Maior Caixa" value={max}/><Card title="Caixa Final" value={rows[rows.length-1].closing}/></div>
 <section className="panel wide"><div className="panel-title"><h2>Projeção mensal</h2><span>{status.status}</span></div><div className="table-wrap"><table><thead><tr><th style={{textAlign:'left'}}>Conta</th>{rows.map(r=><th key={r.month}>{r.month}</th>)}<th>Total</th></tr></thead><tbody>
 <tr><td><b>Caixa Inicial</b></td>{rows.map(r=><td key={r.month}>{brl(r.opening)}</td>)}<td>—</td></tr>
 <tr><td><b>Entradas</b></td>{rows.map(r=><td key={r.month}>{brl(r.inflows)}</td>)}<td><b>{brl(total('inflows'))}</b></td></tr>
 <tr><td><b>Saídas Operacionais</b></td>{rows.map(r=><td key={r.month}>{brl(-r.operatingOutflows)}</td>)}<td><b>{brl(-total('operatingOutflows'))}</b></td></tr>
 <tr><td><b>CAPEX</b></td>{rows.map(r=><td key={r.month}>{brl(-r.capex)}</td>)}<td><b>{brl(-total('capex'))}</b></td></tr>
 <tr><td><b>Financiamentos</b></td>{rows.map(r=><td key={r.month}>{brl(r.financing)}</td>)}<td><b>{brl(total('financing'))}</b></td></tr>
 <tr><td><b>Variação</b></td>{rows.map(r=><td key={r.month}><b>{brl(r.net)}</b></td>)}<td><b>{brl(total('net'))}</b></td></tr>
 <tr><td><b>Caixa Final</b></td>{rows.map(r=><td key={r.month}><b>{brl(r.closing)}</b></td>)}<td><b>{brl(rows[rows.length-1].closing)}</b></td></tr>
 </tbody></table></div></section>
 <div className="grid"><section className="panel"><div className="panel-title"><h2>Diagnóstico</h2><span>{status.status}</span></div><div className="note"><strong>{status.title}</strong><p>{status.detail}</p><p>Caixa mínimo: <strong>{brl(rows[0].minimum)}</strong>.</p></div></section><section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Decisão</span></div><div className="rows"><div className="row"><span>Entradas projetadas</span><b>{brl(total('inflows'))}</b></div><div className="row"><span>Saídas operacionais</span><b>{brl(total('operatingOutflows'))}</b></div><div className="row"><span>CAPEX</span><b>{brl(total('capex'))}</b></div><div className="row"><span>Variação acumulada</span><b>{brl(rows[rows.length-1].closing-rows[0].opening)}</b></div></div></section></div>
 <section className="panel"><div className="panel-title"><h2>Alavancas de caixa</h2><span>Consultoria</span></div><div className="note">Use os cenários para testar recebimentos, custos, CAPEX e financiamentos. O próximo refinamento conectará PMR, PME e PMP do Capital de Giro ao impacto automático nesta projeção.</div></section></main>
}
function Card({title,value}:{title:string,value:number}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>projeção</small></div>}

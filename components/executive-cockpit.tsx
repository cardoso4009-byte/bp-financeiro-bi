'use client'

import { useMemo, useState } from 'react'
import { calculateFinancialIndicators } from '@/lib/financial-indicators'
import { buildExecutiveCockpit } from '@/lib/executive-cockpit'
import { readFinancialSource } from '@/lib/financial-source'
import { monthlyBalance } from '@/lib/monthly-data'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`
const ratio=(n:number)=>n.toFixed(2).replace('.',',')

export default function ExecutiveCockpit(){
 const [monthIndex,setMonthIndex]=useState(monthlyBalance.length-1)
 const source=useMemo(()=>readFinancialSource(),[])
 const gerencial=useMemo(()=>calculateFinancialIndicators(source.entries).indicators,[source.entries])
 const cockpit=useMemo(()=>buildExecutiveCockpit(monthIndex,gerencial),[monthIndex,gerencial])
 const critical=cockpit.priorities.filter(p=>p.severity==='critical').length
 const attention=cockpit.priorities.filter(p=>p.severity==='attention').length
 const status=critical?'Ação imediata':attention?'Atenção gerencial':'Cenário favorável'
 return <section className="executive-cockpit">
  <style>{`
   .executive-cockpit{margin:20px 0 24px;padding:18px;border:1px solid rgba(84,119,158,.25);border-radius:16px;background:linear-gradient(135deg,rgba(10,30,51,.96),rgba(8,22,38,.98));box-shadow:0 14px 35px rgba(0,0,0,.16)}
   .cockpit-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:16px}.cockpit-kicker{display:block;color:#6fb8ff;font-size:10px;font-weight:800;letter-spacing:.12em;margin-bottom:5px}.cockpit-head h2{margin:0;color:#fff;font-size:20px}.cockpit-head p{margin:5px 0 0;color:#91a7bd;font-size:12px}.cockpit-controls{display:flex;align-items:center;gap:10px}.cockpit-controls select{background:#0d2137;color:#fff;border:1px solid #35526f;border-radius:8px;padding:8px 11px;font-size:12px}.cockpit-status{padding:8px 11px;border-radius:8px;background:rgba(40,168,255,.12);border:1px solid rgba(40,168,255,.25);color:#b9dcff;font-size:11px;font-weight:800;white-space:nowrap}
   .cockpit-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.cockpit-kpi{padding:13px;border:1px solid rgba(84,119,158,.22);border-radius:11px;background:rgba(13,34,56,.72)}.cockpit-kpi span{display:block;color:#8da3b9;font-size:10px;margin-bottom:7px}.cockpit-kpi strong{display:block;color:#fff;font-size:17px;line-height:1.15}.cockpit-kpi small{display:block;color:#6f8ba5;font-size:10px;margin-top:5px}
   .cockpit-body{display:grid;grid-template-columns:1.15fr .85fr;gap:12px;margin-top:12px}.cockpit-panel{padding:14px;border:1px solid rgba(84,119,158,.2);border-radius:11px;background:rgba(10,28,47,.7)}.cockpit-panel-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.cockpit-panel-title strong{color:#fff;font-size:12px}.cockpit-panel-title span{color:#6f8ba5;font-size:10px}.priority{padding:10px 0;border-top:1px solid rgba(84,119,158,.15)}.priority:first-of-type{border-top:0;padding-top:0}.priority-title{display:flex;justify-content:space-between;gap:10px;align-items:center}.priority-title strong{color:#e9f1f8;font-size:11px}.badge{font-size:9px;font-weight:800;padding:3px 6px;border-radius:5px;text-transform:uppercase}.badge.critical{color:#ffb4b4;background:rgba(220,65,65,.14)}.badge.attention{color:#ffd58a;background:rgba(220,155,45,.14)}.badge.positive{color:#a7f3c7;background:rgba(40,190,115,.14)}.priority p{margin:5px 0 0;color:#8ea4b9;font-size:10px;line-height:1.45}.priority em{display:block;margin-top:4px;color:#bcd1e4;font-style:normal;font-size:10px}.cockpit-reading{display:grid;grid-template-columns:1fr 1fr;gap:8px}.reading{padding:10px;border-radius:9px;background:rgba(18,43,69,.62)}.reading span{display:block;color:#7692ac;font-size:9px}.reading strong{display:block;color:#fff;font-size:13px;margin-top:4px}
   @media(max-width:1050px){.cockpit-kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:750px){.cockpit-head,.cockpit-controls{display:block}.cockpit-controls{margin-top:12px}.cockpit-controls select{width:100%}.cockpit-status{display:inline-block;margin-top:8px}.cockpit-body{grid-template-columns:1fr}.cockpit-kpis{grid-template-columns:repeat(2,1fr)}}
  `}</style>
  <div className="cockpit-head"><div><span className="cockpit-kicker">COCKPIT DO CEO / CONTROLADORIA</span><h2>O que precisa da atenção da gestão?</h2><p>Leitura consolidada de resultado, caixa, patrimônio e capital de giro.</p></div><div className="cockpit-controls"><select value={monthIndex} onChange={e=>setMonthIndex(Number(e.target.value))} aria-label="Competência do cockpit">{monthlyBalance.map((m,i)=><option key={m.month} value={i}>{m.month}</option>)}</select><span className="cockpit-status">{status}</span></div></div>
  <div className="cockpit-kpis">
   <Kpi label="Receita líquida" value={brl(cockpit.revenue)} sub="competência"/><Kpi label="EBITDA" value={brl(cockpit.ebitda)} sub={`margem ${pct(cockpit.ebitdaMargin)}`}/><Kpi label="Lucro líquido" value={brl(cockpit.netIncome)} sub="resultado"/><Kpi label="Caixa final" value={brl(cockpit.closingCash)} sub="posição mensal"/><Kpi label="Capital de giro" value={brl(cockpit.workingCapital)} sub="AC − PC"/><Kpi label="Liquidez corrente" value={ratio(cockpit.currentRatio)} sub={`endividamento ${pct(cockpit.debtRatio)}`}/>
  </div>
  <div className="cockpit-body">
   <div className="cockpit-panel"><div className="cockpit-panel-title"><strong>Prioridades executivas</strong><span>{critical} críticas • {attention} em atenção</span></div>{cockpit.priorities.length?cockpit.priorities.map(p=><div className="priority" key={p.title}><div className="priority-title"><strong>{p.title}</strong><span className={`badge ${p.severity}`}>{p.severity==='critical'?'Crítico':p.severity==='attention'?'Atenção':'Positivo'}</span></div><p>{p.signal}</p><em>→ {p.action}</em></div>):<p style={{color:'#91a7bd',fontSize:11}}>Nenhuma prioridade identificada na base atual.</p>}</div>
   <div className="cockpit-panel"><div className="cockpit-panel-title"><strong>Leitura rápida</strong><span>{cockpit.month}</span></div><div className="cockpit-reading"><Reading label="NCG" value={brl(cockpit.ncg)}/><Reading label="Liquidez" value={ratio(cockpit.currentRatio)}/><Reading label="EBITDA" value={pct(cockpit.ebitdaMargin)}/><Reading label="Dívida / Ativo" value={pct(cockpit.debtRatio)}/></div><p style={{margin:'12px 0 0',color:'#7891a9',fontSize:10,lineHeight:1.5}}>Use esta camada para decidir onde agir primeiro. O detalhe permanece disponível nos módulos de DRE, caixa, capital de giro e indicadores.</p></div>
  </div>
 </section>
}
function Kpi({label,value,sub}:{label:string;value:string;sub:string}){return <div className="cockpit-kpi"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>}
function Reading({label,value}:{label:string;value:string}){return <div className="reading"><span>{label}</span><strong>{value}</strong></div>}

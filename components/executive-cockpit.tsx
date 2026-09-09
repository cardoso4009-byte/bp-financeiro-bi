'use client'

import { useMemo, useState } from 'react'
import { calculateFinancialIndicators } from '@/lib/financial-indicators'
import { buildExecutiveCockpit } from '@/lib/executive-cockpit'
import { readFinancialSource } from '@/lib/financial-source'
import { monthlyBalance } from '@/lib/monthly-data'
import { readActionPlan } from '@/lib/action-plan-store'
import { DEFAULT_REPORT_PERIOD, ReportPeriodFilter } from '@/components/report-period-filter'
import type { ReportPeriod } from '@/lib/report-period'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`
const ratio=(n:number)=>n.toFixed(2).replace('.',',')

export default function ExecutiveCockpit(){
 const [period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,month:monthlyBalance.length})
 const source=useMemo(()=>readFinancialSource(),[])
 const gerencial=useMemo(()=>calculateFinancialIndicators(source.entries).indicators,[source.entries])
 const monthIndex=Math.max(0,Math.min(period.month-1,monthlyBalance.length-1))
 const cockpit=useMemo(()=>buildExecutiveCockpit(monthIndex,gerencial,period.view),[monthIndex,gerencial,period.view])
 const previousIndex=monthIndex>0?monthIndex-1:0
 const previous=useMemo(()=>buildExecutiveCockpit(previousIndex,gerencial,'mensal'),[previousIndex,gerencial])
 const plan=useMemo(()=>readActionPlan(),[])
 const openActions=plan.filter(a=>a.status==='Pendente'||a.status==='Em andamento').length
 const criticalActions=plan.filter(a=>(a.priority==='Crítica'||a.priority==='Alta')&&(a.status==='Pendente'||a.status==='Em andamento')).length
 const critical=cockpit.priorities.filter(p=>p.severity==='critical').length
 const attention=cockpit.priorities.filter(p=>p.severity==='attention').length
 const status=critical?'Ação imediata':attention?'Atenção gerencial':'Cenário favorável'
 const delta=(current:number,prior:number)=>prior===0?'—':`${((current-prior)/Math.abs(prior)*100).toFixed(1).replace('.',',')}%`
 return <section className="executive-cockpit">
  <style>{`
   .executive-cockpit{margin:4px 0 28px;padding:22px;border:1px solid #dbe5ef;border-radius:18px;background:linear-gradient(145deg,#0a2037 0%,#0d2945 58%,#102f4d 100%);box-shadow:0 16px 36px rgba(13,35,58,.14);position:relative;overflow:hidden}
   .executive-cockpit:after{content:'';position:absolute;right:-90px;top:-100px;width:260px;height:260px;border-radius:50%;background:rgba(68,180,255,.07);pointer-events:none}
   .cockpit-head{display:flex;justify-content:space-between;align-items:flex-start;gap:22px;margin-bottom:18px;position:relative;z-index:1}
   .cockpit-kicker{display:block;color:#75c4ff;font-size:10px;font-weight:850;letter-spacing:.14em;margin-bottom:7px}
   .cockpit-head h2{margin:0;color:#fff;font-size:21px;letter-spacing:-.02em}
   .cockpit-head p{margin:6px 0 0;color:#9db2c7;font-size:12px}
   .cockpit-controls{display:flex;align-items:center;gap:9px;min-width:420px;justify-content:flex-end}
   .cockpit-controls .report-period-filter{margin:0}
   .cockpit-status{padding:9px 12px;border-radius:9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#d9edff;font-size:10px;font-weight:850;white-space:nowrap}
   .cockpit-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;position:relative;z-index:1}
   .cockpit-kpi{padding:14px;border:1px solid rgba(143,190,225,.16);border-radius:12px;background:rgba(6,23,40,.48);min-width:0}
   .cockpit-kpi span{display:block;color:#91a9bf;font-size:9px;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
   .cockpit-kpi strong{display:block;color:#fff;font-size:17px;line-height:1.15;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
   .cockpit-kpi small{display:block;color:#6f8ca5;font-size:9px;margin-top:6px}
   .cockpit-body{display:grid;grid-template-columns:1.35fr .65fr;gap:10px;margin-top:10px;position:relative;z-index:1}
   .cockpit-panel{padding:15px;border:1px solid rgba(143,190,225,.14);border-radius:12px;background:rgba(6,23,40,.38);min-width:0}
   .cockpit-panel-title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:11px}
   .cockpit-panel-title strong{color:#fff;font-size:11px}
   .cockpit-panel-title span{color:#718da5;font-size:9px;white-space:nowrap}
   .priority{padding:10px 0;border-top:1px solid rgba(143,190,225,.11)}
   .priority:first-of-type{border-top:0;padding-top:0}
   .priority-title{display:flex;justify-content:space-between;gap:10px;align-items:center}
   .priority-title strong{color:#edf5fb;font-size:10px}
   .badge{font-size:8px;font-weight:850;padding:3px 6px;border-radius:5px;text-transform:uppercase;letter-spacing:.03em}
   .badge.critical{color:#ffbaba;background:rgba(220,65,65,.15)}
   .badge.attention{color:#ffda94;background:rgba(220,155,45,.15)}
   .badge.positive{color:#adf3ca;background:rgba(40,190,115,.15)}
   .priority p{margin:5px 0 0;color:#8da6bc;font-size:9px;line-height:1.45}
   .priority em{display:block;margin-top:4px;color:#c0d7e9;font-style:normal;font-size:9px}
   .cockpit-reading{display:grid;grid-template-columns:1fr 1fr;gap:7px}
   .reading{padding:11px;border-radius:9px;background:rgba(22,52,80,.48);border:1px solid rgba(143,190,225,.08)}
   .reading span{display:block;color:#7894ab;font-size:8px}
   .reading strong{display:block;color:#fff;font-size:13px;margin-top:5px}
   .plan-link{display:inline-flex;margin-top:10px;color:#91d2ff;font-size:9px;font-weight:850;text-decoration:none}
   .plan-link:hover{text-decoration:underline}
   .cockpit-note{margin:9px 0 0;color:#7891a9;font-size:9px;line-height:1.45}
   @media(max-width:1100px){.cockpit-kpis{grid-template-columns:repeat(3,1fr)}.cockpit-controls{min-width:0;flex-wrap:wrap}}
   @media(max-width:760px){.executive-cockpit{padding:16px}.cockpit-head{display:block}.cockpit-controls{margin-top:12px;display:block}.cockpit-status{margin-top:8px;text-align:center}.cockpit-body{grid-template-columns:1fr}.cockpit-kpis{grid-template-columns:repeat(2,1fr)}}
  `}</style>
  <div className="cockpit-head"><div><span className="cockpit-kicker">COCKPIT DO CEO / CONTROLADORIA</span><h2>O que precisa da atenção da gestão?</h2><p>Leitura consolidada de resultado, caixa, patrimônio e capital de giro.</p></div><div className="cockpit-controls"><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]} /><span className="cockpit-status">{status}</span></div></div>
  <div className="cockpit-kpis">
   <Kpi label="Receita líquida" value={brl(cockpit.revenue)} sub={period.view==='acumulado'?'acumulado no ano':'competência'}/><Kpi label="EBITDA" value={brl(cockpit.ebitda)} sub={`margem ${pct(cockpit.ebitdaMargin)}`}/><Kpi label="Lucro líquido" value={brl(cockpit.netIncome)} sub={period.view==='acumulado'?'acumulado no ano':'resultado'}/><Kpi label="Caixa final" value={brl(cockpit.closingCash)} sub="posição mensal"/><Kpi label="Capital de giro" value={brl(cockpit.workingCapital)} sub="AC − PC"/><Kpi label="Liquidez corrente" value={ratio(cockpit.currentRatio)} sub={`endividamento ${pct(cockpit.debtRatio)}`}/>
  </div>
  {period.view==='comparativo' && <p className="cockpit-note">Comparativo: os indicadores de resultado são confrontados com a competência anterior; caixa, capital de giro, liquidez e endividamento permanecem como posição de fechamento.</p>}
  <div className="cockpit-body">
   <div className="cockpit-panel"><div className="cockpit-panel-title"><strong>Prioridades executivas</strong><span>{critical} críticas • {attention} em atenção</span></div>{cockpit.priorities.length?cockpit.priorities.map(p=><div className="priority" key={p.title}><div className="priority-title"><strong>{p.title}</strong><span className={`badge ${p.severity}`}>{p.severity==='critical'?'Crítico':p.severity==='attention'?'Atenção':'Positivo'}</span></div><p>{p.signal}</p><em>→ {p.action}</em></div>):<p style={{color:'#91a7bd',fontSize:11}}>Nenhuma prioridade identificada na base atual.</p>}<a className="plan-link" href="/plano-acao">→ Abrir plano de ação ({openActions} abertas{criticalActions?`, ${criticalActions} críticas/altas`:''})</a></div>
   <div className="cockpit-panel"><div className="cockpit-panel-title"><strong>Leitura rápida</strong><span>{cockpit.month}</span></div><div className="cockpit-reading"><Reading label="NCG" value={brl(cockpit.ncg)}/><Reading label="Liquidez" value={ratio(cockpit.currentRatio)}/><Reading label="EBITDA" value={pct(cockpit.ebitdaMargin)}/><Reading label="Dívida / Ativo" value={pct(cockpit.debtRatio)}/></div>{period.view==='comparativo' && <p className="cockpit-note">Receita: {delta(cockpit.revenue,previous.revenue)} • EBITDA: {delta(cockpit.ebitda,previous.ebitda)} • Lucro: {delta(cockpit.netIncome,previous.netIncome)}</p>}<p style={{margin:'12px 0 0',color:'#7891a9',fontSize:10,lineHeight:1.5}}>Use esta camada para decidir onde agir primeiro. O detalhe permanece disponível nos módulos de DRE, caixa, capital de giro e indicadores.</p></div>
  </div>
 </section>
}
function Kpi({label,value,sub}:{label:string;value:string;sub:string}){return <div className="cockpit-kpi"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>}
function Reading({label,value}:{label:string;value:string}){return <div className="reading"><span>{label}</span><strong>{value}</strong></div>}

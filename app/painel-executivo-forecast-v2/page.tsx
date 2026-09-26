'use client'

import { useMemo, useState } from 'react'
import { ReportPeriodFilter, DEFAULT_REPORT_PERIOD } from '@/components/report-period-filter'
import { competence } from '@/lib/report-period'
import { buildV2FinancialBase } from '@/lib/v2-financial-base'
import { buildV2ForecastReport, type V2ForecastEntry } from '@/lib/v2-forecast'
import { readV2BrowserStore } from '@/lib/v2-browser-storage'
import { readV2BudgetEntries } from '@/lib/v2-budget-storage'
import { readV2CostCenters } from '@/lib/v2-cost-center-storage'
import { readV2ForecastEntries } from '@/lib/v2-forecast-storage'
import { buildForecastManagementAlerts, type V2ManagementAction, type V2ManagementAlert } from '@/lib/v2-management'
import { readV2ManagementActions, readV2ManagementAlerts } from '@/lib/v2-management-storage'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number|undefined)=>n===undefined?'—':`${(n*100).toFixed(1).replace('.',',')}%`
const periods=Array.from({length:12},(_,i)=>`2026-${String(i+1).padStart(2,'0')}`)

export default function PainelExecutivoForecastV2(){
 const [period,setPeriod]=useState({...DEFAULT_REPORT_PERIOD,month:12})
 const base=useMemo(()=>buildV2FinancialBase(readV2BrowserStore().entries),[])
 const budget=useMemo(()=>readV2BudgetEntries(),[])
 const centers=useMemo(()=>readV2CostCenters(),[])
 const forecast=useMemo<V2ForecastEntry[]>(()=>readV2ForecastEntries(),[])
 const savedAlerts=useMemo<V2ManagementAlert[]>(()=>readV2ManagementAlerts(),[])
 const actions=useMemo<V2ManagementAction[]>(()=>readV2ManagementActions(),[])
 const cutoff=competence(period.year,period.month)
 const report=useMemo(()=>buildV2ForecastReport(base,budget,forecast,centers,cutoff,periods),[base,budget,forecast,centers,cutoff])
 const alerts=useMemo(()=>buildForecastManagementAlerts(report.lines).map(a=>{const saved=savedAlerts.find(x=>x.id===a.id);return saved?{...a,causeType:saved.causeType,causeNote:saved.causeNote,actionIds:saved.actionIds,createdAt:saved.createdAt,updatedAt:saved.updatedAt}:a}),[report.lines,savedAlerts])
 const critical=alerts.filter(a=>a.level==='critico')
 const attention=alerts.filter(a=>a.level==='atencao')
 const openActions=actions.filter(a=>!['concluida','cancelada'].includes(a.status))
 const actionAlertIds=new Set(openActions.map(a=>a.alertId))
 const alertsWithAction=alerts.filter(a=>actionAlertIds.has(a.id))
 const impactWithAction=alertsWithAction.reduce((s,a)=>s+Math.abs(a.variance),0)
 const receita=report.lines.filter(l=>l.movementClass==='receita').reduce((s,l)=>s+l.forecast,0)
 const opex=report.lines.filter(l=>l.movementClass==='opex').reduce((s,l)=>s+l.forecast,0)
 const custos=report.lines.filter(l=>l.movementClass==='custo').reduce((s,l)=>s+l.forecast,0)
 const financeiro=report.lines.filter(l=>l.movementClass==='financeiro').reduce((s,l)=>s+l.forecast,0)
 const impostos=report.lines.filter(l=>l.movementClass==='imposto').reduce((s,l)=>s+l.forecast,0)
 const resultado=receita+opex+custos+financeiro+impostos
 const byPeriod=periods.map(p=>{const ls=report.lines.filter(l=>l.period===p);return {period:p,budget:ls.reduce((s,l)=>s+l.budget,0),actual:ls.reduce((s,l)=>s+l.actual,0),forecast:ls.reduce((s,l)=>s+l.forecast,0),status:p<=cutoff?'realizado':'projetado'}})
 const mainDeviations=[...report.lines].filter(l=>l.status==='projetado').sort((a,b)=>Math.abs(b.budgetVariance)-Math.abs(a.budgetVariance)).slice(0,8)
 return <main className="page">
  <style>{`.page{max-width:1500px;margin:auto;padding:28px;font-family:Arial,sans-serif;color:#10243b;background:#f4f7fb;min-height:100vh}.head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:20px}.eyebrow{font-size:11px;color:#6c8298;font-weight:800;letter-spacing:.1em}.head h1{margin:6px 0;font-size:30px}.head p{margin:0;color:#6c8298}.filter{background:#fff;border:1px solid #dce6f0;border-radius:12px;padding:10px 14px}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:14px}.card,.panel{background:#fff;border:1px solid #dce6f0;border-radius:14px}.card{padding:17px}.card span{display:block;color:#70869c;font-size:12px}.card strong{display:block;font-size:23px;margin-top:7px}.card small{display:block;margin-top:5px;color:#8094a8}.grid{display:grid;grid-template-columns:1.35fr .65fr;gap:14px;margin-bottom:14px}.panel{padding:20px}.panel h2{margin:0;font-size:17px}.panel-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.panel-title span{font-size:11px;color:#7b8fa4}.row{display:grid;grid-template-columns:1.4fr .8fr .8fr .8fr .65fr;gap:10px;padding:10px 0;border-top:1px solid #edf1f5;align-items:center;font-size:12px}.row b{text-align:right}.badge{justify-self:end;padding:5px 8px;border-radius:999px;font-weight:800;font-size:10px}.badge.critical{background:#ffe4e4;color:#b42318}.badge.attention{background:#fff0cc;color:#8a5b00}.badge.normal{background:#e5f7ec;color:#18794e}.bars{display:flex;gap:4px;align-items:flex-end;height:180px}.barcol{flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:3px;height:100%}.bar{min-height:2px;border-radius:4px 4px 0 0;background:#6b8eae}.bar.actual{background:#9fb2c4}.bar.forecast{background:#244b70}.bar-label{font-size:9px;text-align:center;color:#71869a}.legend{display:flex;gap:14px;font-size:10px;color:#70869c;margin-top:8px}.legend i{display:inline-block;width:10px;height:10px;border-radius:2px;background:#6b8eae;margin-right:4px}.legend i.a{background:#9fb2c4}.legend i.f{background:#244b70}.note{padding:12px;border-radius:10px;background:#f7f9fc;border:1px solid #e4ebf2;font-size:12px;color:#536b80}.critical-list{display:grid;gap:8px}.critical-item{padding:10px;border-left:4px solid #d64545;background:#fff7f7;border-radius:7px;font-size:12px}.critical-item small{display:block;color:#71869a;margin-top:4px}.action{padding:9px 0;border-top:1px solid #edf1f5;font-size:12px}.action small{display:block;color:#71869a;margin-top:3px}.wide{margin-bottom:14px}@media(max-width:1050px){.cards{grid-template-columns:repeat(3,1fr)}.grid{grid-template-columns:1fr}}@media(max-width:650px){.page{padding:16px}.cards{grid-template-columns:1fr 1fr}.row{grid-template-columns:1fr 1fr}.row>:nth-child(n+3){display:none}}`}</style>
  <header className="head"><div><div className="eyebrow">CONTROLADORIA GERENCIAL V2</div><h1>Painel Executivo de Forecast</h1><p>Receita • OPEX • Resultado • Orçado × Forecast • Alertas • Ações</p></div><div className="filter"><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/></div></header>
  <section className="cards">
   <Metric label="Receita Forecast" value={receita} sub="Projeção anual"/><Metric label="OPEX Forecast" value={opex} sub="Despesas operacionais"/><Metric label="Custos Forecast" value={custos} sub="Custos operacionais"/><Metric label="Resultado Forecast" value={resultado} sub="Resultado projetado"/><Metric label="Gap Orçado × Forecast" value={report.budgetGap} sub="Desvio acumulado"/>
  </section>
  <section className="cards">
   <Metric label="Forecast × Realizado" value={report.forecastGap} sub="Diferença no período de corte"/><Metric label="Alertas críticos" value={critical.length} currency={false} sub="Projeções acima do limite"/><Metric label="Alertas em atenção" value={attention.length} currency={false} sub="Monitoramento"/><Metric label="Ações abertas" value={openActions.length} currency={false} sub="Em acompanhamento"/><Metric label="Impacto dos alertas com ação" value={impactWithAction} sub="Valor dos desvios vinculados"/>
  </section>
  <section className="grid">
   <div className="panel"><div className="panel-title"><h2>Visão mensal</h2><span>Orçado × Realizado × Forecast • corte {cutoff}</span></div>
    <div className="bars">{byPeriod.map(x=>{const max=Math.max(...byPeriod.map(y=>Math.abs(y.forecast)),1);const h=Math.max(3,Math.round(Math.abs(x.forecast)/max*135));return <div className="barcol" key={x.period}><div className="bar forecast" style={{height:h}} title={`Forecast ${brl(x.forecast)}`}/><div className="bar actual" style={{height:Math.max(2,Math.round(Math.abs(x.actual)/max*30))}} title={`Realizado ${brl(x.actual)}`}/><div className="bar-label">{x.period.slice(5)}</div></div>})}</div>
    <div className="legend"><span><i className="f"/>Forecast</span><span><i className="a"/>Realizado</span></div>
   </div>
   <div className="panel"><div className="panel-title"><h2>Alertas críticos</h2><span>{critical.length} itens</span></div>{critical.length?<div className="critical-list">{critical.slice(0,6).map(a=><div className="critical-item" key={a.id}><b>{a.label}</b><small>{a.period} • desvio {brl(a.variance)} • {pct(a.variancePercent)}</small></div>)}</div>:<div className="note">Nenhum alerta crítico nas competências projetadas.</div>}</div>
  </section>
  <section className="panel wide"><div className="panel-title"><h2>Principais desvios projetados</h2><span>Ordenados pelo valor absoluto do desvio</span></div>
   <div className="row" style={{fontWeight:800}}><span>DIMENSÃO</span><span>ORÇADO</span><span>FORECAST</span><span>DESVIO</span><span>GAP %</span></div>
   {mainDeviations.map((l,i)=><div className="row" key={`${l.period}-${l.costCenterId??'sem'}-${l.movementClass}-${i}`}><span>{l.period} • {l.costCenterCode} • {l.movementClass}</span><span>{brl(l.budget)}</span><span>{brl(l.forecast)}</span><span>{brl(l.budgetVariance)}</span><b>{pct(l.budgetVariancePercent)}</b></div>)}
   {!mainDeviations.length&&<p>Nenhuma competência futura com forecast informado.</p>}
  </section>
  <section className="grid">
   <div className="panel"><div className="panel-title"><h2>Ações em acompanhamento</h2><span>{openActions.length} abertas</span></div>{openActions.slice(0,8).map(a=><div className="action" key={a.id}><b>{a.description}</b><small>{a.owner??'Sem responsável'} • {a.dueDate??'Sem prazo'} • {a.status}</small></div>)}{!openActions.length&&<div className="note">Nenhuma ação aberta.</div>}</div>
   <div className="panel"><div className="panel-title"><h2>Governança do Forecast</h2><span>V2</span></div><div className="note">O Forecast futuro depende de fonte explícita. O sistema não faz rateio automático nem infere causas. Alertas permanecem rastreáveis por competência, centro de resultado e classe financeira.</div><div style={{marginTop:10}} className="note">{report.forecastEntries} registros de forecast • {report.unassignedForecastEntries} sem centro de resultado.</div></div>
  </section>
 </main>
}

function Metric({label,value,sub,currency=true}:{label:string;value:number;sub:string;currency?:boolean}){return <div className="card"><span>{label}</span><strong>{currency?brl(value):value.toLocaleString('pt-BR')}</strong><small>{sub}</small></div>}

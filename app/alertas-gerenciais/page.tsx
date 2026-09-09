'use client'

import { useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import { managementImpact } from '@/lib/management-integration'
import ReportPeriodFilter, { type ReportPeriod } from '@/components/report-period-filter'
import { DEFAULT_REPORT_PERIOD, competence } from '@/lib/report-period'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
type Level='critical'|'attention'|'monitor'|'normal'
type Alert={level:Level;title:string;impact:string;reason:string;action:string;url:string;value:number}

export default function AlertasGerenciais(){
 const source=useMemo(()=>readFinancialSource(),[])
 const years=useMemo(()=>Array.from(new Set(source.entries.map((x:any)=>Number(String(x.competence??'').slice(0,4))).filter((y:number)=>y>2000))).sort((a,b)=>a-b),[source])
 const [period,setPeriod]=useState<ReportPeriod>(DEFAULT_REPORT_PERIOD)
 const selectedCompetence=competence(period.year,period.month)
 const previousCompetence=period.month===1?competence(period.year-1,12):competence(period.year,period.month-1)
 const periodEntries=useMemo(()=>source.entries.filter((x:any)=>{const c=String(x.competence??'');if(period.view==='mensal'||period.view==='comparativo') return c===selectedCompetence;return c>=competence(period.year,1)&&c<=selectedCompetence}),[source.entries,period.view,selectedCompetence,period.year])
 const comparisonEntries=useMemo(()=>source.entries.filter((x:any)=>String(x.competence??'')===previousCompetence),[source.entries,previousCompetence])
 const buildAlerts=useMemo(()=>{
  const build=(e:any[],year:number,month:number):Alert[]=>{
   const periodEnd=new Date(year,month,0,23,59,59,999)
   const overdue=e.filter((x:any)=>x.status==='Em aberto'&&x.dueDate&&new Date(x.dueDate)<=periodEnd)
   const receivable=overdue.filter((x:any)=>x.type==='Receita').reduce((s:number,x:any)=>s+Math.abs(x.value),0)
   const payable=overdue.filter((x:any)=>x.type==='Despesa').reduce((s:number,x:any)=>s+Math.abs(x.value),0)
   const open=e.filter((x:any)=>x.status==='Em aberto')
   const openValue=open.reduce((s:number,x:any)=>s+Math.abs(x.value),0)
   const m=e.reduce((a:any,x:any)=>{const z=managementImpact(x);return {cash:a.cash+z.cash,working:a.working+z.workingCapital,dre:a.dre+z.dre}},{cash:0,working:0,dre:0})
   const totalRevenue=e.filter((x:any)=>x.type==='Receita').reduce((s:number,x:any)=>s+Math.abs(x.value),0)
   const totalExpense=e.filter((x:any)=>x.type==='Despesa').reduce((s:number,x:any)=>s+Math.abs(x.value),0)
   const margin=totalRevenue?((totalRevenue-totalExpense)/totalRevenue):0
   return [
    {level:receivable>totalRevenue*.15?'critical':receivable>totalRevenue*.07?'attention':'normal',title:'Recebíveis vencidos',impact:brl(receivable),reason:`${overdue.filter((x:any)=>x.type==='Receita').length} título(s) de recebimento em aberto e vencidos.`,action:'Priorizar cobrança e abrir o Aging.',url:'/contas-receber-pagar',value:receivable},
    {level:payable>totalExpense*.15?'critical':payable>totalExpense*.07?'attention':'normal',title:'Obrigações vencidas',impact:brl(payable),reason:`${overdue.filter((x:any)=>x.type==='Despesa').length} obrigação(ões) vencida(s).`,action:'Avaliar prioridade de pagamento e negociação.',url:'/contas-receber-pagar',value:payable},
    {level:m.working>openValue*.4?'critical':m.working>openValue*.2?'attention':'monitor',title:'Pressão de capital de giro',impact:brl(Math.abs(m.working)),reason:`${open.length} lançamento(s) ainda não liquidados compõem a exposição em aberto.`,action:'Abrir Capital de Giro e identificar os maiores impactos.',url:'/capital-giro',value:Math.abs(m.working)},
    {level:margin<.1?'critical':margin<.2?'attention':'normal',title:'Margem gerencial',impact:`${(margin*100).toFixed(1).replace('.',',')}%`,reason:`Receita de ${brl(totalRevenue)} contra despesas de ${brl(totalExpense)} na base selecionada.`,action:'Abrir Rentabilidade para localizar a pressão por centro de custo.',url:'/rentabilidade',value:margin},
    {level:m.cash<0?'critical':m.cash<totalRevenue*.05?'attention':'normal',title:'Impacto em caixa',impact:brl(m.cash),reason:'O indicador consolida o efeito dos lançamentos com impacto efetivo em caixa.',action:'Abrir Fluxo de Caixa para detalhar entradas e saídas.',url:'/fluxo-caixa',value:Math.abs(m.cash)},
   ] as Alert[]
  }
  return {current:build(periodEntries,period.year,period.month),previous:build(comparisonEntries,period.month===1?period.year-1:period.year,period.month===1?12:period.month-1)}
 },[periodEntries,comparisonEntries,period.year,period.month])
 const alerts=buildAlerts.current
 const ordered=[...alerts].sort((a,b)=>rank(b.level)-rank(a.level))
 const critical=ordered.filter(a=>a.level==='critical').length
 const attention=ordered.filter(a=>a.level==='attention').length
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Alertas Gerenciais</h1><p>Priorização automática • Impacto • Causa • Ação • Drill-down</p></div><ReportPeriodFilter value={period} onChange={setPeriod} years={years.length?years:[2025,2026]}/></header>
  <div className="cards"><Metric title="Críticos" value={String(critical)}/><Metric title="Atenção" value={String(attention)}/><Metric title="Monitorar" value={String(ordered.filter(a=>a.level==='monitor').length)}/><Metric title="Alertas" value={String(ordered.length)}/></div>
  <section className="panel wide"><div className="panel-title"><div><h2>Cockpit de Alertas</h2><span>Período {period.view==='acumulado'?`Jan → ${period.month}`:period.view==='comparativo'?`Atual ${selectedCompetence} × Anterior ${previousCompetence}`:selectedCompetence}</span></div><span>Atualização pela Base Financeira</span></div><div style={{display:'grid',gap:12}}>{ordered.map((a,i)=><AlertCard key={a.title} alert={a} index={i+1}/>)}</div></section>
  {period.view==='comparativo'&&<section className="panel wide"><div className="panel-title"><h2>Comparativo de severidade</h2><span>{selectedCompetence} × {previousCompetence}</span></div><div className="grid">{alerts.map(a=>{const prior=buildAlerts.previous.find(x=>x.title===a.title);return <div className="note" key={`cmp-${a.title}`}><small>{a.title}</small><p><strong>{a.impact}</strong> atual · {prior?.impact??'R$ 0'} anterior</p><span>{a.level.toUpperCase()} atual</span></div>})}</div></section>}
  <section className="panel wide"><div className="panel-title"><h2>Regra de governança</h2><span>Transparência</span></div><div className="note">Os alertas são indicadores de gestão baseados na base financeira selecionada. Eles não substituem validação contábil ou análise do responsável. Os limites são parametrizáveis e devem ser calibrados quando uma base orçamentária oficial estiver disponível.</div></section>
 </main>
}
function rank(l:Level){return l==='critical'?4:l==='attention'?3:l==='monitor'?2:1}
function AlertCard({alert,index}:{alert:Alert;index:number}){const meta={critical:['🔴','CRÍTICO'],attention:['🟡','ATENÇÃO'],monitor:['🔵','MONITORAR'],normal:['🟢','NORMAL']}[alert.level];return <article className="panel" style={{margin:0,borderLeft:`4px solid ${alert.level==='critical'?'#ef4444':alert.level==='attention'?'#f59e0b':alert.level==='monitor'?'#38bdf8':'#35e68b'}`}}><div className="panel-title"><div><span style={{fontSize:11,fontWeight:800}}>{meta[0]} {meta[1]} • PRIORIDADE {index}</span><h2 style={{marginTop:4}}>{alert.title}</h2></div><strong style={{fontSize:20}}>{alert.impact}</strong></div><div className="grid"><div className="note"><small>O que está acontecendo</small><p>{alert.reason}</p></div><div className="note"><small>Ação recomendada</small><p><strong>{alert.action}</strong></p><a href={alert.url} style={{fontWeight:800}}>Abrir detalhe →</a></div></div></article>}
function Metric({title,value}:{title:string;value:string}){return <div className="card"><span>{title}</span><strong>{value}</strong><small>Alertas gerenciais</small></div>}

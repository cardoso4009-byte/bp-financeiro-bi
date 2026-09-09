'use client'

import { useMemo, useState } from 'react'
import { cashFlowEngine } from '@/lib/dfc-engine'
import { ReportPeriodFilter } from '@/components/report-period-filter'
import { DEFAULT_REPORT_PERIOD, monthLabel, periodLabel, type ReportPeriod } from '@/lib/report-period'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

function previousPeriod(period:ReportPeriod):ReportPeriod{
  if(period.month===1) return {year:period.year-1,month:12,view:'mensal'}
  return {year:period.year,month:period.month-1,view:'mensal'}
}

export default function DfcIntegrada(){
 const [period,setPeriod]=useState<ReportPeriod>(DEFAULT_REPORT_PERIOD)
 const periodStart=period.view==='acumulado'?1:period.month
 const periodEnd=period.month
 const current=useMemo(()=>cashFlowEngine(undefined,{start:`${period.year}-${String(periodStart).padStart(2,'0')}`,end:`${period.year}-${String(periodEnd).padStart(2,'0')}`}),[period.year,periodStart,periodEnd])
 const previous=useMemo(()=>{const p=previousPeriod(period);return cashFlowEngine(undefined,{start:`${p.year}-${String(p.month).padStart(2,'0')}`,end:`${p.year}-${String(p.month).padStart(2,'0')}`})},[period])
 const ok=Math.abs(current.reconciliation)<0.01
 const variationPct=previous.variation===0?null:((current.variation-previous.variation)/Math.abs(previous.variation))*100
 const periodTitle=period.view==='acumulado'?`Jan–${monthLabel(period.month)}/${period.year}`:periodLabel(period)
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1400,margin:'0 auto'}}>
  <header><div><small>MOTOR CONTÁBIL V5</small><h1>DFC Integrada</h1><p>Demonstração dos Fluxos de Caixa derivada do razão</p></div><div className="period">{ok?'✓ Caixa conciliado':'! Divergência'}</div></header>
  <section className="panel wide">
   <div className="panel-title"><div><h2>Período de análise</h2><span>{periodTitle}</span></div><span>Mensal • Acumulado • Comparativo</span></div>
   <ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]} />
  </section>
  <div className="cards">
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
   <ReportPeriodFilter value={period} onChange={setPeriod} years={[2025,2026]} />
  </section>
  <div className="cards">
   <div className="card"><span>Operacional</span><strong>{brl(current.operational)}</strong><small>{period.view==='acumulado'?'Jan até competência':'Competência selecionada'}</small></div>
   <div className="card"><span>Investimentos</span><strong>{brl(current.investment)}</strong><small>Atividades de investimento</small></div>
   <div className="card"><span>Financiamentos</span><strong>{brl(current.financing)}</strong><small>Atividades de financiamento</small></div>
   <div className="card"><span>Variação líquida</span><strong>{brl(current.variation)}</strong><small>Operacional + Invest. + Financ.</small></div>
  </div>
  <section className="panel wide">
   <div className="panel-title"><h2>Conciliação da DFC</h2><span>{ok?'✓ Caixa conciliado':'! Divergência'}</span></div>
   <div className="rows"><div className="row"><span>Caixa Inicial</span><b>{brl(current.initialCash)}</b></div><div className="row"><span>(+) Fluxo Operacional</span><b>{brl(current.operational)}</b></div><div className="row"><span>(+) Fluxo de Investimentos</span><b>{brl(current.investment)}</b></div><div className="row"><span>(+) Fluxo de Financiamentos</span><b>{brl(current.financing)}</b></div><div className="row"><span>= Caixa Final pela DFC</span><b>{brl(current.finalCash)}</b></div><div className="row"><span>Caixa no Razão / Balanço</span><b>{brl(current.balanceCash)}</b></div><div className="row"><span>Diferença</span><b>{brl(current.reconciliation)}</b></div></div>
  </section>
  {period.view==='comparativo'&&<section className="panel wide">
   <div className="panel-title"><div><h2>Análise comparativa</h2><span>Competência selecionada × período anterior</span></div><span>{variationPct===null?'Sem base comparável':`${variationPct>=0?'+':''}${variationPct.toFixed(1)}%`}</span></div>
   <div className="rows"><div className="row"><span>Variação líquida — atual</span><b>{brl(current.variation)}</b></div><div className="row"><span>Variação líquida — anterior</span><b>{brl(previous.variation)}</b></div><div className="row"><span>Diferença</span><b>{brl(current.variation-previous.variation)}</b></div><div className="row"><span>Variação percentual</span><b>{variationPct===null?'n/a':`${variationPct>=0?'+':''}${variationPct.toFixed(1)}%`}</b></div></div>
  </section>}
  <section className="panel">
   <div className="panel-title"><h2>Controle</h2><span>{ok?'OK':'REVISAR'}</span></div>
   <div className="note">A regra de integração é: <strong>Caixa Inicial + Operacional + Investimentos + Financiamentos = Caixa Final</strong>. O Caixa Final deve coincidir com a conta Caixa do Balanço. Se houver diferença, o BI deve apontar a divergência.</div>
  </section>
 </main>
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import type { FinancialEntry } from '@/lib/lancamentos-data'
import { projectCashFlow } from '@/lib/cashflow-projection'
import { ReportPeriodFilter } from '@/components/report-period-filter'
import { DEFAULT_REPORT_PERIOD, competence, monthLabel, type ReportPeriod } from '@/lib/report-period'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

function buildProjection(entries:FinancialEntry[], initialCash:number){
  const r:Record<string,number>={}, p:Record<string,number>={}, f:Record<string,number>={}, c:Record<string,number>={}
  entries.forEach(e=>{
    const m=e.competence
    if(e.type==='Receita' && e.status==='Em aberto') r[m]=(r[m]||0)+Math.abs(e.value)
    if(e.type==='Despesa' && e.status==='Em aberto') p[m]=(p[m]||0)+Math.abs(e.value)
    if(e.type==='Financiamento' && e.status==='Em aberto') f[m]=(f[m]||0)+e.value
    if(e.type==='CAPEX' && e.status==='Em aberto') c[m]=(c[m]||0)+Math.abs(e.value)
  })
  return projectCashFlow({initialCash,receivablesByMonth:r,payablesByMonth:p,financingByMonth:f,capexByMonth:c})
}

function periodCompetences(period:ReportPeriod, entries:FinancialEntry[]){
  const values=new Set(entries.map(e=>e.competence))
  const fallback=[...Array(12)].map((_,i)=>competence(period.year,i+1))
  const yearMonths=fallback.filter(m=>values.has(m))
  if(period.view==='mensal' || period.view==='comparativo') return [competence(period.year,period.month)]
  return yearMonths.length?yearMonths:fallback.slice(0,period.month)
}

function previousPeriod(period:ReportPeriod):ReportPeriod{
  return period.month===1
    ? {year:period.year-1,month:12,view:'mensal'}
    : {year:period.year,month:period.month-1,view:'mensal'}
}

export default function FluxoCaixaProjetado(){
  const [entries,setEntries]=useState<FinancialEntry[]>([])
  const [initialCash,setInitialCash]=useState(100000)
  const [months,setMonths]=useState(12)
  const [period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,month:12})
  useEffect(()=>setEntries(readFinancialSource().entries),[])

  const projection=useMemo(()=>buildProjection(entries,initialCash),[entries,initialCash])
  const currentCompetences=periodCompetences(period,entries)
  const previous=previousPeriod(period)
  const previousCompetences=[competence(previous.year,previous.month)]

  const rows=useMemo(()=>projection.filter(x=>currentCompetences.includes(x.competence)).slice(0,months),[projection,currentCompetences,months])
  const previousRows=useMemo(()=>projection.filter(x=>previousCompetences.includes(x.competence)),[projection,previousCompetences])

  const summary=useMemo(()=>({
    receivables:rows.reduce((s,x)=>s+x.receivables,0),
    payables:rows.reduce((s,x)=>s+x.payables,0),
    financing:rows.reduce((s,x)=>s+x.financing,0),
    capex:rows.reduce((s,x)=>s+x.capex,0),
    net:rows.reduce((s,x)=>s+x.projectedNet,0),
  }),[rows])

  const minCash=rows.length?Math.min(...rows.map(x=>x.closingCash)):initialCash
  const minMonth=rows.find(x=>x.closingCash===minCash)?.month||'—'
  const critical=rows.filter(x=>x.risk==='critical')
  const attention=rows.filter(x=>x.risk==='attention')
  const previousNet=previousRows.reduce((s,x)=>s+x.projectedNet,0)
  const variation=previousNet!==0?(summary.net-previousNet)/Math.abs(previousNet):null

  return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
    <header><div><small>TESOURARIA E PLANEJAMENTO</small><h1>Fluxo de Caixa Projetado</h1><p>Liquidez futura • compromissos • entradas esperadas • risco de caixa</p></div><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/></header>

    <section className="panel wide"><div className="filters" style={{marginTop:0}}><label>Horizonte <select value={months} onChange={e=>setMonths(Number(e.target.value))}>{[3,6,9,12].map(n=><option key={n} value={n}>{n} meses</option>)}</select></label><label>Caixa inicial <input inputMode="decimal" value={initialCash} onChange={e=>setInitialCash(Number(e.target.value.replace(',','.'))||0)} style={{width:160}}/></label><span className="note">A projeção usa contas em aberto da base financeira. Não presume recebimentos ou pagamentos já realizados.</span></div></section>

    <div className="cards"><Card title="Caixa projetado final" value={rows.length?rows[rows.length-1].closingCash:initialCash}/><Card title="Menor caixa" value={minCash}/><Card title="Geração líquida" value={summary.net}/><Card title="Recebimentos previstos" value={summary.receivables}/></div>

    {period.view==='comparativo' && <section className="panel wide"><div className="panel-title"><h2>Comparativo</h2><span>{monthLabel(period.month)}/{period.year} × {monthLabel(previous.month)}/{previous.year}</span></div><div className="rows"><div className="row"><span>Geração líquida atual</span><b>{brl(summary.net)}</b></div><div className="row"><span>Geração líquida anterior</span><b>{brl(previousNet)}</b></div><div className="row"><span>Variação</span><b>{variation===null?'—':`${(variation*100).toFixed(1).replace('.',',')}%`}</b></div></div></section>}

    <section className="panel wide"><div className="panel-title"><h2>Projeção mensal</h2><span>{period.view==='acumulado'?`Acumulado até ${monthLabel(period.month)}/${period.year}`:`Competência ${monthLabel(period.month)}/${period.year}`}</span></div><div className="table-wrap"><table><thead><tr><th>Mês</th><th>Saldo inicial</th><th>Recebimentos</th><th>Pagamentos</th><th>Financiamentos</th><th>CAPEX</th><th>Variação</th><th>Saldo final</th><th>Risco</th></tr></thead><tbody>{rows.map(x=><tr key={x.competence}><td><b>{x.month}</b></td><td>{brl(x.openingCash)}</td><td>{brl(x.receivables)}</td><td>{brl(x.payables)}</td><td>{brl(x.financing)}</td><td>{brl(x.capex)}</td><td>{brl(x.projectedNet)}</td><td><b>{brl(x.closingCash)}</b></td><td>{x.risk==='critical'?'🔴 Crítico':x.risk==='attention'?'🟡 Atenção':'🟢 Normal'}</td></tr>)}</tbody></table></div></section>

    <div className="grid"><section className="panel"><div className="panel-title"><h2>Riscos de liquidez</h2><span>Antecipação</span></div><div className="note"><strong>{critical.length?'🔴 Há risco de caixa negativo':attention.length?'🟡 Há meses próximos do limite':'🟢 Sem risco identificado no período'}</strong><p>{critical.length?`${critical.length} mês(es) apresentam saldo projetado negativo.`:attention.length?`${attention.length} mês(es) exigem acompanhamento preventivo.`:'O saldo projetado permanece acima do limite de atenção definido.'}</p><p>Menor caixa: <b>{brl(minCash)}</b> em <b>{minMonth}</b>.</p></div></section><section className="panel"><div className="panel-title"><h2>Composição</h2><span>Período selecionado</span></div><div className="rows"><div className="row"><span>Recebimentos em aberto</span><b>{brl(summary.receivables)}</b></div><div className="row"><span>Pagamentos em aberto</span><b>{brl(summary.payables)}</b></div><div className="row"><span>Financiamentos</span><b>{brl(summary.financing)}</b></div><div className="row"><span>CAPEX em aberto</span><b>{brl(summary.capex)}</b></div></div></section></div>

    <section className="panel wide"><div className="panel-title"><h2>Leitura gerencial</h2><span>Tesouraria</span></div><div className="note"><strong>O caixa projetado não é uma promessa de caixa.</strong><p>Ele representa uma visão-base construída a partir de compromissos financeiros ainda em aberto. A leitura mensalizada permite acompanhar cada competência; o acumulado consolida o período até o mês selecionado; e o comparativo evidencia a mudança contra a competência anterior.</p><p><b>Próxima camada:</b> integrar orçamento, recorrências, sazonalidade e cenários ao forecast de caixa.</p></div></section>
  </main>
}
function Card({title,value}:{title:string;value:number}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>Período selecionado</small></div>}

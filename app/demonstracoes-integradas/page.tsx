'use client'

import { useMemo, useState } from 'react'
import { statementEngine } from '@/lib/statement-engine'
import { sampleJournal } from '@/lib/contabil-model'
import ReportPeriodFilter, { type ReportPeriod } from '@/components/report-period-filter'
import { DEFAULT_REPORT_PERIOD, competence } from '@/lib/report-period'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function DemonstracoesIntegradas(){
 const [period,setPeriod]=useState<ReportPeriod>(DEFAULT_REPORT_PERIOD)
 const years=useMemo(()=>Array.from(new Set(sampleJournal.map(e=>Number(String(e.competence??'').slice(0,4))).filter(y=>y>2000))).sort((a,b)=>a-b),[])
 const selected=competence(period.year,period.month)
 const previous=period.month===1?competence(period.year-1,12):competence(period.year,period.month-1)
 const periodEntries=useMemo(()=>sampleJournal.filter(e=>{const c=e.competence??e.date.slice(0,7);if(period.view==='mensal'||period.view==='comparativo') return c===selected;return c>=competence(period.year,1)&&c<=selected}),[period.view,period.year,selected])
 const opening=useMemo(()=>sampleJournal.filter(e=>(e.competence??e.date.slice(0,7))<competence(period.year,1)),[period.year])
 const balanceEntries=useMemo(()=>[...opening,...periodEntries.filter(e=>(e.competence??e.date.slice(0,7))>=competence(period.year,1))],[opening,periodEntries,period.year])
 const bp=statementEngine(balanceEntries).totals
 const dre=statementEngine(periodEntries).totals
 const resultado=dre.receitas-dre.custos-dre.despesas
 const priorEntries=sampleJournal.filter(e=>(e.competence??e.date.slice(0,7))===previous)
 const priorOpening=sampleJournal.filter(e=>(e.competence??e.date.slice(0,7))<previous)
 const priorBp=statementEngine([...priorOpening,...priorEntries]).totals
 const priorDre=statementEngine(priorEntries).totals
 const valid=Math.abs(bp.ativo-(bp.passivo+bp.patrimonio))<0.01
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1400,margin:'0 auto'}}>
  <header><div><small>MOTOR CONTÁBIL V5</small><h1>Demonstrações Integradas</h1><p>Razão + Mapeamento Contábil • visão por competência</p></div><ReportPeriodFilter value={period} onChange={setPeriod} years={years.length?years:[2025,2026]}/></header>
  <div className="cards"><div className="card"><span>Ativo</span><strong>{brl(bp.ativo)}</strong><small>Posição {selected}</small></div><div className="card"><span>Passivo</span><strong>{brl(bp.passivo)}</strong><small>Posição {selected}</small></div><div className="card"><span>Patrimônio Líquido</span><strong>{brl(bp.patrimonio)}</strong><small>Posição {selected}</small></div><div className="card"><span>Resultado</span><strong>{brl(resultado)}</strong><small>{period.view==='acumulado'?'Acumulado':'Mensal'} {selected}</small></div></div>
  <div className="grid"><section className="panel"><div className="panel-title"><h2>Balanço Patrimonial</h2><span>{valid?'✓ OK':'! Revisar'} • Razão</span></div><div className="rows"><div className="row"><span>Ativo</span><b>{brl(bp.ativo)}</b></div><div className="row"><span>Passivo</span><b>{brl(bp.passivo)}</b></div><div className="row"><span>Patrimônio Líquido</span><b>{brl(bp.patrimonio)}</b></div><div className="row"><span>Passivo + PL</span><b>{brl(bp.passivo+bp.patrimonio)}</b></div></div></section><section className="panel"><div className="panel-title"><h2>DRE</h2><span>{period.view==='comparativo'?`${selected} × ${previous}`:period.view==='acumulado'?`Jan → ${selected}`:selected}</span></div><div className="rows"><div className="row"><span>Receitas</span><b>{brl(dre.receitas)}</b></div><div className="row"><span>Custos</span><b>{brl(dre.custos)}</b></div><div className="row"><span>Despesas</span><b>{brl(dre.despesas)}</b></div><div className="row"><span>Resultado</span><b>{brl(resultado)}</b></div></div></section></div>
  {period.view==='comparativo'&&<section className="panel"><div className="panel-title"><h2>Análise comparativa</h2><span>{selected} × {previous}</span></div><div className="grid"><div className="note"><small>Resultado DRE</small><p><strong>{brl(resultado)}</strong> atual · {brl(priorDre.receitas-priorDre.custos-priorDre.despesas)} anterior</p></div><div className="note"><small>Patrimônio Líquido</small><p><strong>{brl(bp.patrimonio)}</strong> atual · {brl(priorBp.patrimonio)} anterior</p></div><div className="note"><small>Ativo</small><p><strong>{brl(bp.ativo)}</strong> atual · {brl(priorBp.ativo)} anterior</p></div></div></section>}
  <section className="panel"><div className="panel-title"><h2>Controle de integração</h2><span>{valid?'✓ OK':'! Revisar'}</span></div><div className="note">As demonstrações são calculadas a partir do <strong>Razão</strong> e do <strong>Mapeamento Contábil</strong>. A visão mensal apresenta a posição patrimonial e o resultado da competência; a visão acumulada soma o resultado de janeiro até o mês selecionado.</div></section>
 </main>
}

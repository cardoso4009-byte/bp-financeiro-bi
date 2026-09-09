'use client'
import { useEffect, useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import type { FinancialEntry } from '@/lib/lancamentos-data'
import { projectCashFlow } from '@/lib/cashflow-projection'
import { defaultScenarios, runScenario } from '@/lib/cashflow-scenarios'
import { ReportPeriodFilter } from '@/components/report-period-filter'
import { DEFAULT_REPORT_PERIOD, competence, monthLabel, type ReportPeriod } from '@/lib/report-period'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
function baseProjection(entries:FinancialEntry[],cash:number){
 const r:Record<string,number>={},p:Record<string,number>={},f:Record<string,number>={},c:Record<string,number>={}
 entries.forEach(e=>{if(e.status!=='Em aberto')return;const m=e.competence;if(e.type==='Receita')r[m]=(r[m]||0)+Math.abs(e.value);if(e.type==='Despesa')p[m]=(p[m]||0)+Math.abs(e.value);if(e.type==='Financiamento')f[m]=(f[m]||0)+e.value;if(e.type==='CAPEX')c[m]=(c[m]||0)+Math.abs(e.value)})
 return projectCashFlow({initialCash:cash,receivablesByMonth:r,payablesByMonth:p,financingByMonth:f,capexByMonth:c})
}
function previous(period:ReportPeriod){return period.month===1?{year:period.year-1,month:12}:{year:period.year,month:period.month-1}}
export default function Cenarios(){
 const [entries,setEntries]=useState<FinancialEntry[]>([]),[cash,setCash]=useState(100000),[revenue,setRevenue]=useState(10),[opex,setOpex]=useState(8),[capex,setCapex]=useState(0),[selected,setSelected]=useState('Pessimista'),[period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,month:12})
 useEffect(()=>setEntries(readFinancialSource().entries),[])
 const base=useMemo(()=>baseProjection(entries,cash),[entries,cash])
 const scenarios=useMemo(()=>defaultScenarios.map(s=>runScenario(base,{...s,...(s.name==='Otimista'?{revenueFactor:1+revenue/100,payablesFactor:1-opex/200,capexFactor:1-capex/100}:{}) ,...(s.name==='Pessimista'?{revenueFactor:1-revenue/100,payablesFactor:1+opex/100,capexFactor:1+capex/100}:{})})),[base,revenue,opex,capex])
 const current=scenarios.find(s=>s.name===selected)||scenarios[0]
 const selectedMonth=competence(period.year,period.month), prev=previous(period), previousMonth=competence(prev.year,prev.month)
 const periodRows=period.view==='mensal'||period.view==='comparativo'?current.periods.filter(p=>p.competence===selectedMonth):current.periods.filter(p=>Number(p.competence.slice(5,7))<=period.month)
 const previousRows=current.periods.filter(p=>p.competence===previousMonth)
 const variation=(periodRows.length&&previousRows.length&&previousRows[0].projectedNet!==0)?(periodRows.reduce((s,p)=>s+p.projectedNet,0)-previousRows[0].projectedNet)/Math.abs(previousRows[0].projectedNet):null
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>PLANEJAMENTO E CONTROLADORIA</small><h1>Cenários Financeiros</h1><p>Base • Otimista • Pessimista • impacto no caixa</p></div><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/></header>
  <section className="panel wide"><div className="filters" style={{marginTop:0}}><label>Caixa inicial <input inputMode="decimal" value={cash} onChange={e=>setCash(Number(e.target.value.replace(',','.'))||0)}/></label><label>Variação receita <input type="number" value={revenue} onChange={e=>setRevenue(Number(e.target.value)||0)} />%</label><label>Variação OPEX/obrigações <input type="number" value={opex} onChange={e=>setOpex(Number(e.target.value)||0)} />%</label><label>Variação CAPEX <input type="number" value={capex} onChange={e=>setCapex(Number(e.target.value)||0)} />%</label></div></section>
  <div className="grid">{scenarios.map(s=><section className="panel" key={s.name} onClick={()=>setSelected(s.name)} style={{cursor:'pointer',outline:selected===s.name?'2px solid currentColor':'none'}}><div className="panel-title"><h2>{s.name}</h2><span>{s.critical?'🔴 Risco':'🟢 Controlado'}</span></div><div className="rows"><div className="row"><span>Caixa final</span><b>{brl(s.finalCash)}</b></div><div className="row"><span>Menor caixa</span><b>{brl(s.minimumCash)}</b></div><div className="row"><span>Mês crítico</span><b>{s.minimumMonth}</b></div></div></section>)}</div>
  {period.view==='comparativo'&&<section className="panel wide"><div className="panel-title"><h2>Comparativo — {current.name}</h2><span>{monthLabel(period.month)}/{period.year} × {monthLabel(prev.month)}/{prev.year}</span></div><div className="rows"><div className="row"><span>Variação de caixa atual</span><b>{brl(periodRows.reduce((s,p)=>s+p.projectedNet,0))}</b></div><div className="row"><span>Variação de caixa anterior</span><b>{brl(previousRows.reduce((s,p)=>s+p.projectedNet,0))}</b></div><div className="row"><span>Variação percentual</span><b>{variation===null?'—':`${(variation*100).toFixed(1).replace('.',',')}%`}</b></div></div></section>}
  <section className="panel wide"><div className="panel-title"><h2>Impacto mensal — {current.name}</h2><span>{period.view==='acumulado'?`Acumulado até ${monthLabel(period.month)}/${period.year}`:`Visão ${monthLabel(period.month)}/${period.year}`}</span></div><div className="table-wrap"><table><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Variação</th><th>Saldo final</th><th>Risco</th></tr></thead><tbody>{periodRows.map(p=><tr key={p.competence}><td><b>{p.month}</b></td><td>{brl(p.receivables)}</td><td>{brl(p.payables+p.capex-p.financing)}</td><td>{brl(p.projectedNet)}</td><td><b>{brl(p.closingCash)}</b></td><td>{p.risk==='critical'?'🔴 Crítico':p.risk==='attention'?'🟡 Atenção':'🟢 Normal'}</td></tr>)}</tbody></table></div></section>
  <section className="panel wide"><div className="panel-title"><h2>Leitura gerencial</h2><span>Planejamento</span></div><div className="note"><strong>{current.critical?'🔴 O cenário selecionado indica necessidade de ação preventiva.':'🟢 O cenário selecionado permanece solvente no horizonte.'}</strong><p>Compare os três cenários antes de decisões de contratação, investimento, distribuição de caixa ou contratação de dívida.</p><p><b>Regra:</b> o cenário é uma simulação; ele não substitui orçamento aprovado nem fluxo de caixa atualizado.</p></div></section>
 </main>
}

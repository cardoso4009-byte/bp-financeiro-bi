'use client'

import { useEffect, useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import type { FinancialEntry } from '@/lib/lancamentos-data'
import { projectCashFlow } from '@/lib/cashflow-projection'
import { defaultScenarios, runScenario } from '@/lib/cashflow-scenarios'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

function baseProjection(entries:FinancialEntry[],cash:number){
 const r:Record<string,number>={},p:Record<string,number>={},f:Record<string,number>={},c:Record<string,number>={}
 entries.forEach(e=>{if(e.status!=='Em aberto')return;const m=e.competence;if(e.type==='Receita')r[m]=(r[m]||0)+Math.abs(e.value);if(e.type==='Despesa')p[m]=(p[m]||0)+Math.abs(e.value);if(e.type==='Financiamento')f[m]=(f[m]||0)+e.value;if(e.type==='CAPEX')c[m]=(c[m]||0)+Math.abs(e.value)})
 return projectCashFlow({initialCash:cash,receivablesByMonth:r,payablesByMonth:p,financingByMonth:f,capexByMonth:c})
}

export default function Cenarios(){
 const [entries,setEntries]=useState<FinancialEntry[]>([]); const [cash,setCash]=useState(100000); const [revenue,setRevenue]=useState(10); const [opex,setOpex]=useState(8); const [capex,setCapex]=useState(0); const [selected,setSelected]=useState('Pessimista')
 useEffect(()=>setEntries(readFinancialSource().entries),[])
 const base=useMemo(()=>baseProjection(entries,cash),[entries,cash])
 const scenarios=useMemo(()=>defaultScenarios.map(s=>runScenario(base,{...s,...(s.name==='Otimista'?{revenueFactor:1+revenue/100,payablesFactor:1-opex/200,capexFactor:1-capex/100}:{}) ,...(s.name==='Pessimista'?{revenueFactor:1-revenue/100,payablesFactor:1+opex/100,capexFactor:1+capex/100}:{})})),[base,revenue,opex,capex])
 const current=scenarios.find(s=>s.name===selected)||scenarios[0]
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>PLANEJAMENTO E CONTROLADORIA</small><h1>Cenários Financeiros</h1><p>Base • otimista • pessimista • impacto no caixa</p></div></header>
  <section className="panel wide"><div className="panel-title"><h2>Premissas</h2><span>Simulação gerencial</span></div><div className="filters"><label>Caixa inicial <input inputMode="decimal" value={cash} onChange={e=>setCash(Number(e.target.value.replace(',','.'))||0)}/></label><label>Variação receita <input type="number" value={revenue} onChange={e=>setRevenue(Number(e.target.value)||0)} />%</label><label>Variação OPEX/obrigações <input type="number" value={opex} onChange={e=>setOpex(Number(e.target.value)||0)} />%</label><label>Variação CAPEX <input type="number" value={capex} onChange={e=>setCapex(Number(e.target.value)||0)} />%</label></div></section>
  <div className="grid">{scenarios.map(s=><section className="panel" key={s.name} onClick={()=>setSelected(s.name)} style={{cursor:'pointer',outline:selected===s.name?'2px solid currentColor':'none'}}><div className="panel-title"><h2>{s.name}</h2><span>{s.critical?'🔴 Risco':'🟢 Controlado'}</span></div><div className="rows"><div className="row"><span>Caixa final</span><b>{brl(s.finalCash)}</b></div><div className="row"><span>Menor caixa</span><b>{brl(s.minimumCash)}</b></div><div className="row"><span>Mês crítico</span><b>{s.minimumMonth}</b></div></div></section>)}</div>
  <section className="panel wide"><div className="panel-title"><h2>Impacto mensal — {current.name}</h2><span>Saldo projetado</span></div><div className="table-wrap"><table><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Variação</th><th>Saldo final</th><th>Risco</th></tr></thead><tbody>{current.periods.map(p=><tr key={p.competence}><td><b>{p.month}</b></td><td>{brl(p.receivables)}</td><td>{brl(p.payables+p.capex-p.financing)}</td><td>{brl(p.projectedNet)}</td><td><b>{brl(p.closingCash)}</b></td><td>{p.risk==='critical'?'🔴 Crítico':p.risk==='attention'?'🟡 Atenção':'🟢 Normal'}</td></tr>)}</tbody></table></div></section>
  <section className="panel wide"><div className="panel-title"><h2>Leitura gerencial</h2><span>Planejamento</span></div><div className="note"><strong>{current.critical?'🔴 O cenário selecionado indica necessidade de ação preventiva.':'🟢 O cenário selecionado permanece solvente no horizonte.'}</strong><p>Compare os três cenários antes de decisões de contratação, investimento, distribuição de caixa ou contratação de dívida.</p><p><b>Regra:</b> o cenário é uma simulação; ele não substitui orçamento aprovado nem fluxo de caixa atualizado.</p></div></section>
 </main>
}

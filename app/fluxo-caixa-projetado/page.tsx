'use client'

import { useEffect, useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import type { FinancialEntry } from '@/lib/lancamentos-data'
import { projectCashFlow, projectionMonths } from '@/lib/cashflow-projection'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`

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

export default function FluxoCaixaProjetado(){
  const [entries,setEntries]=useState<FinancialEntry[]>([])
  const [initialCash,setInitialCash]=useState(100000)
  const [months,setMonths]=useState(12)
  useEffect(()=>setEntries(readFinancialSource().entries),[])
  const projection=useMemo(()=>buildProjection(entries,initialCash).slice(0,months),[entries,initialCash,months])
  const minCash=projection.length?Math.min(...projection.map(x=>x.closingCash)):initialCash
  const minMonth=projection.find(x=>x.closingCash===minCash)?.month||'—'
  const totalNet=projection.reduce((s,x)=>s+x.projectedNet,0)
  const critical=projection.filter(x=>x.risk==='critical')
  const attention=projection.filter(x=>x.risk==='attention')
  const totalReceivables=projection.reduce((s,x)=>s+x.receivables,0)
  const totalPayables=projection.reduce((s,x)=>s+x.payables,0)
  const totalCapex=projection.reduce((s,x)=>s+x.capex,0)
  const totalFinancing=projection.reduce((s,x)=>s+x.financing,0)

  return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
    <header><div><small>TESOURARIA E PLANEJAMENTO</small><h1>Fluxo de Caixa Projetado</h1><p>Liquidez futura • compromissos • entradas esperadas • risco de caixa</p></div><div className="period-controls"><label>Horizonte</label><select value={months} onChange={e=>setMonths(Number(e.target.value))}>{[3,6,9,12].map(n=><option key={n} value={n}>{n} meses</option>)}</select></div></header>

    <section className="panel wide"><div className="panel-title"><h2>Parâmetros</h2><span>Saldo inicial informado pelo gestor</span></div><div className="filters"><label>Caixa inicial <input inputMode="decimal" value={initialCash} onChange={e=>setInitialCash(Number(e.target.value.replace(',','.'))||0)} style={{width:160}}/></label><span className="note">A projeção usa contas em aberto da base financeira. Não presume recebimentos ou pagamentos já realizados.</span></div></section>

    <div className="cards"><Card title="Caixa projetado final" value={projection.length?projection[projection.length-1].closingCash:initialCash}/><Card title="Menor caixa" value={minCash}/><Card title="Geração líquida" value={totalNet}/><Card title="Recebimentos previstos" value={totalReceivables}/></div>

    <section className="panel wide"><div className="panel-title"><h2>Projeção mensal</h2><span>Saldo inicial + entradas − saídas</span></div><div className="table-wrap"><table><thead><tr><th>Mês</th><th>Saldo inicial</th><th>Recebimentos</th><th>Pagamentos</th><th>Financiamentos</th><th>CAPEX</th><th>Variação</th><th>Saldo final</th><th>Risco</th></tr></thead><tbody>{projection.map(x=><tr key={x.competence}><td><b>{x.month}</b></td><td>{brl(x.openingCash)}</td><td>{brl(x.receivables)}</td><td>{brl(x.payables)}</td><td>{brl(x.financing)}</td><td>{brl(x.capex)}</td><td>{brl(x.projectedNet)}</td><td><b>{brl(x.closingCash)}</b></td><td>{x.risk==='critical'?'🔴 Crítico':x.risk==='attention'?'🟡 Atenção':'🟢 Normal'}</td></tr>)}</tbody></table></div></section>

    <div className="grid"><section className="panel"><div className="panel-title"><h2>Riscos de liquidez</h2><span>Antecipação</span></div><div className="note"><strong>{critical.length?'🔴 Há risco de caixa negativo':attention.length?'🟡 Há meses próximos do limite':'🟢 Sem risco identificado no horizonte'}</strong><p>{critical.length?`${critical.length} mês(es) apresentam saldo projetado negativo.`:attention.length?`${attention.length} mês(es) exigem acompanhamento preventivo.`:'O saldo projetado permanece acima do limite de atenção definido.'}</p><p>Menor caixa: <b>{brl(minCash)}</b> em <b>{minMonth}</b>.</p></div></section><section className="panel"><div className="panel-title"><h2>Composição</h2><span>Horizonte selecionado</span></div><div className="rows"><div className="row"><span>Recebimentos em aberto</span><b>{brl(totalReceivables)}</b></div><div className="row"><span>Pagamentos em aberto</span><b>{brl(totalPayables)}</b></div><div className="row"><span>Financiamentos</span><b>{brl(totalFinancing)}</b></div><div className="row"><span>CAPEX em aberto</span><b>{brl(totalCapex)}</b></div></div></section></div>

    <section className="panel wide"><div className="panel-title"><h2>Leitura gerencial</h2><span>Tesouraria</span></div><div className="note"><strong>O caixa projetado não é uma promessa de caixa.</strong><p>Ele representa uma visão-base construída a partir de compromissos financeiros ainda em aberto. A próxima evolução será incorporar orçamento, recorrências, sazonalidade e cenários para estimar o comportamento esperado quando não houver lançamentos cadastrados.</p><p><b>Próxima camada:</b> cenário Base × Otimista × Pessimista e alerta de necessidade de capital de giro.</p></div></section>
  </main>
}
function Card({title,value}:{title:string;value:number}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>Horizonte selecionado</small></div>}

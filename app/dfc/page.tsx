'use client'

import { useMemo, useState } from 'react'
import { cashFlowEngine } from '@/lib/dfc-engine'

const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

type View = 'mensal' | 'acumulado'

export default function DFCPage(){
  const [view,setView] = useState<View>('mensal')
  const [month,setMonth] = useState(11)
  const base = useMemo(() => cashFlowEngine(), [])
  const factor = view === 'mensal' ? (month + 1) / 12 : 1
  const operational = base.operational * factor
  const investment = base.investment * factor
  const financing = base.financing * factor
  const variation = operational + investment + financing
  const initialCash = view === 'mensal' ? base.initialCash : base.initialCash
  const finalCash = initialCash + variation
  const reconciliation = finalCash - base.balanceCash * factor

  const rows = [
    ['Fluxo de Caixa Operacional', operational],
    ['Fluxo de Caixa de Investimentos', investment],
    ['Fluxo de Caixa de Financiamentos', financing],
    ['Variação Líquida de Caixa', variation],
    ['Caixa Inicial', initialCash],
    ['Caixa Final', finalCash],
  ] as const

  return <main className="shell">
    <aside className="side">
      <div className="brand"><b>BP</b><div><strong>BP Financeiro</strong><span>Controladoria & BI</span></div></div>
      <div className="company"><small>EMPRESA DEMONSTRATIVA</small><strong>Grupo Exemplo</strong><span>2026 • Modelo integrado</span></div>
      <nav>
        <a className="nav-link" href="/">← Voltar ao BP Financeiro</a>
        <div className="nav-divider">DEMONSTRAÇÕES</div>
        <a className="nav-link" href="/">Visão Executiva</a>
        <a className="nav-link" href="/">DRE Gerencial</a>
        <a className="nav-link" href="/">Balanço</a>
        <a className="nav-link active">DFC Gerencial</a>
        <a className="nav-link" href="/">DMPL</a>
      </nav>
      <footer>V2.7 • Projeto Consultoria Financeira</footer>
    </aside>

    <section className="content">
      <header>
        <div><small>CONTROLADORIA FINANCEIRA</small><h1>DFC Gerencial</h1><p>Demonstração dos Fluxos de Caixa • Método indireto</p></div>
        <div className="period-controls"><label>PERÍODO DE ANÁLISE</label><div><select value={month} onChange={e=>setMonth(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i}>Data-base: {m}/2026</option>)}</select></div><span>{view === 'mensal' ? months[month] : 'Jan–Dez'}/2026</span></div>
      </header>

      <section className="panel wide">
        <div className="panel-title"><h2>DFC — visão gerencial</h2><span>2026</span></div>
        <div className="dre-toolbar">
          <div><span>VISÃO</span><div className="segmented"><button className={view==='mensal'?'selected':''} onClick={()=>setView('mensal')}>Mensal</button><button className={view==='acumulado'?'selected':''} onClick={()=>setView('acumulado')}>Acumulado</button></div></div>
        </div>

        <div className="cards">
          <Card title="Operacional" value={operational}/><Card title="Investimentos" value={investment}/><Card title="Financiamentos" value={financing}/><Card title="Variação Líquida" value={variation}/>
        </div>

        <div className="table-wrap dre-wrap"><table className="dre-table"><thead><tr><th>Fluxo de caixa</th><th>Realizado</th><th>Participação</th></tr></thead><tbody>{rows.map(([label,value])=><tr key={label}><td>{label}</td><td className="total-col">{brl(value)}</td><td>{variation ? `${(value / Math.abs(variation) * 100).toFixed(1).replace('.',',')}%` : '—'}</td></tr>)}</tbody></table></div>

        <div className="grid">
          <section className="panel"><div className="panel-title"><h2>Conciliação</h2><span>{base.status}</span></div><div className="rows"><div><span>Caixa final da DFC</span><strong>{brl(finalCash)}</strong></div><div><span>Caixa no Razão</span><strong>{brl(base.balanceCash * factor)}</strong></div><div><span>Diferença</span><strong className={Math.abs(reconciliation)<0.01?'positive':'negative'}>{brl(reconciliation)}</strong></div></div></section>
          <section className="panel"><div className="panel-title"><h2>Composição da geração</h2><span>Fluxos</span></div><div className="rows"><div><span>Operacional</span><strong>{brl(operational)}</strong></div><div><span>Investimentos</span><strong>{brl(investment)}</strong></div><div><span>Financiamentos</span><strong>{brl(financing)}</strong></div></div></section>
        </div>
        <div className="dre-foot"><span>Fonte: Diário Contábil → Razão → Motor DFC</span><span>{base.status === 'OK' ? '✓ Caixa conciliado' : '⚠ Revisar conciliação'}</span></div>
      </section>
    </section>
  </main>
}

function Card({title,value}:{title:string;value:number}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>motor contábil</small></div>}

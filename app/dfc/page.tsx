'use client'

import { useMemo, useState } from 'react'
import { cashFlowEngine } from '@/lib/dfc-engine'
import { periodFromMonths } from '@/lib/period-engine'

const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

type View = 'mensal' | 'acumulado'

export default function DFCPage(){
  const [view,setView] = useState<View>('mensal')
  const [month,setMonth] = useState(11)
  const period = useMemo(() => periodFromMonths(view === 'mensal' ? month + 1 : 1, month + 1), [view, month])
  const base = useMemo(() => cashFlowEngine(undefined, period), [period])
  const periodLabel = view === 'mensal' ? months[month] : `Jan–${months[month]}`

  const rows = [
    ['Fluxo de Caixa Operacional', base.operational],
    ['Fluxo de Caixa de Investimentos', base.investment],
    ['Fluxo de Caixa de Financiamentos', base.financing],
    ['Variação Líquida de Caixa', base.variation],
    ['Caixa Inicial', base.initialCash],
    ['Caixa Final', base.finalCash],
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
      <footer>V2.8 • Projeto Consultoria Financeira</footer>
    </aside>

    <section className="content">
      <header>
        <div><small>CONTROLADORIA FINANCEIRA</small><h1>DFC Gerencial</h1><p>Demonstração dos Fluxos de Caixa • Método indireto</p></div>
        <div className="period-controls"><label>PERÍODO DE ANÁLISE</label><div><select value={month} onChange={e=>setMonth(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i}>Data-base: {m}/2026</option>)}</select></div><span>{periodLabel}/2026</span></div>
      </header>

      <section className="panel wide">
        <div className="panel-title"><h2>DFC — visão gerencial</h2><span>{periodLabel}/2026</span></div>
        <div className="dre-toolbar">
          <div><span>VISÃO</span><div className="segmented"><button className={view==='mensal'?'selected':''} onClick={()=>setView('mensal')}>Mensal</button><button className={view==='acumulado'?'selected':''} onClick={()=>setView('acumulado')}>Acumulado</button></div></div>
        </div>

        <div className="cards">
          <Card title="Operacional" value={base.operational}/><Card title="Investimentos" value={base.investment}/><Card title="Financiamentos" value={base.financing}/><Card title="Variação Líquida" value={base.variation}/>
        </div>

        <div className="table-wrap dre-wrap"><table className="dre-table"><thead><tr><th>Fluxo de caixa</th><th>Realizado</th><th>Participação</th></tr></thead><tbody>{rows.map(([label,value])=><tr key={label}><td>{label}</td><td className="total-col">{brl(value)}</td><td>{base.variation ? `${(value / Math.abs(base.variation) * 100).toFixed(1).replace('.',',')}%` : '—'}</td></tr>)}</tbody></table></div>

        <div className="grid">
          <section className="panel"><div className="panel-title"><h2>Conciliação</h2><span>{base.status}</span></div><div className="rows"><div><span>Caixa final da DFC</span><strong>{brl(base.finalCash)}</strong></div><div><span>Caixa no Razão</span><strong>{brl(base.balanceCash)}</strong></div><div><span>Diferença</span><strong className={Math.abs(base.reconciliation)<0.01?'positive':'negative'}>{brl(base.reconciliation)}</strong></div></div></section>
          <section className="panel"><div className="panel-title"><h2>Composição da geração</h2><span>Fluxos</span></div><div className="rows"><div><span>Operacional</span><strong>{brl(base.operational)}</strong></div><div><span>Investimentos</span><strong>{brl(base.investment)}</strong></div><div><span>Financiamentos</span><strong>{brl(base.financing)}</strong></div></div></section>
        </div>
        <div className="dre-foot"><span>Fonte: Diário Contábil → Razão → Motor DFC • Competência</span><span>{base.status === 'OK' ? '✓ Caixa conciliado' : '⚠ Revisar conciliação'}</span></div>
      </section>
    </section>
  </main>
}

function Card({title,value}:{title:string;value:number}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>motor contábil</small></div>}

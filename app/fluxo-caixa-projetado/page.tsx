'use client'

import { useMemo, useState } from 'react'
import { projectedCashFlowEngine, projectedCashFlowSummary } from '@/lib/projected-cash-flow'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

type View = 'projecao' | 'comparativo'

export default function FluxoCaixaProjetado(){
 const [view,setView] = useState<View>('projecao')
 const [minimumCash,setMinimumCash] = useState(50000)
 const rows = useMemo(() => projectedCashFlowEngine(minimumCash), [minimumCash])
 const summary = useMemo(() => projectedCashFlowSummary(rows), [rows])
 const maxCash = Math.max(...rows.map(r => r.projectedClosingCash), 1)
 const critical = rows.filter(r => r.status !== 'OK')

 return <main className="shell">
  <aside className="side">
   <div className="brand"><b>BP</b><div><strong>BP Financeiro</strong><span>Controladoria & BI</span></div></div>
   <div className="company"><small>EMPRESA DEMONSTRATIVA</small><strong>Grupo Exemplo</strong><span>2026 • Modelo integrado</span></div>
   <nav>
    <a className="nav-link" href="/">← Voltar ao BP Financeiro</a>
    <div className="nav-divider">TESOURARIA</div>
    <a className="nav-link active">Fluxo de Caixa Projetado</a>
    <a className="nav-link" href="/fluxo">Fluxo de Caixa</a>
    <a className="nav-link" href="/contas-receber-pagar">Contas a Receber / Pagar</a>
    <div className="nav-divider">DEMONSTRAÇÕES</div>
    <a className="nav-link" href="/dre-gerencial">DRE Gerencial</a>
    <a className="nav-link" href="/balanco-gerencial">Balanço Gerencial</a>
   </nav>
   <footer>V1 • Projeção de Tesouraria</footer>
  </aside>

  <section className="content">
   <header>
    <div><small>CONTROLADORIA FINANCEIRA • TESOURARIA</small><h1>Fluxo de Caixa Projetado</h1><p>Projeção mensal de caixa • planejamento e antecipação de necessidade financeira</p></div>
    <div className="period-controls"><label>PREMISSAS</label><div><select value={minimumCash} onChange={e=>setMinimumCash(Number(e.target.value))}><option value={30000}>Caixa mínimo: R$ 30 mil</option><option value={50000}>Caixa mínimo: R$ 50 mil</option><option value={75000}>Caixa mínimo: R$ 75 mil</option><option value={100000}>Caixa mínimo: R$ 100 mil</option></select></div><span>Horizonte: Jan–Dez/2026</span></div>
   </header>

   <div className="dre-toolbar">
    <div><span>VISÃO</span><div className="segmented"><button className={view==='projecao'?'selected':''} onClick={()=>setView('projecao')}>Projeção</button><button className={view==='comparativo'?'selected':''} onClick={()=>setView('comparativo')}>Realizado × Projetado</button></div></div>
   </div>

   <div className="cards">
    <Card title="Caixa Inicial" value={summary.initialCash}/>
    <Card title="Variação Projetada" value={summary.totalVariation}/>
    <Card title="Caixa Final Projetado" value={summary.finalCash}/>
    <Card title="Menor Caixa Projetado" value={summary.minimumCash} note={`${summary.minimumMonth}/2026`}/>
   </div>

   {critical.length > 0 && <section className="panel" style={{borderLeft:'4px solid #c78317'}}><div className="panel-title"><h2>⚠ Atenção de Tesouraria</h2><span>{critical.length} mês(es)</span></div><div className="rows">{critical.map(r=><div className="row" key={r.month}><span>{r.month}/2026 • {r.status === 'CRÍTICO' ? 'caixa abaixo de zero' : 'abaixo do caixa mínimo'}</span><b className={r.status === 'CRÍTICO'?'negative':'warning'}>{brl(r.projectedClosingCash)}</b></div>)}</div></section>}

   {view==='projecao' ? <>
    <section className="panel wide"><div className="panel-title"><h2>Saldo de caixa projetado</h2><span>Caixa mínimo: {brl(minimumCash)}</span></div><div className="monthly-chart">{rows.map(r=><div className="month-col" key={r.month}><span className="month-value">{brl(r.projectedClosingCash)}</span><div className="month-bar"><i style={{height:`${Math.max(4,(r.projectedClosingCash/maxCash)*100)}%`}} /></div><span>{r.month}</span></div>)}</div></section>

    <section className="panel wide"><div className="panel-title"><h2>Projeção mensal</h2><span>Valores em R$</span></div><div className="table-wrap"><table><thead><tr><th>Mês</th><th>Caixa Inicial</th><th>Entradas / geração operacional</th><th>Investimentos</th><th>Financiamentos</th><th>Variação</th><th>Caixa Final</th><th>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r.month}><td>{r.month}/2026</td><td>{brl(r.openingCash)}</td><td>{brl(r.projectedOperatingCash)}</td><td className={r.projectedInvestment<0?'negative':''}>{brl(r.projectedInvestment)}</td><td>{brl(r.projectedFinancing)}</td><td className={r.projectedVariation>=0?'positive':'negative'}>{brl(r.projectedVariation)}</td><td><strong>{brl(r.projectedClosingCash)}</strong></td><td><span className="entry-tag">{r.status}</span></td></tr>)}</tbody></table></div><div className="note">A projeção V1 usa o orçamento gerencial como referência de receita e aplica a geração operacional observada, mantendo investimentos e financiamentos do cenário-base. É uma ferramenta de planejamento; não substitui a conciliação do caixa realizado.</div></section>
   </> : <section className="panel wide"><div className="panel-title"><h2>Realizado × Projetado</h2><span>Caixa final mensal</span></div><div className="table-wrap"><table><thead><tr><th>Mês</th><th>Realizado</th><th>Projetado</th><th>Desvio</th><th>Leitura</th></tr></thead><tbody>{rows.map(r=><tr key={r.month}><td>{r.month}/2026</td><td>{brl(r.realizedClosingCash)}</td><td>{brl(r.projectedClosingCash)}</td><td className={r.varianceCash>=0?'positive':'negative'}>{brl(r.varianceCash)}</td><td>{r.varianceCash>=0?'Projeção acima do realizado':'Projeção abaixo do realizado'}</td></tr>)}</tbody></table></div></section>}

   <div className="dre-foot"><span>Fonte: DRE gerencial + orçamento + DFC • Motor de projeção V1</span><span>{summary.negativeMonths === 0 ? '✓ Sem meses com caixa negativo' : `⚠ ${summary.negativeMonths} mês(es) com caixa negativo`}</span></div>
  </section>
 </main>
}

function Card({title,value,note}:{title:string;value:number;note?:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{note || 'cenário projetado'}</small></div>}

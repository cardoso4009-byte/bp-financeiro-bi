'use client'

import { monthlyData } from '@/lib/monthly-data'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const pct = (n: number) => `${(n * 100).toFixed(1).replace('.', ',')}%`

const budget = monthlyData.map((m) => {
  const receitaBruta = m.receitaBruta * 0.98
  const receitaLiquida = receitaBruta * 0.90
  const custos = -receitaBruta * 0.48
  const opex = -receitaBruta * 0.18
  const ebitda = receitaLiquida + custos + opex
  return { receitaLiquida, opex, ebitda }
})

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const actualRevenue = sum(monthlyData.map(m => m.receitaLiquida))
const budgetRevenue = sum(budget.map(m => m.receitaLiquida))
const actualOpex = sum(monthlyData.map(m => m.opex))
const budgetOpex = sum(budget.map(m => m.opex))
const actualEbitda = sum(monthlyData.map(m => m.ebitda))
const budgetEbitda = sum(budget.map(m => m.ebitda))
const revenueVar = actualRevenue - budgetRevenue
const opexVar = actualOpex - budgetOpex
const ebitdaVar = actualEbitda - budgetEbitda

export default function Gestao() {
  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
    <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Gestão Financeira</h1><p>Orçado × Realizado • Diagnóstico gerencial • Modelo demonstrativo</p></div><div className="period">Jan–Dez 2026</div></header>

    <div className="cards">
      <Card title="Receita Líquida — Realizado" value={actualRevenue} sub={`Orçado ${brl(budgetRevenue)}`} />
      <Card title="OPEX — Realizado" value={actualOpex} sub={`Orçado ${brl(budgetOpex)}`} />
      <Card title="EBITDA — Realizado" value={actualEbitda} sub={`Orçado ${brl(budgetEbitda)}`} />
      <Card title="Geração Operacional" value={sum(monthlyData.map(m => m.caixaOperacional))} sub="Fluxo de caixa operacional" />
    </div>

    <section className="panel wide"><div className="panel-title"><h2>Orçado × Realizado</h2><span>Visão anual</span></div>
      <table><thead><tr><td>Indicador</td><td>Orçado</td><td>Realizado</td><td>Variação</td><td>Status</td></tr></thead><tbody>
        <Metric name="Receita Líquida" budget={budgetRevenue} actual={actualRevenue} favorable={revenueVar >= 0}/>
        <Metric name="OPEX" budget={budgetOpex} actual={actualOpex} favorable={Math.abs(actualOpex) <= Math.abs(budgetOpex)}/>
        <Metric name="EBITDA" budget={budgetEbitda} actual={actualEbitda} favorable={ebitdaVar >= 0}/>
      </tbody></table>
    </section>

    <div className="grid"><section className="panel"><div className="panel-title"><h2>Diagnóstico automático</h2><span>Motor V2</span></div>
      <Diagnosis good={revenueVar >= 0} title="Receita" text={`Realizado ${pct(revenueVar / budgetRevenue)} ${revenueVar >= 0 ? 'acima' : 'abaixo'} do orçamento.`}/>
      <Diagnosis good={Math.abs(actualOpex) <= Math.abs(budgetOpex)} title="OPEX" text={`Desvio de ${pct(Math.abs(opexVar) / Math.abs(budgetOpex))} contra o orçamento. ${Math.abs(actualOpex) > Math.abs(budgetOpex) ? 'Atenção à pressão de despesas.' : 'Despesa sob controle.'}`}/>
      <Diagnosis good={ebitdaVar >= 0} title="EBITDA" text={`Resultado ${brl(ebitdaVar)} versus orçamento. ${ebitdaVar < 0 ? 'Investigar margem e estrutura de custos.' : 'Conversão operacional favorável.'}`}/>
    </section><section className="panel"><div className="panel-title"><h2>Leitura do caixa</h2><span>2026</span></div>
      <div className="note">A geração operacional de caixa deve ser analisada em conjunto com o lucro. O próximo módulo será Capital de Giro, conectando contas a receber, estoques e fornecedores à geração de caixa.</div>
      <div className="check"><i className="ok">✓</i><div><b>Caixa operacional positivo</b><small>{brl(sum(monthlyData.map(m => m.caixaOperacional)))}</small></div></div>
      <div className="check"><i className="ok">✓</i><div><b>Modelo integrado</b><small>DRE • BP • DFC • DMPL</small></div></div>
    </section></div>

    <section className="panel"><div className="panel-title"><h2>Próximas análises</h2><span>Roadmap</span></div><div className="rows">
      <div className="row"><span>01 • Capital de Giro</span><b>Próximo</b></div>
      <div className="row"><span>02 • Fluxo de Caixa Projetado</span><b>Planejado</b></div>
      <div className="row"><span>03 • Base de lançamentos financeiros</span><b>Planejado</b></div>
      <div className="row"><span>04 • Diagnóstico e recomendações</span><b>Planejado</b></div>
    </div></section>
  </main>
}

function Card({ title, value, sub }: { title: string, value: number, sub: string }) { return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div> }
function Metric({ name, budget, actual, favorable }: { name: string, budget: number, actual: number, favorable: boolean }) { const variance = actual - budget; return <tr><td>{name}</td><td>{brl(budget)}</td><td>{brl(actual)}</td><td>{brl(variance)}</td><td><span style={{ fontWeight: 700, color: favorable ? '#1d8a58' : '#c33' }}>{favorable ? 'FAVORÁVEL' : 'ATENÇÃO'}</span></td></tr> }
function Diagnosis({ good, title, text }: { good: boolean, title: string, text: string }) { return <div className="check"><i className={good ? 'ok' : 'bad'}>{good ? '✓' : '!'}</i><div><b>{title}</b><small>{text}</small></div></div> }

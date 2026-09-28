'use client'

import { useMemo, useState } from 'react'
import ReportPeriodFilter, { DEFAULT_REPORT_PERIOD, type ReportPeriod } from '@/components/report-period-filter'
import { monthLabel } from '@/lib/report-period'
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

type Metrics = {
  revenue: number
  budgetRevenue: number
  opex: number
  budgetOpex: number
  ebitda: number
  budgetEbitda: number
  cash: number
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

function metricsFor(months: number[]): Metrics {
  const indexes = months.map(month => month - 1)
  return {
    revenue: sum(indexes.map(i => monthlyData[i]?.receitaLiquida ?? 0)),
    budgetRevenue: sum(indexes.map(i => budget[i]?.receitaLiquida ?? 0)),
    opex: sum(indexes.map(i => monthlyData[i]?.opex ?? 0)),
    budgetOpex: sum(indexes.map(i => budget[i]?.opex ?? 0)),
    ebitda: sum(indexes.map(i => monthlyData[i]?.ebitda ?? 0)),
    budgetEbitda: sum(indexes.map(i => budget[i]?.ebitda ?? 0)),
    cash: sum(indexes.map(i => monthlyData[i]?.caixaOperacional ?? 0)),
  }
}

export default function Gestao() {
  const [period, setPeriod] = useState<ReportPeriod>({ ...DEFAULT_REPORT_PERIOD, month: 12 })
  const months = useMemo(() => period.view === 'acumulado'
    ? Array.from({ length: period.month }, (_, i) => i + 1)
    : [period.month], [period])

  const current = useMemo(() => metricsFor(months), [months])
  const previous = useMemo(() => {
    if (period.month === 1) return metricsFor([12])
    return metricsFor([period.month - 1])
  }, [period.month])

  const displayLabel = period.view === 'acumulado'
    ? `Jan–${monthLabel(period.month)}/${period.year}`
    : `${monthLabel(period.month)}/${period.year}`

  const revenueVar = current.revenue - current.budgetRevenue
  const opexVar = current.opex - current.budgetOpex
  const ebitdaVar = current.ebitda - current.budgetEbitda

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
    <header>
      <div><small>CONTROLADORIA FINANCEIRA</small><h1>Gestão Financeira</h1><p>Orçado × Realizado • Diagnóstico gerencial • Modelo demonstrativo</p></div>
      <ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]} />
    </header>

    <div className="cards">
      <Card title="Receita Líquida — Realizado" value={current.revenue} sub={`Orçado ${brl(current.budgetRevenue)}`} />
      <Card title="OPEX — Realizado" value={current.opex} sub={`Orçado ${brl(current.budgetOpex)}`} />
      <Card title="EBITDA — Realizado" value={current.ebitda} sub={`Orçado ${brl(current.budgetEbitda)}`} />
      <Card title="Geração Operacional" value={current.cash} sub="Fluxo de caixa operacional" />
    </div>

    <section className="panel wide"><div className="panel-title"><h2>Orçado × Realizado</h2><span>{displayLabel}</span></div>
      <table><thead><tr><td>Indicador</td><td>Orçado</td><td>Realizado</td><td>Variação</td><td>Status</td></tr></thead><tbody>
        <Metric name="Receita Líquida" budget={current.budgetRevenue} actual={current.revenue} favorable={revenueVar >= 0}/>
        <Metric name="OPEX" budget={current.budgetOpex} actual={current.opex} favorable={Math.abs(current.opex) <= Math.abs(current.budgetOpex)}/>
        <Metric name="EBITDA" budget={current.budgetEbitda} actual={current.ebitda} favorable={ebitdaVar >= 0}/>
      </tbody></table>
    </section>

    {period.view === 'comparativo' && <section className="panel wide"><div className="panel-title"><h2>Comparativo com período anterior</h2><span>{displayLabel}</span></div>
      <table><thead><tr><td>Indicador</td><td>Período atual</td><td>Anterior</td><td>Variação</td></tr></thead><tbody>
        <CompareRow name="Receita Líquida" current={current.revenue} previous={previous.revenue}/>
        <CompareRow name="OPEX" current={current.opex} previous={previous.opex}/>
        <CompareRow name="EBITDA" current={current.ebitda} previous={previous.ebitda}/>
      </tbody></table>
    </section>}

    <div className="grid"><section className="panel"><div className="panel-title"><h2>Diagnóstico automático</h2><span>Motor V2</span></div>
      <Diagnosis good={revenueVar >= 0} title="Receita" text={`Realizado ${pct(current.budgetRevenue ? revenueVar / current.budgetRevenue : 0)} ${revenueVar >= 0 ? 'acima' : 'abaixo'} do orçamento.`}/>
      <Diagnosis good={Math.abs(current.opex) <= Math.abs(current.budgetOpex)} title="OPEX" text={`Desvio de ${pct(current.budgetOpex ? Math.abs(opexVar) / Math.abs(current.budgetOpex) : 0)} contra o orçamento. ${Math.abs(current.opex) > Math.abs(current.budgetOpex) ? 'Atenção à pressão de despesas.' : 'Despesa sob controle.'}`}/>
      <Diagnosis good={ebitdaVar >= 0} title="EBITDA" text={`Resultado ${brl(ebitdaVar)} versus orçamento. ${ebitdaVar < 0 ? 'Investigar margem e estrutura de custos.' : 'Conversão operacional favorável.'}`}/>
    </section><section className="panel"><div className="panel-title"><h2>Leitura do caixa</h2><span>{displayLabel}</span></div>
      <div className="note">A geração operacional de caixa deve ser analisada em conjunto com o lucro. O módulo de <a href="/capital-giro" style={{ fontWeight: 700 }}>Capital de Giro</a> conecta contas a receber, estoques e fornecedores à geração de caixa.</div>
      <div className="check"><i className="ok">✓</i><div><b>Caixa operacional positivo</b><small>{brl(current.cash)}</small></div></div>
      <div className="check"><i className="ok">✓</i><div><b>Modelo integrado</b><small>DRE • BP • DFC • DMPL</small></div></div>
    </section></div>

    <section className="panel"><div className="panel-title"><h2>Próximas análises</h2><span>Roadmap</span></div><div className="rows">
      <div className="row"><span>01 • <a href="/capital-giro" style={{ fontWeight: 700 }}>Capital de Giro</a></span><b>Disponível</b></div>
      <div className="row"><span>02 • Fluxo de Caixa Projetado</span><b>Próximo</b></div>
      <div className="row"><span>03 • Base de lançamentos financeiros</span><b>Planejado</b></div>
      <div className="row"><span>04 • Diagnóstico e recomendações</span><b>Planejado</b></div>
    </div></section>
  </main>
}

function Card({ title, value, sub }: { title: string, value: number, sub: string }) { return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div> }
function Metric({ name, budget, actual, favorable }: { name: string, budget: number, actual: number, favorable: boolean }) { const variance = actual - budget; return <tr><td>{name}</td><td>{brl(budget)}</td><td>{brl(actual)}</td><td>{brl(variance)}</td><td><span style={{ fontWeight: 700, color: favorable ? '#1d8a58' : '#c33' }}>{favorable ? 'FAVORÁVEL' : 'ATENÇÃO'}</span></td></tr> }
function CompareRow({ name, current, previous }: { name: string, current: number, previous: number }) { const variance = current - previous; return <tr><td>{name}</td><td>{brl(current)}</td><td>{brl(previous)}</td><td>{brl(variance)}</td></tr> }
function Diagnosis({ good, title, text }: { good: boolean, title: string, text: string }) { return <div className="check"><i className={good ? 'ok' : 'bad'}>{good ? '✓' : '!'}</i><div><b>{title}</b><small>{text}</small></div></div> }

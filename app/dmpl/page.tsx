'use client'

import { useMemo, useState } from 'react'
import { buildDmpl } from '@/lib/dmpl-engine'
import { integratedJournal } from '@/lib/accounting-core'
import { openingBalance } from '@/lib/financial-core'
import { REPORT_MONTHS, type ReportPeriod } from '@/lib/report-period'
import ReportPeriodFilter from '@/components/report-period-filter'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const competence = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`
const entryCompetence = (entry: typeof integratedJournal[number]) => entry.competence || entry.date.slice(0, 7)
const availableCompetences = Array.from(new Set(integratedJournal.map(entryCompetence))).sort()
const availableYears = Array.from(new Set(availableCompetences.map(value => Number(value.slice(0, 4))))).filter(Number.isFinite).sort((a, b) => a - b)
const latestCompetence = availableCompetences.at(-1)
const defaultYear = latestCompetence ? Number(latestCompetence.slice(0, 4)) : 2026
const defaultMonth = latestCompetence ? Number(latestCompetence.slice(5, 7)) : 12

export default function DMPLReconciliationPage() {
  const [period, setPeriod] = useState<ReportPeriod>({ year: defaultYear, month: defaultMonth, view: 'mensal' })
  const current = useMemo(() => buildForPeriod(period), [period])
  const previousPeriod = useMemo(() => {
    const previousMonth = period.month === 1 ? 12 : period.month - 1
    const previousYear = period.month === 1 ? period.year - 1 : period.year
    return { ...period, year: previousYear, month: previousMonth, view: 'mensal' as const }
  }, [period])
  const previous = useMemo(() => {
    if (!hasCompetence(previousPeriod.year, previousPeriod.month)) return null
    return buildForPeriod(previousPeriod)
  }, [previousPeriod])
  const d = current
  const ok = d.status === 'OK'
  const adjustmentNeeded = -d.diferenca
  const causes = [
    ['Ajustes de exercícios anteriores', 'Revisar lançamentos de períodos anteriores transferidos para o PL.'],
    ['Reservas de lucros ou capital', 'Verificar constituição, reversão ou transferência entre contas patrimoniais.'],
    ['Ajustes de avaliação patrimonial', 'Verificar lançamentos de avaliação que não passam pelo resultado.'],
    ['Aumento ou redução de capital', 'Conferir integralizações, reduções e demais movimentações de capital.'],
    ['Outros movimentos patrimoniais', 'Identificar lançamentos diretamente no PL sem classificação na ponte.'],
    ['Classificação contábil', 'Conferir se algum lançamento foi contabilizado no PL, mas não está mapeado na DMPL.'],
  ]

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
    <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>DMPL</h1><p>Demonstrações integradas • Regime de competência</p></div><div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}><ReportPeriodFilter value={period} onChange={setPeriod} years={availableYears.length ? availableYears : [2026]} /><div className="period">{ok ? '✓ RECONCILIADO' : '! PENDÊNCIA'}</div></div></header>

    {period.view === 'comparativo' && <section className="panel wide" style={{ marginBottom: 18 }}><div className="panel-title"><h2>Comparativo da movimentação do PL</h2><span>{previous ? `${REPORT_MONTHS[previousPeriod.month - 1]} / ${previousPeriod.year} × ${REPORT_MONTHS[period.month - 1]} / ${period.year}` : 'Sem período anterior disponível'}</span></div>{previous ? <div className="indicator-grid"><Metric title="Lucro líquido" value={brl(d.lucroLiquido)} delta={d.lucroLiquido - previous.lucroLiquido} /><Metric title="PL calculado" value={brl(d.plCalculado)} delta={d.plCalculado - previous.plCalculado} /><Metric title="PL contábil" value={brl(d.plContabil)} delta={d.plContabil - previous.plContabil} /><Metric title="Diferença" value={brl(Math.abs(d.diferenca))} delta={Math.abs(d.diferenca) - Math.abs(previous.diferenca)} /></div> : <div className="note">Não há dados disponíveis para o período imediatamente anterior.</div>}</section>}

    <section className="panel wide"><div className="panel-title"><div><h2>DMPL — Ponte do Patrimônio Líquido</h2><span>{periodLabel(period)}</span></div><span>{period.view === 'mensal' ? 'MÊS' : period.view === 'acumulado' ? 'ACUMULADO' : 'MÊS COMPARADO'}</span></div>
      <div className="table-wrap"><table><tbody>
        <tr><td>PL Inicial</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{brl(d.plInicial)}</td></tr>
        <tr><td>(+) Lucro Líquido</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{brl(d.lucroLiquido)}</td></tr>
        <tr><td>(-) Dividendos / Distribuições</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{brl(d.dividendos)}</td></tr>
        <tr><td>(+/-) Outros movimentos</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{brl(d.outrosMovimentos)}</td></tr>
        <tr style={{ background: 'var(--panel-muted, #f5f7fa)' }}><td><strong>= PL Calculado pela Ponte</strong></td><td style={{ textAlign: 'right', fontWeight: 800 }}>{brl(d.plCalculado)}</td></tr>
        <tr><td>PL Final contábil</td><td style={{ textAlign: 'right', fontWeight: 800 }}>{brl(d.plContabil)}</td></tr>
        <tr style={{ background: ok ? '#eefbf3' : '#fff4f4' }}><td><strong>{ok ? '✓ Reconciliação' : '⚠ Diferença não explicada'}</strong></td><td style={{ textAlign: 'right', fontWeight: 800 }}>{brl(Math.abs(d.diferenca))}</td></tr>
      </tbody></table></div>
      {!ok && <><div className="note" style={{ marginTop: 20, borderLeft: '4px solid #d92d20' }}><strong>Reconciliação pendente.</strong> A ponte explica <strong>{brl(d.plCalculado)}</strong>, enquanto o PL Final contábil é <strong>{brl(d.plContabil)}</strong>. O movimento patrimonial mínimo necessário para fechar a ponte é <strong>{brl(adjustmentNeeded)}</strong>.</div>
        <div style={{ marginTop: 24 }}><div className="panel-title" style={{ marginBottom: 12 }}><h2>Diagnóstico da diferença</h2><span>INVESTIGAR</span></div><p style={{ margin: '0 0 16px', color: '#667085' }}>As opções abaixo são <strong>hipóteses de investigação</strong>, não causas confirmadas.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>{causes.map(([title, description], index) => <div key={title} style={{ border: '1px solid #e4e7ec', borderRadius: 10, padding: 16, background: '#fff' }}><div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ minWidth: 28, height: 28, borderRadius: 14, background: '#eef4fb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#24558a' }}>{index + 1}</span><div><strong>{title}</strong><div style={{ marginTop: 6, color: '#667085', fontSize: 13, lineHeight: 1.5 }}>{description}</div></div></div></div>)}</div></div>
        <div className="note" style={{ marginTop: 20, borderLeft: '4px solid #24558a' }}><strong>Cenário de reconciliação:</strong> se a diferença de <strong>{brl(adjustmentNeeded)}</strong> for identificada e classificada como movimento patrimonial válido, a ponte passará de <strong>{brl(d.plCalculado)}</strong> para <strong>{brl(d.plContabil)}</strong>.<br />O BI não lança esse ajuste automaticamente: ele deve ser confirmado na contabilidade.</div></>}
      {ok && <div className="note" style={{ marginTop: 20 }}>A ponte do patrimônio líquido está integralmente reconciliada com o PL Final contábil.</div>}
    </section>
    <section className="panel"><div className="panel-title"><h2>Regra de auditoria</h2><span>{ok ? 'OK' : 'REVISAR'}</span></div><div className="check"><i className={ok ? 'ok' : 'bad'}>{ok ? '✓' : '!'}</i><div><b>PL Inicial + Resultado + Distribuições + Outros movimentos = PL Final</b><small>{ok ? 'Todos os movimentos patrimoniais estão explicados.' : `Diferença encontrada: ${brl(Math.abs(d.diferenca))}. O BI não deve forçar o fechamento da demonstração.`}</small></div></div></section>
  </main>
}

function hasCompetence(year: number, month: number) {
  const key = competence(year, month)
  return integratedJournal.some(entry => entryCompetence(entry) === key)
}

function buildForPeriod(period: ReportPeriod) {
  const selected = competence(period.year, period.month)
  const entries = period.view === 'mensal' || period.view === 'comparativo'
    ? integratedJournal.filter(entry => entryCompetence(entry) === selected)
    : integratedJournal.filter(entry => { const c = entryCompetence(entry); return c >= `${period.year}-01` && c <= selected })

  // Em visão mensal/comparativa, a abertura é o PL de fechamento da
  // competência anterior. Em acumulado, a abertura é o saldo de 31/12.
  const plInicial = period.view === 'acumulado'
    ? openingBalance.equity
    : openingBalance.equity + buildNetIncomeUntil(period.year, period.month - 1)

  return buildDmpl(entries, plInicial, 0, 0)
}

function buildNetIncomeUntil(year: number, month: number) {
  if (month <= 0) return buildNetIncomeForEntries(integratedJournal.filter(entry => entryCompetence(entry).slice(0, 4) < String(year)))
  const end = competence(year, month)
  return buildNetIncomeForEntries(integratedJournal.filter(entry => entryCompetence(entry) < end))
}

function buildNetIncomeForEntries(entries: typeof integratedJournal) {
  return buildDmpl(entries, 0, 0, 0).lucroLiquido
}

function periodLabel(period: ReportPeriod) {
  const month = REPORT_MONTHS[period.month - 1]
  return period.view === 'acumulado' ? `Jan–${month}/${period.year}` : `${month}/${period.year}`
}

function Metric({ title, value, delta }: { title: string; value: string; delta: number }) {
  return <div className="indicator"><span>{title}</span><strong>{value}</strong><small>Δ vs. período anterior: {brl(delta)}</small></div>
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildCashForecast, forecastStatus, workingCapitalMetrics, type Scenario } from '@/lib/fluxo-caixa-projetado'
import { initialEntries, type FinancialEntry } from '@/lib/lancamentos-data'
import { readFinancialSource } from '@/lib/financial-source'
import { openReceivablesPayables } from '@/lib/contas-receber-pagar'
import ReportPeriodFilter, { type ReportPeriod } from '@/components/report-period-filter'
import { DEFAULT_REPORT_PERIOD, REPORT_MONTHS, competence } from '@/lib/report-period'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
type Kind = 'inflows' | 'operatingOutflows' | 'capex' | 'financing'
const groups = [
  { key: 'inflows' as Kind, label: 'Entradas', children: ['Recebimentos de clientes', 'Outras receitas'] },
  { key: 'operatingOutflows' as Kind, label: 'Saídas Operacionais', children: ['Pessoal', 'Fornecedores', 'Impostos', 'Administrativas', 'Comerciais'] },
  { key: 'capex' as Kind, label: 'CAPEX', children: ['Equipamentos', 'Obras', 'Tecnologia'] },
  { key: 'financing' as Kind, label: 'Financiamentos', children: ['Novos financiamentos', 'Amortizações', 'Juros'] },
]

export default function FluxoCaixa() {
  const [scenario, setScenario] = useState<Scenario>('base')
  const [period, setPeriod] = useState<ReportPeriod>({ ...DEFAULT_REPORT_PERIOD, month: 12 })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [entries, setEntries] = useState<FinancialEntry[]>(initialEntries)

  useEffect(() => setEntries(readFinancialSource().entries), [])

  const all = useMemo(() => buildCashForecast(scenario), [scenario])
  const start = period.view === 'acumulado' ? 0 : period.month - 1
  const end = period.month - 1
  const rows = all.slice(start, end + 1)
  const previousMonth = period.month === 1 ? 12 : period.month - 1
  const previousYear = period.month === 1 ? period.year - 1 : period.year
  const status = forecastStatus(rows)
  const wc = useMemo(() => workingCapitalMetrics(scenario), [scenario])
  const actual = useMemo(() => buildActualCash(entries), [entries])
  const alerts = useMemo(() => buildCashAlerts(rows, actual.slice(start, end + 1)), [rows, actual, start, end])
  const min = rows.length ? Math.min(...rows.map(r => r.closing)) : 0
  const max = rows.length ? Math.max(...rows.map(r => r.closing)) : 0
  const total = (field: Kind | 'net') => rows.reduce((s, r) => s + r[field], 0)
  const toggle = (key: string) => setExpanded(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next })
  const openItems = useMemo(() => openReceivablesPayables(entries, `${period.year}-12-31`), [entries, period.year])
  const duePlan = useMemo(() => REPORT_MONTHS.map((month, i) => {
    const key = competence(period.year, i + 1)
    const due = openItems.filter(x => x.dueDate.startsWith(key))
    return { month, receber: due.filter(x => x.direction === 'Receber').reduce((s, x) => s + Math.abs(x.value), 0), pagar: due.filter(x => x.direction === 'Pagar').reduce((s, x) => s + Math.abs(x.value), 0), count: due.length }
  }), [openItems, period.year])
  const selectedDue = duePlan.slice(start, end + 1)
  const previousRows = all.filter(r => r.month === REPORT_MONTHS[previousMonth - 1])
  const previousNet = previousRows.reduce((s, r) => s + r.net, 0)
  const currentNet = total('net')
  const variation = previousNet !== 0 ? (currentNet - previousNet) / Math.abs(previousNet) : null
  const label = period.view === 'mensal' ? `${REPORT_MONTHS[period.month - 1]}/${period.year}` : `Jan–${REPORT_MONTHS[period.month - 1]}/${period.year}`

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1500, margin: '0 auto' }}>
    <header><div><small>PLANEJAMENTO FINANCEIRO</small><h1>Fluxo de Caixa Gerencial</h1><p>Período de análise • Cenários • Alertas de liquidez • Capital de Giro</p></div><div><ReportPeriodFilter value={period} onChange={p => { setPeriod(p); setExpanded(new Set()) }} years={[2026]} /></div></header>
    <section className="panel wide"><div className="panel-title"><div><h2>Parâmetros de planejamento</h2><span>O cenário continua sendo uma premissa de planejamento; o filtro de período define a competência analisada.</span></div><div className="segmented">{(['base', 'otimista', 'pessimista'] as Scenario[]).map(s => <button type="button" key={s} className={scenario === s ? 'selected' : ''} onClick={() => setScenario(s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}</div></div></section>
    <div className="cards"><Card title="Caixa Inicial" value={rows.length ? rows[0].opening : 0} /><Card title="Menor Caixa" value={min} /><Card title="Maior Caixa" value={max} /><Card title="Caixa Final" value={rows.length ? rows[rows.length - 1].closing : 0} /></div>
    {period.view === 'comparativo' && <section className="panel wide"><div className="panel-title"><div><h2>Análise Comparativa</h2><span>{REPORT_MONTHS[period.month - 1]}/{period.year} × {REPORT_MONTHS[previousMonth - 1]}/{previousYear}</span></div><span>Variação de caixa</span></div><div className="rows"><div className="row"><span>Variação atual</span><b>{brl(currentNet)}</b></div><div className="row"><span>Variação anterior</span><b>{brl(previousNet)}</b></div><div className="row"><span>Variação relativa</span><b>{variation === null ? '—' : `${(variation * 100).toFixed(1).replace('.', ',')}%`}</b></div></div></section>}
    <section className="panel wide"><div className="panel-title"><div><h2>Projeção mensal</h2><span>{period.view === 'acumulado' ? `Acumulado até ${label}` : `Competência ${label}`}</span></div><span>{status.status}</span></div><div className="table-wrap"><table><thead><tr><th style={{ textAlign: 'left' }}>Conta</th>{rows.map(r => <th key={r.month}>{r.month}</th>)}<th>Total</th></tr></thead><tbody>
      <CashLine label="Caixa Inicial" values={rows.map(r => r.opening)} bold totalMode="position" />
      {groups.map(g => <CashGroup key={g.key} group={g} rows={rows} expanded={expanded} toggle={toggle} />)}
      <CashLine label="Variação de Caixa" values={rows.map(r => r.net)} bold />
      <CashLine label="Caixa Final" values={rows.map(r => r.closing)} bold totalMode="position" />
    </tbody></table></div></section>
    <section className="panel wide"><div className="panel-title"><div><h2>Vencimentos em aberto</h2><span>Recebimentos e obrigações por mês • origem: títulos ainda não liquidados</span></div><span>{selectedDue.reduce((s, x) => s + x.count, 0)} título(s) no período</span></div><div className="table-wrap"><table><thead><tr><th style={{ textAlign: 'left' }}>Indicador</th>{selectedDue.map(x => <th key={x.month}>{x.month}</th>)}<th>Total</th></tr></thead><tbody><OpenCashLine label="Recebimentos em aberto" values={selectedDue.map(x => x.receber)} /><OpenCashLine label="Obrigações em aberto" values={selectedDue.map(x => -x.pagar)} /><OpenCashLine label="Impacto líquido potencial" values={selectedDue.map(x => x.receber - x.pagar)} bold /></tbody></table></div><div className="note" style={{ marginTop: 12 }}>Este quadro conecta o contas a receber/pagar ao planejamento de caixa. Os valores mostram compromissos e recebimentos ainda não liquidados pela data de vencimento; não são somados novamente ao realizado pago.</div></section>
    <section className="panel wide"><div className="panel-title"><div><h2>Orçado × Realizado</h2><span>Comparação mensal de entradas, saídas e variação de caixa</span></div><span>Base financeira</span></div><div className="table-wrap"><table><thead><tr><th style={{ textAlign: 'left' }}>Indicador</th>{rows.map(r => <th key={r.month}>{r.month}</th>)}<th>Total</th></tr></thead><tbody><BudgetCashLine label="Entradas" budget={rows.map(r => r.inflows)} actual={rows.map((_, i) => actual[start + i].inflows)} /><BudgetCashLine label="Saídas Operacionais" budget={rows.map(r => -r.operatingOutflows)} actual={rows.map((_, i) => -actual[start + i].operatingOutflows)} /><BudgetCashLine label="CAPEX" budget={rows.map(r => -r.capex)} actual={rows.map((_, i) => -actual[start + i].capex)} /><BudgetCashLine label="Variação de Caixa" budget={rows.map(r => r.net)} actual={rows.map((_, i) => actual[start + i].net)} /></tbody></table></div><div className="note" style={{ marginTop: 12 }}>O “Orçado” usa a projeção do cenário selecionado. O “Realizado” considera lançamentos efetivamente pagos na base financeira; itens sem pagamento não entram no realizado de caixa.</div></section>
    <section className="panel wide"><div className="panel-title"><div><h2>Alertas e desvios</h2><span>Indicadores que pedem atenção gerencial</span></div><span>{alerts.length} alerta(s)</span></div>{alerts.length === 0 ? <div className="note">Nenhum desvio relevante identificado no período selecionado.</div> : <div className="rows">{alerts.map((a, i) => <div className="row" key={i}><span><b>{a.level}</b> {a.title}<small style={{ display: 'block', color: '#667085' }}>{a.detail}</small></span><b>{a.variation}</b></div>)}</div>}</section>
    <section className="panel"><div className="panel-title"><div><h2>Capital de Giro</h2><span>Indicadores que explicam a pressão sobre o caixa</span></div><span>{scenario[0].toUpperCase() + scenario.slice(1)}</span></div><div className="cards"><Metric title="PMR" value={`${wc.pmr} dias`} help="Prazo médio de recebimento" /><Metric title="PME" value={`${wc.pme} dias`} help="Prazo médio de estoque" /><Metric title="PMP" value={`${wc.pmp} dias`} help="Prazo médio de pagamento" /><Metric title="Ciclo Financeiro" value={`${wc.cicloFinanceiro} dias`} help="PMR + PME − PMP" /><Metric title="Necessidade de Capital de Giro" value={brl(wc.necessidadeCapitalGiro)} help="Recebíveis + estoque − fornecedores" /></div><div className="note" style={{ marginTop: 12 }}>Leitura: quanto maior o ciclo financeiro, mais recursos ficam presos na operação. A NCG mostra o capital necessário para sustentar esse ciclo.</div></section>
    <div className="grid"><section className="panel"><div className="panel-title"><div><h2>Diagnóstico</h2><span>{status.status}</span></div><span>Decisão</span></div><div className="note"><strong>{status.title}</strong><p>{status.detail}</p><p>Caixa mínimo: <strong>{rows.length ? brl(rows[0].minimum) : '—'}</strong>.</p></div></section><section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Decisão</span></div><div className="rows"><div className="row"><span>Entradas projetadas</span><b>{brl(total('inflows'))}</b></div><div className="row"><span>Saídas operacionais</span><b>{brl(total('operatingOutflows'))}</b></div><div className="row"><span>CAPEX</span><b>{brl(total('capex'))}</b></div><div className="row"><span>Variação do período</span><b>{brl(currentNet)}</b></div><div className="row"><span>Ciclo financeiro</span><b>{wc.cicloFinanceiro} dias</b></div><div className="row"><span>Recebimentos em aberto</span><b>{brl(selectedDue.reduce((s, x) => s + x.receber, 0))}</b></div><div className="row"><span>Obrigações em aberto</span><b>{brl(selectedDue.reduce((s, x) => s + x.pagar, 0))}</b></div></div></section></div>
    <section className="panel"><div className="panel-title"><h2>Alavancas de caixa</h2><span>Consultoria</span></div><div className="note">Use os cenários para testar recebimentos, custos, CAPEX e financiamentos. Os alertas destacam desvios relevantes para priorizar a análise e a ação.</div></section>
  </main>
}

function buildActualCash(entries: FinancialEntry[]) {
  return REPORT_MONTHS.map((_, i) => {
    const month = `2026-${String(i + 1).padStart(2, '0')}`
    const paid = entries.filter(e => e.status === 'Pago' && e.paymentDate?.startsWith(month))
    const inflows = paid.filter(e => e.type === 'Receita').reduce((s, e) => s + e.value, 0)
    const operatingOutflows = paid.filter(e => e.type === 'Despesa').reduce((s, e) => s + e.value, 0)
    const capex = paid.filter(e => e.type === 'CAPEX').reduce((s, e) => s + e.value, 0)
    const financing = paid.filter(e => e.type === 'Financiamento').reduce((s, e) => s + e.value, 0)
    return { inflows, operatingOutflows, capex, financing, net: inflows - operatingOutflows - capex + financing }
  })
}

function buildCashAlerts(rows: any[], actual: any[]) {
  const alerts: any[] = []
  rows.forEach((r, i) => {
    const a = actual[i]
    if (!a) return
    const checks = [{ name: 'Entradas', b: r.inflows, a: a.inflows }, { name: 'Saídas Operacionais', b: -r.operatingOutflows, a: -a.operatingOutflows }, { name: 'CAPEX', b: -r.capex, a: -a.capex }, { name: 'Variação de Caixa', b: r.net, a: a.net }]
    checks.forEach(c => {
      if (Math.abs(c.b) < 1) return
      const pct = (c.a - c.b) / Math.abs(c.b)
      if (Math.abs(pct) >= 0.15) {
        const favorable = c.name === 'Entradas' ? pct > 0 : pct < 0
        alerts.push({ level: favorable ? '🟢' : '🔴', title: `${c.name} — ${r.month}`, detail: `Realizado ${brl(c.a)} versus orçado ${brl(c.b)} (${pct >= 0 ? '+' : ''}${(pct * 100).toFixed(1)}%).`, variation: brl(c.a - c.b) })
      }
    })
    if (r.closing < r.minimum) alerts.push({ level: '🔴', title: `Caixa abaixo do mínimo — ${r.month}`, detail: `Saldo projetado de ${brl(r.closing)} abaixo do mínimo de ${brl(r.minimum)}.`, variation: brl(r.closing - r.minimum) })
  })
  return alerts.sort((a, b) => a.level === '🔴' ? -1 : b.level === '🔴' ? 1 : 0).slice(0, 8)
}

function CashGroup({ group, rows, expanded, toggle }: { group: { key: Kind; label: string; children: string[] }; rows: any[]; expanded: Set<string>; toggle: (key: string) => void }) {
  const open = expanded.has(group.key)
  const vals = rows.map(r => group.key === 'operatingOutflows' || group.key === 'capex' ? -r[group.key] : r[group.key])
  return <>{<tr className="group-row" onClick={() => toggle(group.key)} style={{ cursor: 'pointer' }}><td><ExpandIcon open={open} onClick={() => toggle(group.key)} label={group.label} /><b>{group.label}</b></td>{vals.map((r, i) => <td key={i}>{brl(r)}</td>)}<td><b>{brl(vals.reduce((s: number, v: number) => s + v, 0))}</b></td></tr>}{open && group.children.map((child, i) => <tr key={child} className="item-row"><td style={{ paddingLeft: 34 }}>↳ {child}</td>{vals.map((v, j) => <td key={j} style={{ color: '#667085' }}>{brl(v * (i === 0 ? 0.52 : i === 1 ? 0.18 : i === 2 ? 0.12 : i === 3 ? 0.10 : 0.08))}</td>)}<td>—</td></tr>)}</>
}

function ExpandIcon({ open, onClick, label }: { open: boolean; onClick: () => void; label: string }) { return <button type="button" className="expand-btn" aria-label={open ? `Recolher ${label}` : `Expandir ${label}`} onClick={e => { e.stopPropagation(); onClick() }}>{open ? '−' : '+'}</button> }

function CashLine({ label, values, bold, totalMode = 'sum' }: { label: string; values: number[]; bold?: boolean; totalMode?: 'sum' | 'position' }) {
  const total = values.reduce((s, v) => s + v, 0)
  return <tr><td>{bold ? <b>{label}</b> : label}</td>{values.map((v, i) => <td key={i}>{bold ? <b>{brl(v)}</b> : brl(v)}</td>)}<td>{totalMode === 'position' ? '—' : bold ? <b>{brl(total)}</b> : brl(total)}</td></tr>
}

function OpenCashLine({ label, values, bold }: { label: string; values: number[]; bold?: boolean }) { const total = values.reduce((s, v) => s + v, 0); return <tr><td>{bold ? <b>{label}</b> : label}</td>{values.map((v, i) => <td key={i}>{bold ? <b>{brl(v)}</b> : brl(v)}</td>)}<td>{bold ? <b>{brl(total)}</b> : brl(total)}</td></tr> }

function BudgetCashLine({ label, budget, actual }: { label: string; budget: number[]; actual: number[] }) { const vars = budget.map((b, i) => actual[i] - b); return <><tr><td><b>{label}</b></td>{actual.map((a, i) => <td key={i}>{brl(a)}</td>)}<td><b>{brl(actual.reduce((s, v) => s + v, 0))}</b></td></tr><tr className="item-row"><td style={{ paddingLeft: 18 }}>Orçado</td>{budget.map((b, i) => <td key={i}>{brl(b)}</td>)}<td>{brl(budget.reduce((s, v) => s + v, 0))}</td></tr><tr className="item-row"><td style={{ paddingLeft: 18 }}>Desvio</td>{vars.map((v, i) => <td key={i}>{brl(v)}</td>)}<td>{brl(vars.reduce((s, v) => s + v, 0))}</td></tr></> }

function Card({ title, value }: { title: string; value: number }) { return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>projeção</small></div> }
function Metric({ title, value, help }: { title: string; value: string; help: string }) { return <div className="card"><span>{title}</span><strong>{value}</strong><small>{help}</small></div> }

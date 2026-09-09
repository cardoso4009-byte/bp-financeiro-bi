'use client'

import { useEffect, useMemo, useState } from 'react'
import { chartOfAccounts, sampleJournal, entryTotals, journalIsBalanced, type JournalEntry } from '@/lib/contabil-model'
import { journalFromLocalStorage } from '@/lib/financial-accounting-integration'
import ReportPeriodFilter, { DEFAULT_REPORT_PERIOD, type ReportPeriod } from '@/components/report-period-filter'
import { competence, periodLabel } from '@/lib/report-period'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const entryCompetence = (entry: JournalEntry) => entry.competence || entry.date.slice(0, 7)

export default function Contabil() {
  const [journal, setJournal] = useState<JournalEntry[]>(sampleJournal)
  const [integrationErrors, setIntegrationErrors] = useState<string[]>([])
  const [integrated, setIntegrated] = useState(false)
  const [period, setPeriod] = useState<ReportPeriod>(DEFAULT_REPORT_PERIOD)

  useEffect(() => {
    const result = journalFromLocalStorage()
    if (result.entries.length) {
      setJournal(result.entries)
      setIntegrationErrors(result.errors)
      setIntegrated(true)
    }
  }, [])

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(journal.map(entry => Number(entryCompetence(entry).slice(0, 4))).filter(Number.isFinite)))
    return years.sort((a, b) => a - b)
  }, [journal])

  useEffect(() => {
    if (availableYears.length && !availableYears.includes(period.year)) {
      setPeriod(current => ({ ...current, year: availableYears[availableYears.length - 1] }))
    }
  }, [availableYears, period.year])

  const selected = competence(period.year, period.month)
  const previous = period.month === 1 ? competence(period.year - 1, 12) : competence(period.year, period.month - 1)
  const periodEntries = useMemo(() => journal.filter(entry => {
    const c = entryCompetence(entry)
    if (period.view === 'mensal' || period.view === 'comparativo') return c === selected
    return c <= selected
  }), [journal, period.view, selected])

  const previousEntries = useMemo(() => journal.filter(entry => entryCompetence(entry) === previous), [journal, previous])
  const totalDebit = periodEntries.reduce((s, e) => s + entryTotals(e).debit, 0)
  const totalCredit = periodEntries.reduce((s, e) => s + entryTotals(e).credit, 0)
  const previousDebit = previousEntries.reduce((s, e) => s + entryTotals(e).debit, 0)
  const previousCredit = previousEntries.reduce((s, e) => s + entryTotals(e).credit, 0)
  const movementCount = periodEntries.length
  const label = periodLabel(period)

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
    <header>
      <div><small>MOTOR CONTÁBIL V6</small><h1>Contabilidade</h1><p>Plano de contas • Partidas dobradas • Diário • Integração financeira</p></div>
      <div style={{ display: 'grid', justifyItems: 'end', gap: 8 }}>
        <div className="period">{label}</div>
        <ReportPeriodFilter value={period} onChange={setPeriod} years={availableYears} />
      </div>
    </header>

    <div className="cards">
      <div className="card"><span>Contas cadastradas</span><strong>{chartOfAccounts.length}</strong><small>Plano de contas gerencial</small></div>
      <div className="card"><span>Lançamentos</span><strong>{movementCount}</strong><small>{integrated ? 'Integrados da base financeira' : 'Base demonstrativa'}</small></div>
      <div className="card"><span>Total Débitos</span><strong>{brl(totalDebit)}</strong><small>{period.view === 'comparativo' ? 'Competência selecionada' : label}</small></div>
      <div className="card"><span>Total Créditos</span><strong>{brl(totalCredit)}</strong><small>{period.view === 'comparativo' ? `Anterior: ${brl(previousCredit)}` : 'Movimentação'}</small></div>
    </div>

    {period.view === 'comparativo' && <section className="panel">
      <div className="panel-title"><h2>Comparativo de movimentação</h2><span>{selected} × {previous}</span></div>
      <div className="cards" style={{ marginTop: 12 }}>
        <div className="card"><span>Débitos selecionados</span><strong>{brl(totalDebit)}</strong><small>Competência {selected}</small></div>
        <div className="card"><span>Débitos anteriores</span><strong>{brl(previousDebit)}</strong><small>Competência {previous}</small></div>
        <div className="card"><span>Créditos selecionados</span><strong>{brl(totalCredit)}</strong><small>Competência {selected}</small></div>
        <div className="card"><span>Créditos anteriores</span><strong>{brl(previousCredit)}</strong><small>Competência {previous}</small></div>
      </div>
    </section>}

    <section className="panel">
      <div className="panel-title"><h2>Controle de partidas dobradas</h2><span>{journalIsBalanced(periodEntries) ? '✓ Equilibrado' : '! Divergência'}</span></div>
      <div className="note">Regra fundamental: em cada lançamento, <strong>Total de Débitos = Total de Créditos</strong>. A base financeira agora pode gerar automaticamente as partidas contábeis.</div>
      {integrationErrors.length > 0 && <div className="note" style={{ borderLeft: '4px solid #c33' }}><strong>Atenção na integração:</strong> {integrationErrors.join(' • ')}</div>}
    </section>

    <section className="panel wide">
      <div className="panel-title"><h2>Livro Diário</h2><span>{integrated ? 'Origem: Base de Lançamentos' : 'Base demonstrativa'} • {label}</span></div>
      <div className="rows">
        {periodEntries.length === 0 && <div className="note">Nenhum lançamento encontrado para o período selecionado.</div>}
        {periodEntries.map(entry => {
          const totals = entryTotals(entry)
          return <div key={entry.id} style={{ padding: '14px 0', borderBottom: '1px solid #e8e8e8' }}>
            <div className="row"><span><strong>{entry.date}</strong> • {entry.description}</span><b>{totals.balanced ? '✓ Balanceado' : '!'}</b></div>
            {entry.lines.map((line, i) => {
              const account = chartOfAccounts.find(a => a.code === line.account)
              return <div key={i} className="row" style={{ paddingLeft: 24, fontSize: 13 }}><span>{line.account} — {account?.name}</span><span>{line.debit ? `D ${brl(line.debit)}` : `C ${brl(line.credit)}`}</span></div>
            })}
          </div>
        })}
      </div>
    </section>

    <section className="panel wide">
      <div className="panel-title"><h2>Plano de contas</h2><span>{chartOfAccounts.length} contas</span></div>
      <div className="rows">
        {chartOfAccounts.map(account => <div key={account.code} className="row" style={{ paddingLeft: (account.level - 1) * 20 }}><span><strong>{account.code}</strong> — {account.name}</span><small>{account.class} • {account.nature}</small></div>)}
      </div>
    </section>

    <section className="panel">
      <div className="panel-title"><h2>Integração ativa</h2><span>{integrated ? '✓ Conectada' : 'Aguardando lançamentos'}</span></div>
      <div className="note">Fluxo atual: <strong>Base de Lançamentos → Partidas Contábeis → Diário</strong>. O Diário já consome a base integrada quando disponível; Razão, Balancete, BP, DRE, DFC e DMPL seguem em evolução para consumir esta mesma fonte.</div>
    </section>
  </main>
}

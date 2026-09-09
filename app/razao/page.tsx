'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { chartOfAccounts, sampleJournal, type JournalEntry } from '@/lib/accounting-core'
import { journalFromLocalStorage } from '@/lib/financial-accounting-integration'
import { buildLedger } from '@/lib/ledger-engine'
import ReportPeriodFilter, { type ReportPeriod } from '@/components/report-period-filter'
import { REPORT_MONTHS, competence } from '@/lib/report-period'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function RazaoPage() {
  const [journal, setJournal] = useState<JournalEntry[]>(sampleJournal)
  const [integrated, setIntegrated] = useState(false)
  const [period, setPeriod] = useState<ReportPeriod>({ year: 2026, month: 12, view: 'mensal' })

  useEffect(() => {
    const result = journalFromLocalStorage()
    if (result.entries.length) {
      setJournal(result.entries)
      setIntegrated(true)
    }
  }, [])

  const scopedJournal = useMemo(() => {
    const key = (entry: JournalEntry) => entry.competence || entry.date.slice(0, 7)
    const months = period.view === 'mensal' || period.view === 'comparativo'
      ? [period.month]
      : Array.from({ length: period.month }, (_, i) => i + 1)
    const keys = new Set(months.map(m => competence(period.year, m)))
    const opening = journal.filter(entry => key(entry) < competence(period.year, 1) || entry.id.startsWith('OPENING-'))
    return [...opening, ...journal.filter(entry => keys.has(key(entry)))]
  }, [journal, period])

  const ledger = useMemo(() => buildLedger(scopedJournal, chartOfAccounts), [scopedJournal])
  const totalDebit = ledger.reduce((sum, item) => sum + item.debit, 0)
  const totalCredit = ledger.reduce((sum, item) => sum + item.credit, 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01
  const label = period.view === 'mensal' ? `${REPORT_MONTHS[period.month - 1]}/${period.year}` : `Jan–${REPORT_MONTHS[period.month - 1]}/${period.year}`

  return (
    <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      <header>
        <div>
          <small>CONTROLADORIA • CONTABILIDADE</small>
          <h1>Razão Contábil</h1>
          <p>Movimentação por conta • Saldos acumulados • Origem no Diário</p>
        </div>
        <ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]} />
      </header>

      <div style={{ marginBottom: 18 }}>
        <Link href="/contabil" style={{ color: '#17345f', fontWeight: 700, textDecoration: 'none' }}>← Contabilidade</Link>
        <span style={{ margin: '0 10px', color: '#9aa6b2' }}>•</span>
        <span style={{ color: '#66758a' }}>{integrated ? 'Base financeira integrada' : 'Base demonstrativa'} • {label}</span>
      </div>

      <div className="cards">
        <div className="card"><span>Contas movimentadas</span><strong>{ledger.length}</strong><small>{label}</small></div>
        <div className="card"><span>Total Débitos</span><strong>{brl(totalDebit)}</strong><small>Período filtrado</small></div>
        <div className="card"><span>Total Créditos</span><strong>{brl(totalCredit)}</strong><small>Período filtrado</small></div>
        <div className="card"><span>Status</span><strong>{balanced ? '✓ OK' : '! Revisar'}</strong><small>{balanced ? 'Razão balanceado' : 'Diferença entre débitos e créditos'}</small></div>
      </div>

      <section className="panel wide">
        <div className="panel-title"><h2>Razão por conta</h2><span>{label}</span></div>
        <div className="note">O Razão é derivado do <strong>mesmo Diário utilizado pela contabilidade</strong>. Mensal considera a competência selecionada; Acumulado soma janeiro até o mês escolhido. O filtro não altera a origem dos lançamentos.</div>

        {ledger.map(item => (
          <div key={item.account.code} style={{ marginTop: 18, border: '1px solid #e3e8ef', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f5f7fa' }}>
              <div>
                <strong>{item.account.code} — {item.account.name}</strong>
                <div style={{ fontSize: 12, color: '#66758a', marginTop: 4 }}>{item.account.class} • natureza {item.account.nature}</div>
              </div>
              <strong>{brl(item.balance)}</strong>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Data</th><th>Histórico</th><th>Origem</th><th>Débito</th><th>Crédito</th><th>Saldo</th></tr></thead>
                <tbody>{item.movements.map((movement, index) => (
                  <tr key={`${movement.entryId}-${index}`}>
                    <td>{movement.date}</td>
                    <td>{movement.description}</td>
                    <td>{movement.source ?? '—'}</td>
                    <td>{movement.debit ? brl(movement.debit) : '—'}</td>
                    <td>{movement.credit ? brl(movement.credit) : '—'}</td>
                    <td><strong>{brl(movement.balance)}</strong></td>
                  </tr>
                ))}</tbody>
                <tfoot><tr>
                  <td colSpan={3}><strong>Totais da conta</strong></td>
                  <td><strong>{brl(item.debit)}</strong></td>
                  <td><strong>{brl(item.credit)}</strong></td>
                  <td><strong>{brl(item.balance)}</strong></td>
                </tr></tfoot>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-title"><h2>Próximo elo da cadeia</h2><span>Balancete de Verificação</span></div>
        <div className="note"><strong>Diário → Razão → Balancete → BP + DRE + DFC + DMPL.</strong> O período selecionado agora acompanha a leitura do Razão sem romper a cadeia contábil.</div>
      </section>
    </main>
  )
}

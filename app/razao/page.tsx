'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { chartOfAccounts, sampleJournal, type JournalEntry } from '@/lib/accounting-core'
import { journalFromLocalStorage } from '@/lib/financial-accounting-integration'
import { buildLedger } from '@/lib/ledger-engine'
import ReportPeriodFilter, { type ReportPeriod } from '@/components/report-period-filter'
import { REPORT_MONTHS, competence } from '@/lib/report-period'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
const inputStyle: React.CSSProperties = { width: '100%', minWidth: 0, padding: '10px 12px', border: '1px solid #d6deea', borderRadius: 8, background: '#fff', color: '#17345f', font: 'inherit' }

export default function RazaoPage() {
  const [journal, setJournal] = useState<JournalEntry[]>(sampleJournal)
  const [integrated, setIntegrated] = useState(false)
  const [period, setPeriod] = useState<ReportPeriod>({ year: 2026, month: 12, view: 'mensal' })
  const [search, setSearch] = useState('')
  const [accountClass, setAccountClass] = useState('todas')
  const [sourceFilter, setSourceFilter] = useState('todas')

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
  const filteredLedger = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
    return ledger.map(item => {
      const accountMatches = accountClass === 'todas' || item.account.class === accountClass
      const movements = item.movements.filter(movement => {
        const textMatches = !normalizedSearch || [
          movement.entryId, movement.date, movement.description, movement.document ?? '',
          item.account.code, item.account.name, movement.source ?? '',
        ].some(value => value.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
        const sourceMatches = sourceFilter === 'todas' || movement.source === sourceFilter
        return textMatches && sourceMatches
      })
      const debit = movements.reduce((sum, movement) => sum + movement.debit, 0)
      const credit = movements.reduce((sum, movement) => sum + movement.credit, 0)
      const lastMovement = movements[movements.length - 1]
      return { ...item, movements, debit, credit, balance: lastMovement?.balance ?? 0, accountMatches }
    }).filter(item => item.accountMatches && item.movements.length > 0)
  }, [ledger, search, accountClass, sourceFilter])

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
        <div className="panel-title"><h2>Consulta detalhada</h2><span>{filteredLedger.reduce((sum, item) => sum + item.movements.length, 0)} partidas encontradas</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 2fr) repeat(2, minmax(160px, 1fr))', gap: 12, margin: '14px 0 18px' }}>
          <label style={{ display: 'grid', gap: 6, color: '#66758a', fontSize: 12, fontWeight: 700 }}>
            Pesquisar lançamento, documento ou conta
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Ex.: fornecedor, NF-102, 6.1..." style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 6, color: '#66758a', fontSize: 12, fontWeight: 700 }}>
            Classe contábil
            <select value={accountClass} onChange={event => setAccountClass(event.target.value)} style={inputStyle}>
              <option value="todas">Todas as classes</option>
              <option value="ativo">Ativo</option><option value="passivo">Passivo</option>
              <option value="patrimonio">Patrimônio líquido</option><option value="receita">Receita</option>
              <option value="custo">Custo</option><option value="despesa">Despesa</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6, color: '#66758a', fontSize: 12, fontWeight: 700 }}>
            Origem
            <select value={sourceFilter} onChange={event => setSourceFilter(event.target.value)} style={inputStyle}>
              <option value="todas">Todas as origens</option>
              <option value="INTEGRACAO">Integração</option><option value="MANUAL">Manual</option><option value="IMPORTACAO">Importação</option>
            </select>
          </label>
        </div>
        <div className="note">A pesquisa filtra histórico, documento, código/nome da conta, data e origem. Os totais do cabeçalho continuam representando o período selecionado; a consulta abaixo mostra somente os resultados dos filtros.</div>

        {filteredLedger.length === 0 && <div className="note" style={{ marginTop: 16 }}>Nenhuma partida encontrada. Ajuste os filtros e tente novamente.</div>}
        {filteredLedger.map(item => (
          <div key={item.account.code} style={{ marginTop: 18, border: '1px solid #e3e8ef', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f5f7fa', gap: 16 }}>
              <div>
                <strong>{item.account.code} — {item.account.name}</strong>
                <div style={{ fontSize: 12, color: '#66758a', marginTop: 4 }}>{item.account.class} • natureza {item.account.nature}</div>
              </div>
              <strong>{brl(item.balance)}</strong>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Data</th><th>Histórico</th><th>Documento / origem</th><th>Débito</th><th>Crédito</th><th>Saldo</th></tr></thead>
                <tbody>{item.movements.map((movement, index) => (
                  <tr key={`${movement.entryId}-${index}`}>
                    <td>{movement.date}</td>
                    <td>{movement.description}<small style={{ display: 'block', color: '#718198', marginTop: 3 }}>ID: {movement.entryId}</small></td>
                    <td>{movement.document ?? '—'}<small style={{ display: 'block', color: '#718198', marginTop: 3 }}>{movement.source ?? 'Origem não informada'}</small></td>
                    <td>{movement.debit ? brl(movement.debit) : '—'}</td>
                    <td>{movement.credit ? brl(movement.credit) : '—'}</td>
                    <td><strong>{brl(movement.balance)}</strong></td>
                  </tr>
                ))}</tbody>
                <tfoot><tr>
                  <td colSpan={3}><strong>Totais das partidas exibidas</strong></td>
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
        <div className="note"><strong>Diário → Razão → Balancete → BP + DRE + DFC + DMPL.</strong> O período selecionado acompanha a leitura do Razão sem romper a cadeia contábil.</div>
      </section>
    </main>
  )
}

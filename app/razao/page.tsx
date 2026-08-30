'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { chartOfAccounts, sampleJournal, type JournalEntry } from '@/lib/accounting-core'
import { journalFromLocalStorage } from '@/lib/financial-accounting-integration'
import { buildLedger } from '@/lib/ledger-engine'

const brl = (n: number) => n.toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export default function RazaoPage() {
  const [journal, setJournal] = useState<JournalEntry[]>(sampleJournal)
  const [integrated, setIntegrated] = useState(false)

  useEffect(() => {
    const result = journalFromLocalStorage()
    if (result.entries.length) {
      setJournal(result.entries)
      setIntegrated(true)
    }
  }, [])

  const ledger = useMemo(() => buildLedger(journal, chartOfAccounts), [journal])
  const totalDebit = ledger.reduce((sum, item) => sum + item.debit, 0)
  const totalCredit = ledger.reduce((sum, item) => sum + item.credit, 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01

  return (
    <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      <header>
        <div>
          <small>CONTROLADORIA • CONTABILIDADE</small>
          <h1>Razão Contábil</h1>
          <p>Movimentação por conta • Saldos acumulados • Origem no Diário</p>
        </div>
        <div className="period">2026</div>
      </header>

      <div style={{ marginBottom: 18 }}>
        <Link href="/contabil" style={{ color: '#17345f', fontWeight: 700, textDecoration: 'none' }}>← Contabilidade</Link>
        <span style={{ margin: '0 10px', color: '#9aa6b2' }}>•</span>
        <span style={{ color: '#66758a' }}>{integrated ? 'Base financeira integrada' : 'Base demonstrativa'}</span>
      </div>

      <div className="cards">
        <div className="card"><span>Contas movimentadas</span><strong>{ledger.length}</strong><small>Contas com lançamentos</small></div>
        <div className="card"><span>Total Débitos</span><strong>{brl(totalDebit)}</strong><small>Movimentação do Diário</small></div>
        <div className="card"><span>Total Créditos</span><strong>{brl(totalCredit)}</strong><small>Movimentação do Diário</small></div>
        <div className="card"><span>Status</span><strong>{balanced ? '✓ OK' : '! Revisar'}</strong><small>{balanced ? 'Razão balanceado' : 'Diferença entre débitos e créditos'}</small></div>
      </div>

      <section className="panel wide">
        <div className="panel-title"><h2>Razão por conta</h2><span>{integrated ? 'Diário integrado' : 'Base demonstrativa'}</span></div>
        <div className="note">O Razão é derivado do <strong>mesmo Diário utilizado pela contabilidade</strong>. O saldo considera a natureza da conta: devedora (débito − crédito) ou credora (crédito − débito).</div>

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
        <div className="note"><strong>Diário → Razão → Balancete → BP + DRE + DFC + DMPL.</strong> Agora que o Razão está preparado para consumir o Diário integrado, o próximo passo é consolidar o Balancete como fonte única para as demonstrações.</div>
      </section>
    </main>
  )
}

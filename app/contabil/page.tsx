'use client'

import { useEffect, useState } from 'react'
import { chartOfAccounts, sampleJournal, entryTotals, journalIsBalanced, type JournalEntry } from '@/lib/contabil-model'
import { journalFromLocalStorage } from '@/lib/financial-accounting-integration'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function Contabil() {
  const [journal, setJournal] = useState<JournalEntry[]>(sampleJournal)
  const [integrationErrors, setIntegrationErrors] = useState<string[]>([])
  const [integrated, setIntegrated] = useState(false)

  useEffect(() => {
    const result = journalFromLocalStorage()
    if (result.entries.length) {
      setJournal(result.entries)
      setIntegrationErrors(result.errors)
      setIntegrated(true)
    }
  }, [])

  const totalDebit = journal.reduce((s, e) => s + entryTotals(e).debit, 0)
  const totalCredit = journal.reduce((s, e) => s + entryTotals(e).credit, 0)

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
    <header>
      <div><small>MOTOR CONTÁBIL V6</small><h1>Contabilidade</h1><p>Plano de contas • Partidas dobradas • Diário • Integração financeira</p></div>
      <div className="period">2026</div>
    </header>

    <div className="cards">
      <div className="card"><span>Contas cadastradas</span><strong>{chartOfAccounts.length}</strong><small>Plano de contas gerencial</small></div>
      <div className="card"><span>Lançamentos</span><strong>{journal.length}</strong><small>{integrated ? 'Integrados da base financeira' : 'Base demonstrativa'}</small></div>
      <div className="card"><span>Total Débitos</span><strong>{brl(totalDebit)}</strong><small>Movimentação</small></div>
      <div className="card"><span>Total Créditos</span><strong>{brl(totalCredit)}</strong><small>Movimentação</small></div>
    </div>

    <section className="panel">
      <div className="panel-title"><h2>Controle de partidas dobradas</h2><span>{journalIsBalanced(journal) ? '✓ Equilibrado' : '! Divergência'}</span></div>
      <div className="note">Regra fundamental: em cada lançamento, <strong>Total de Débitos = Total de Créditos</strong>. A base financeira agora pode gerar automaticamente as partidas contábeis.</div>
      {integrationErrors.length > 0 && <div className="note" style={{ borderLeft: '4px solid #c33' }}><strong>Atenção na integração:</strong> {integrationErrors.join(' • ')}</div>}
    </section>

    <section className="panel wide">
      <div className="panel-title"><h2>Livro Diário</h2><span>{integrated ? 'Origem: Base de Lançamentos' : 'Base demonstrativa'}</span></div>
      <div className="rows">
        {journal.map(entry => {
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
      <div className="note">Fluxo atual: <strong>Base de Lançamentos → Partidas Contábeis → Diário</strong>. O próximo passo é fazer Razão, Balancete, BP, DRE, DFC e DMPL consumirem este Diário integrado, eliminando definitivamente as bases demonstrativas paralelas.</div>
    </section>
  </main>
}

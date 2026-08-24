'use client'

import { chartOfAccounts, sampleJournal, entryTotals, journalIsBalanced } from '@/lib/contabil-model'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function Contabil() {
  const totalDebit = sampleJournal.reduce((s, e) => s + entryTotals(e).debit, 0)
  const totalCredit = sampleJournal.reduce((s, e) => s + entryTotals(e).credit, 0)

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
    <header>
      <div><small>MOTOR CONTÁBIL V5</small><h1>Contabilidade</h1><p>Plano de contas • Partidas dobradas • Diário • Controles de consistência</p></div>
      <div className="period">2026</div>
    </header>

    <div className="cards">
      <div className="card"><span>Contas cadastradas</span><strong>{chartOfAccounts.length}</strong><small>Plano de contas gerencial</small></div>
      <div className="card"><span>Lançamentos exemplo</span><strong>{sampleJournal.length}</strong><small>Partidas dobradas</small></div>
      <div className="card"><span>Total Débitos</span><strong>{brl(totalDebit)}</strong><small>Movimentação</small></div>
      <div className="card"><span>Total Créditos</span><strong>{brl(totalCredit)}</strong><small>Movimentação</small></div>
    </div>

    <section className="panel">
      <div className="panel-title"><h2>Controle de partidas dobradas</h2><span>{journalIsBalanced(sampleJournal) ? '✓ Equilibrado' : '! Divergência'}</span></div>
      <div className="note">Regra fundamental: em cada lançamento, <strong>Total de Débitos = Total de Créditos</strong>. Nenhum lançamento desequilibrado deve alimentar as demonstrações.</div>
    </section>

    <section className="panel wide">
      <div className="panel-title"><h2>Livro Diário — exemplo</h2><span>Competência</span></div>
      <div className="rows">
        {sampleJournal.map(entry => {
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
      <div className="panel-title"><h2>Próxima integração</h2><span>Motor financeiro</span></div>
      <div className="note">A próxima camada usará o razão contábil para calcular saldos por conta e alimentar automaticamente <strong>Balanço Patrimonial, DRE, DFC e DMPL</strong>.</div>
    </section>
  </main>
}

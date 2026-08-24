import { buildLedger, buildTrialBalance } from '@/lib/razao-balancete'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function Razao(){
  const ledger=buildLedger()
  const trial=buildTrialBalance()
  return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1400,margin:'0 auto'}}>
    <header><div><small>CONTABILIDADE</small><h1>Razão & Balancete</h1><p>Saldos por conta derivados do Livro Diário</p></div><div className="period">Data-base: Dez/2026</div></header>
    <div className="cards"><div className="card"><span>Contas movimentadas</span><strong>{ledger.filter(r=>r.debit||r.credit).length}</strong><small>Razão contábil</small></div><div className="card"><span>Débitos</span><strong>{brl(trial.totalDebit)}</strong><small>Saldo devedor</small></div><div className="card"><span>Créditos</span><strong>{brl(trial.totalCredit)}</strong><small>Saldo credor</small></div><div className="card"><span>Status</span><strong>{trial.balanced?'✓ OK':'! Revisar'}</strong><small>Partidas dobradas</small></div></div>
    <section className="panel wide"><div className="panel-title"><h2>Razão contábil</h2><span>Débitos • Créditos • Saldo</span></div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Conta</th><th>Natureza</th><th>Débitos</th><th>Créditos</th><th>Saldo</th></tr></thead><tbody>{ledger.filter(r=>r.debit||r.credit).map(r=><tr key={r.code}><td>{r.code}</td><td>{r.name}</td><td>{r.nature}</td><td>{brl(r.debit)}</td><td>{brl(r.credit)}</td><td>{brl(r.balance)}</td></tr>)}</tbody></table></div></section>
    <section className="panel"><div className="panel-title"><h2>Balancete de verificação</h2><span>{trial.balanced?'✓ Equilibrado':'! Divergência'}</span></div><div className="note">O balancete é uma etapa de controle: antes de alimentar as demonstrações, os lançamentos devem estar balanceados e os saldos devem respeitar a natureza de cada conta.</div></section>
    <section className="panel"><div className="panel-title"><h2>Próxima integração</h2><span>Motor contábil</span></div><div className="note"><strong>Razão → Balancete → BP + DRE + DFC + DMPL.</strong> A próxima camada classificará automaticamente cada conta na demonstração correspondente.</div></section>
  </main>
}

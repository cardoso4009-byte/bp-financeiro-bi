'use client'

import { buildDmpl } from '@/lib/dmpl-engine'
import type { JournalEntry } from '@/lib/accounting-core'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

// O Diário usa o formato oficial do accounting-core: linhas de débito e crédito.
// O exemplo mantém a ponte da DMPL reconciliada: 250.000 + 90.000 - 20.000 = 320.000.
const sampleJournal: JournalEntry[] = [
  {
    id: '000',
    date: '2026-01-02',
    competence: '2026-01',
    description: 'Integralização de capital social',
    source: 'MANUAL',
    lines: [
      { account: '1.1.01', debit: 250000, credit: 0 },
      { account: '3.1', debit: 0, credit: 250000 },
    ],
  },
  {
    id: '001',
    date: '2026-01-05',
    competence: '2026-01',
    description: 'Reconhecimento de receita de vendas',
    source: 'MANUAL',
    lines: [
      { account: '1.1.02', debit: 100000, credit: 0 },
      { account: '4.1', debit: 0, credit: 100000 },
    ],
  },
  {
    id: '002',
    date: '2026-01-10',
    competence: '2026-01',
    description: 'Pagamento de despesas operacionais',
    source: 'MANUAL',
    lines: [
      { account: '6.1', debit: 10000, credit: 0 },
      { account: '1.1.01', debit: 0, credit: 10000 },
    ],
  },
  {
    id: '003',
    date: '2026-01-20',
    competence: '2026-01',
    description: 'Distribuição de dividendos',
    source: 'MANUAL',
    lines: [
      { account: '3.2', debit: 20000, credit: 0 },
      { account: '1.1.01', debit: 0, credit: 20000 },
    ],
  },
]

export default function DMPLReconciliationPage() {
  const d = buildDmpl(sampleJournal, 250000, -20000, 0)
  const ok = d.status === 'OK'
  const adjustmentNeeded = -d.diferenca
  const causes = [
    ['Ajustes de exercícios anteriores', 'Revisar lançamentos de períodos anteriores transferidos para o PL.'],
    ['Reservas de lucros ou capital', 'Verificar constituição, reversão ou transferência entre contas patrimoniais.'],
    ['Ajustes de avaliação patrimonial', 'Verificar lançamentos de avaliação que não passam pelo resultado do período.'],
    ['Aumento ou redução de capital', 'Conferir integralizações, reduções e demais movimentações de capital.'],
    ['Outros movimentos patrimoniais', 'Identificar lançamentos diretamente no patrimônio líquido sem classificação na ponte.'],
    ['Classificação contábil', 'Conferir se algum lançamento foi contabilizado no PL, mas não está mapeado na DMPL.'],
  ]

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
    <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>DMPL</h1><p>Demonstrações integradas • Regime de competência</p></div><div className="period">{ok ? '✓ RECONCILIADO' : '! PENDÊNCIA'}</div></header>
    <section className="panel wide"><div className="panel-title"><h2>DMPL — Ponte do Patrimônio Líquido</h2><span>2026</span></div>
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

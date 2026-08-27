'use client'

import { financialData as d } from '@/lib/financial-data'

const brl = (n: number) => n.toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export default function DMPLReconciliationPage() {
  // Dividendos já são armazenados como saída patrimonial (valor negativo).
  // Portanto, a ponte deve somá-los ao PL inicial + lucro líquido.
  const plCalculated = d.plInicial + d.lucroLiquido + d.dividendos
  const difference = plCalculated - d.plFinal
  const ok = Math.abs(difference) < 0.01

  return (
    <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      <header>
        <div>
          <small>CONTROLADORIA FINANCEIRA</small>
          <h1>DMPL</h1>
          <p>Demonstrações integradas • Regime de competência</p>
        </div>
        <div className="period">{ok ? '✓ RECONCILIADO' : '! PENDÊNCIA'}</div>
      </header>

      <section className="panel wide">
        <div className="panel-title">
          <h2>DMPL — Ponte do Patrimônio Líquido</h2>
          <span>2026</span>
        </div>

        <div className="table-wrap">
          <table>
            <tbody>
              <tr><td>PL Inicial</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{brl(d.plInicial)}</td></tr>
              <tr><td>(+) Lucro Líquido</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{brl(d.lucroLiquido)}</td></tr>
              <tr><td>(-) Dividendos / Distribuições</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{brl(d.dividendos)}</td></tr>
              <tr><td>(+/-) Outros movimentos</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{brl(0)}</td></tr>
              <tr style={{ background: 'var(--panel-muted, #f5f7fa)' }}>
                <td><strong>= PL Calculado pela Ponte</strong></td>
                <td style={{ textAlign: 'right', fontWeight: 800 }}>{brl(plCalculated)}</td>
              </tr>
              <tr>
                <td>PL Final contábil</td>
                <td style={{ textAlign: 'right', fontWeight: 800 }}>{brl(d.plFinal)}</td>
              </tr>
              <tr style={{ background: ok ? '#eefbf3' : '#fff4f4' }}>
                <td><strong>{ok ? '✓ Reconciliação' : '⚠ Diferença não explicada'}</strong></td>
                <td style={{ textAlign: 'right', fontWeight: 800 }}>
                  {brl(Math.abs(difference))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {!ok && (
          <div className="note" style={{ marginTop: 20, borderLeft: '4px solid #d92d20' }}>
            <strong>Reconciliação pendente.</strong> O PL Final contábil não é explicado pelos movimentos apresentados na DMPL.
            A ponte explica <strong>{brl(plCalculated)}</strong>, enquanto o PL Final apresentado é <strong>{brl(d.plFinal)}</strong>.
            Existe uma diferença de <strong>{brl(Math.abs(difference))}</strong> que deve ser investigada antes do fechamento.
          </div>
        )}

        {ok && (
          <div className="note" style={{ marginTop: 20 }}>
            A ponte do patrimônio líquido está integralmente reconciliada com o PL Final contábil.
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Regra de auditoria</h2>
          <span>{ok ? 'OK' : 'REVISAR'}</span>
        </div>
        <div className="check">
          <i className={ok ? 'ok' : 'bad'}>{ok ? '✓' : '!'}</i>
          <div>
            <b>PL Inicial + Resultado − Distribuições + Outros movimentos = PL Final</b>
            <small>
              {ok
                ? 'Todos os movimentos patrimoniais estão explicados.'
                : `Diferença encontrada: ${brl(Math.abs(difference))}. O BI não deve forçar o fechamento da demonstração.`}
            </small>
          </div>
        </div>
      </section>
    </main>
  )
}

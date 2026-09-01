import { monthlyBalance } from './monthly-data'

export type ManagementBalanceAuditRow = {
  month: string
  patrimonialDifference: number
  assetCompositionDifference: number
  liabilityCompositionDifference: number
  firstDivergence: boolean
}

const tolerance = 0.01

/** Diagnostic only: never adjusts balances. It identifies where the management source diverges. */
export function auditManagementBalanceSeries() {
  const rows: ManagementBalanceAuditRow[] = monthlyBalance.map(m => {
    const assetComposition = m.caixa + m.contasReceber + m.estoques + m.outrosAtivos + m.imobilizado
    const liabilityComposition = m.fornecedores + m.obrigacoes + m.outrosPassivos + m.dividasLongoPrazo + m.pl
    const patrimonialDifference = m.ativoTotal - (m.passivoTotal + m.pl)
    return {
      month: m.month,
      patrimonialDifference,
      assetCompositionDifference: m.ativoTotal - assetComposition,
      liabilityCompositionDifference: m.passivoTotal + m.pl - liabilityComposition,
      firstDivergence: false,
    }
  })

  let found = false
  for (const row of rows) {
    row.firstDivergence = !found && Math.abs(row.patrimonialDifference) >= tolerance
    if (row.firstDivergence) found = true
  }

  const first = rows.find(r => r.firstDivergence)
  return {
    rows,
    firstDivergenceMonth: first?.month ?? null,
    firstDivergenceDifference: first?.patrimonialDifference ?? 0,
    allBalanced: rows.every(r => Math.abs(r.patrimonialDifference) < tolerance),
  }
}

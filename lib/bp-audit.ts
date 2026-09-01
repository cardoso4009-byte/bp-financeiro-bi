import { monthlyBalance, type MonthlyBalance } from './monthly-data'

export type BalanceAuditRow = {
  month: string
  ativo: number
  passivo: number
  pl: number
  bpDifference: number
  acCompositionDifference: number
  ancCompositionDifference: number
  status: 'ok' | 'critical'
}

const round2 = (n:number) => Math.round(n * 100) / 100

/**
 * Audita a série gerencial sem corrigir ou mascarar os dados de origem.
 * O objetivo é localizar o primeiro período em que uma inconsistência aparece.
 */
export function auditMonthlyBalance(data: MonthlyBalance[] = monthlyBalance): BalanceAuditRow[] {
  return data.map(m => {
    const acComposition = m.caixa + m.contasReceber + m.estoques + m.outrosAtivos
    const ancComposition = m.imobilizado
    const bpDifference = m.ativoTotal - (m.passivoTotal + m.pl)
    const acCompositionDifference = m.ativoCirculante - acComposition
    const ancCompositionDifference = m.ativoNaoCirculante - ancComposition

    return {
      month: m.month,
      ativo: m.ativoTotal,
      passivo: m.passivoTotal,
      pl: m.pl,
      bpDifference: round2(bpDifference),
      acCompositionDifference: round2(acCompositionDifference),
      ancCompositionDifference: round2(ancCompositionDifference),
      status: Math.abs(bpDifference) < 0.01 && Math.abs(acCompositionDifference) < 0.01 && Math.abs(ancCompositionDifference) < 0.01 ? 'ok' : 'critical',
    }
  })
}

export function firstBalanceIssue(rows: BalanceAuditRow[] = auditMonthlyBalance()): BalanceAuditRow | null {
  return rows.find(r => r.status === 'critical') ?? null
}

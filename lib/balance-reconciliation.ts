import { monthlyBalance, type MonthlyBalance } from './monthly-data'

export type BalanceReconciliation = {
  month: string
  ativo: number
  passivo: number
  patrimonio: number
  difference: number
  balanced: boolean
}

/** Validates the management balance source independently from the accounting engine. */
export function reconcileManagementBalance(base?: MonthlyBalance): BalanceReconciliation {
  const m = base ?? monthlyBalance[monthlyBalance.length - 1]
  const difference = m.ativoTotal - (m.passivoTotal + m.pl)
  return {
    month: m.month,
    ativo: m.ativoTotal,
    passivo: m.passivoTotal,
    patrimonio: m.pl,
    difference,
    balanced: Math.abs(difference) < 0.01,
  }
}

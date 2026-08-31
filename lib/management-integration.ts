import type { FinancialEntry } from './lancamentos-data'

export type ManagementImpact = {
  dre: number
  cash: number
  balance: number
  workingCapital: number
  reason: string
}

/**
 * Regra única de impacto gerencial.
 * Competência alimenta resultado; pagamento alimenta caixa.
 * CAPEX e financiamentos não entram no resultado operacional.
 */
export function managementImpact(entry: FinancialEntry): ManagementImpact {
  const value = Math.abs(entry.value)
  if (entry.type === 'Receita') {
    return {
      dre: value,
      cash: entry.status === 'Pago' ? value : 0,
      balance: entry.status === 'Pago' ? 0 : value,
      workingCapital: entry.status === 'Pago' ? 0 : value,
      reason: entry.status === 'Pago' ? 'Receita reconhecida e recebida' : 'Receita reconhecida; recebimento pendente',
    }
  }
  if (entry.type === 'Despesa') {
    return {
      dre: -value,
      cash: entry.status === 'Pago' ? -value : 0,
      balance: entry.status === 'Pago' ? 0 : -value,
      workingCapital: entry.status === 'Pago' ? 0 : -value,
      reason: entry.status === 'Pago' ? 'Despesa reconhecida e paga' : 'Despesa reconhecida; pagamento pendente',
    }
  }
  if (entry.type === 'CAPEX') {
    return {
      dre: 0,
      cash: entry.status === 'Pago' ? -value : 0,
      balance: entry.status === 'Pago' ? value : 0,
      workingCapital: 0,
      reason: entry.status === 'Pago' ? 'Investimento realizado' : 'CAPEX contratado, sem saída de caixa',
    }
  }
  const financing = entry.value
  return {
    dre: 0,
    cash: entry.status === 'Pago' ? financing : 0,
    balance: entry.status === 'Pago' ? financing : 0,
    workingCapital: 0,
    reason: entry.status === 'Pago' ? 'Movimentação financeira realizada' : 'Financiamento pendente',
  }
}

export function integrationSummary(entries: FinancialEntry[]) {
  return entries.reduce((acc, entry) => {
    const impact = managementImpact(entry)
    acc.dre += impact.dre
    acc.cash += impact.cash
    acc.balance += impact.balance
    acc.workingCapital += impact.workingCapital
    return acc
  }, { dre: 0, cash: 0, balance: 0, workingCapital: 0 })
}

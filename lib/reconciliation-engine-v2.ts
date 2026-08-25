import type { FinancialData } from './financial-data'
import type { ReconciliationResult, ReconciliationStatus } from './reconciliation-types'

const status = (difference: number): ReconciliationStatus =>
  Math.abs(difference) < 0.01 ? 'OK' : 'DIVERGENTE'

export function reconcileFinancialStatements(data: FinancialData): ReconciliationResult {
  const patrimonial = data.ativoTotal - data.passivoTotal - data.plFinal
  const caixa = data.caixaFinal - (
    data.caixaInicial + data.caixaOperacional + data.investimentos + data.financiamentos
  )
  const dmpl = data.plInicial + data.lucroLiquido + data.dividendos - data.plFinal

  return {
    patrimonial: { difference: patrimonial, status: status(patrimonial) },
    caixa: { difference: caixa, status: status(caixa) },
    dmpl: { difference: dmpl, status: status(dmpl) },
  }
}

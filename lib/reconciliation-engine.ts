import type { FinancialData } from './financial-data'

export type ReconciliationStatus = 'OK' | 'DIVERGENTE'

export type ReconciliationResult = {
  patrimonial: { difference: number; status: ReconciliationStatus }
  caixa: { difference: number; status: ReconciliationStatus }
  dmpl: { difference: number; status: ReconciliationStatus }
}

const status = (difference: number): ReconciliationStatus =>
  Math.abs(difference) < 0.01 ? 'OK' : 'DIVERGENTE'

/**
 * Camada única de reconciliação das demonstrações.
 * Todas as telas devem consumir estes checks, evitando regras duplicadas.
 */
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

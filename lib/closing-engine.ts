import { statementEngine } from './statement-engine'
import { cashFlowEngine } from './dfc-engine'

export function closingEngine() {
  const s = statementEngine()
  const c = cashFlowEngine()
  const result = s.totals.receitas - s.totals.custos - s.totals.despesas
  const bpDifference = s.totals.ativo - (s.totals.passivo + s.totals.patrimonio)
  const cashDifference = c.reconciliation
  const dmplExpected = s.totals.patrimonio + result
  return {
    result,
    bpDifference,
    cashDifference,
    dmplExpected,
    checks: {
      bp: Math.abs(bpDifference) < 0.01,
      cash: Math.abs(cashDifference) < 0.01,
      result: Number.isFinite(result),
      overall: Math.abs(bpDifference) < 0.01 && Math.abs(cashDifference) < 0.01,
    },
  }
}

import { statementEngine } from './statement-engine'
import { cashFlowEngine } from './dfc-engine'
import { buildTrialBalance } from './razao-balancete'
import { journalIsBalanced, sampleJournal } from './accounting-core'

export function closingEngine() {
  const s = statementEngine()
  const c = cashFlowEngine()
  const trial = buildTrialBalance(sampleJournal)
  const journal = journalIsBalanced(sampleJournal)
  const result = s.totals.resultadoPeriodo
  const bpDifference = s.totals.ativo - (s.totals.passivo + s.totals.patrimonio)
  const cashDifference = c.reconciliation

  // O patrimônio apresentado pelo motor já incorpora o resultado do exercício.
  // Para validar a ponte do PL, somamos o resultado apenas ao patrimônio registrado
  // antes do encerramento, evitando duplicar o resultado.
  const dmplExpected = s.totals.patrimonioRegistrado + result
  const dmplDifference = s.totals.patrimonio - dmplExpected

  const checks = {
    journal,
    trial: trial.balanced,
    bp: Math.abs(bpDifference) < 0.01,
    cash: Math.abs(cashDifference) < 0.01,
    result: Number.isFinite(result),
    dmpl: Math.abs(dmplDifference) < 0.01,
  }

  return {
    result,
    bpDifference,
    cashDifference,
    dmplExpected,
    dmplDifference,
    checks: {
      ...checks,
      overall: checks.journal && checks.trial && checks.bp && checks.cash && checks.result && checks.dmpl,
    },
  }
}

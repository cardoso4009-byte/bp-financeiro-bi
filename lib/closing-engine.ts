import { statementEngine } from './statement-engine'
import { cashFlowEngine } from './dfc-engine'
import { buildTrialBalance } from './razao-balancete'
import { journalIsBalanced, sampleJournal } from './accounting-core'
import { reconcileManagementBalance } from './balance-reconciliation'
import { auditMonthlyBalance, firstBalanceIssue } from './bp-audit'

export type ClosingStatus = 'ABERTO' | 'PRE_FECHAMENTO' | 'FECHADO'

export function closingEngine(status: ClosingStatus = 'ABERTO') {
  const s = statementEngine(sampleJournal)
  const c = cashFlowEngine(sampleJournal)
  const trial = buildTrialBalance(sampleJournal)
  const journal = journalIsBalanced(sampleJournal)
  const result = s.totals.resultadoPeriodo
  const bpDifference = s.totals.ativo - (s.totals.passivo + s.totals.patrimonio)
  const managementBp = reconcileManagementBalance()
  const monthlyBp = auditMonthlyBalance()
  const firstMonthlyIssue = firstBalanceIssue(monthlyBp)
  const cashDifference = c.reconciliation

  const dmplExpected = s.totals.patrimonioRegistrado + result
  const dmplDifference = s.totals.patrimonio - dmplExpected
  const checks = {
    journal,
    trial: trial.balanced,
    bp: Math.abs(bpDifference) < 0.01,
    bpManagement: managementBp.balanced,
    bpManagementSeries: !firstMonthlyIssue,
    cash: Math.abs(cashDifference) < 0.01,
    result: Number.isFinite(result),
    dmpl: Math.abs(dmplDifference) < 0.01,
  }
  const overall = checks.journal && checks.trial && checks.bp && checks.bpManagement && checks.bpManagementSeries && checks.cash && checks.result && checks.dmpl

  return {
    status,
    result,
    bpDifference,
    managementBpDifference: managementBp.difference,
    managementBpMonth: managementBp.month,
    monthlyBp,
    firstMonthlyIssue,
    cashDifference,
    dmplExpected,
    dmplDifference,
    checks: { ...checks, overall },
    canPreClose: overall,
    canClose: status === 'PRE_FECHAMENTO' && overall,
  }
}

export function nextClosingStatus(current: ClosingStatus, checksOk: boolean): ClosingStatus {
  if (current === 'ABERTO' && checksOk) return 'PRE_FECHAMENTO'
  if (current === 'PRE_FECHAMENTO' && checksOk) return 'FECHADO'
  return current
}

export function canPostToPeriod(status: ClosingStatus) {
  return status !== 'FECHADO'
}

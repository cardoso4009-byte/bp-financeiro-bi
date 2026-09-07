import {
  closingEngine,
  preClosingDecision,
  type ClosingDecision,
  type ClosingStatus,
} from './closing-engine'

export type CompetenciaState = {
  competencia: string
  status: ClosingStatus
}

export type CompetenciaTransition = {
  competencia: string
  previousStatus: ClosingStatus
  status: ClosingStatus
  changed: boolean
  allowed: boolean
  reason: string
  decision: ClosingDecision
}

export function evaluateCompetencia(
  competencia: string,
  status: ClosingStatus,
) {
  const closing = closingEngine(status)
  const decision = preClosingDecision(status, closing.checks.overall)

  return {
    competencia,
    status,
    closing,
    decision,
  }
}

export function transitionCompetencia(
  competencia: string,
  currentStatus: ClosingStatus,
): CompetenciaTransition {
  const closing = closingEngine(currentStatus)

  if (currentStatus === 'ABERTO') {
    const decision = preClosingDecision(currentStatus, closing.checks.overall)

    return {
      competencia,
      previousStatus: currentStatus,
      status: decision.targetStatus,
      changed: decision.allowed,
      allowed: decision.allowed,
      reason: decision.reason,
      decision,
    }
  }

  if (currentStatus === 'PRE_FECHAMENTO') {
    const allowed = closing.canClose
    const decision: ClosingDecision = {
      allowed,
      targetStatus: allowed ? 'FECHADO' : 'PRE_FECHAMENTO',
      reason: allowed
        ? 'Todas as validações obrigatórias continuam aprovadas. Competência liberada para fechamento definitivo.'
        : 'Fechamento definitivo bloqueado: existem pendências nas validações obrigatórias.',
    }

    return {
      competencia,
      previousStatus: currentStatus,
      status: decision.targetStatus,
      changed: allowed,
      allowed,
      reason: decision.reason,
      decision,
    }
  }

  const decision: ClosingDecision = {
    allowed: false,
    targetStatus: 'FECHADO',
    reason: 'A competência já está fechada e não pode avançar para outro estado.',
  }

  return {
    competencia,
    previousStatus: currentStatus,
    status: currentStatus,
    changed: false,
    allowed: false,
    reason: decision.reason,
    decision,
  }
}

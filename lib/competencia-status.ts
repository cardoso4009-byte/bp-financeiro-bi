import {
  closingEngine,
  preClosingDecision,
  nextClosingStatus,
  type ClosingStatus,
} from './closing-engine'

export type CompetenciaStatus = {
  competencia: string
  status: ClosingStatus
}

export type CompetenciaTransition = CompetenciaStatus & {
  changed: boolean
  reason: string
  checksOk: boolean
}

export function evaluateCompetencia(
  competencia: string,
  status: ClosingStatus = 'ABERTO',
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
  current: ClosingStatus,
): CompetenciaTransition {
  const closing = closingEngine(current)
  const checksOk = closing.checks.overall
  const nextStatus = nextClosingStatus(current, checksOk)

  const reason = nextStatus === current
    ? current === 'FECHADO'
      ? 'A competência já está fechada.'
      : 'A transição está bloqueada: existem pendências nas validações obrigatórias.'
    : nextStatus === 'PRE_FECHAMENTO'
      ? 'Todas as validações obrigatórias foram aprovadas. Competência liberada para pré-fechamento.'
      : 'Todas as validações obrigatórias foram aprovadas. Competência liberada para fechamento definitivo.'

  return {
    competencia,
    status: nextStatus,
    changed: nextStatus !== current,
    reason,
    checksOk,
  }
}

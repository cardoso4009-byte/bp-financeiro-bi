import { closingEngine, preClosingDecision, type ClosingStatus } from './closing-engine'

export type CompetenciaStatus = {
  competencia: string
  status: ClosingStatus
}

export const DEFAULT_COMPETENCIA = '2026-12'

export function competenciaStatus(competencia = DEFAULT_COMPETENCIA): CompetenciaStatus {
  const closing = closingEngine()
  return { competencia, status: closing.status }
}

export function requestPreClosing(competencia = DEFAULT_COMPETENCIA): CompetenciaStatus {
  const current = competenciaStatus(competencia)
  const closing = closingEngine(current.status)
  const decision = preClosingDecision(current.status, closing.checks.overall)
  return decision.allowed ? { competencia, status: decision.targetStatus } : current
}

export function requestClosing(competencia = DEFAULT_COMPETENCIA): CompetenciaStatus {
  const current = competenciaStatus(competencia)
  const closing = closingEngine(current.status)
  return { competencia, status: closing.canClose ? 'FECHADO' : current.status }
}

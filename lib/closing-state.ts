import type { ClosingStatus } from './closing-engine'

/** Estado persistido de fechamento por competência. */
export const CLOSING_STORAGE_KEY = 'bp-financeiro-fechamentos'

export type ClosingState = {
  month: string
  status: ClosingStatus
  updatedAt: string
  closedAt?: string
}

function isClosingStatus(value: unknown): value is ClosingStatus {
  return value === 'ABERTO' || value === 'PRE_FECHAMENTO' || value === 'FECHADO'
}

function isClosingState(value: unknown): value is ClosingState {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<ClosingState>
  return typeof item.month === 'string' && /^\d{4}-\d{2}$/.test(item.month) && isClosingStatus(item.status) && typeof item.updatedAt === 'string'
}

export function readClosingStates(): Record<string, ClosingState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(CLOSING_STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => isClosingState(value))) as Record<string, ClosingState>
  } catch {
    return {}
  }
}

export function getClosingState(month: string): ClosingState {
  const saved = readClosingStates()[month]
  return saved ?? { month, status: 'ABERTO', updatedAt: new Date(0).toISOString() }
}

export function writeClosingState(month: string, status: ClosingStatus): ClosingState {
  const now = new Date().toISOString()
  const previous = getClosingState(month)
  const next: ClosingState = {
    month,
    status,
    updatedAt: now,
    ...(status === 'FECHADO' ? { closedAt: previous.closedAt ?? now } : {}),
  }
  const states = readClosingStates()
  states[month] = next
  if (typeof window !== 'undefined') window.localStorage.setItem(CLOSING_STORAGE_KEY, JSON.stringify(states))
  return next
}

export function canPostToPeriod(month: string) {
  return getClosingState(month).status !== 'FECHADO'
}

export function canMoveToClosingStatus(current: ClosingStatus, target: ClosingStatus, checksOk: boolean) {
  if (!checksOk) return false
  if (current === 'ABERTO' && target === 'PRE_FECHAMENTO') return true
  if (current === 'PRE_FECHAMENTO' && target === 'FECHADO') return true
  return false
}

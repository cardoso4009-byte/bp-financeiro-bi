import type { V2ManagementAction, V2ManagementAlert, V2ManagementThresholds } from './v2-management'
import { DEFAULT_MANAGEMENT_THRESHOLDS } from './v2-management'

export const V2_MANAGEMENT_ALERTS_KEY = 'bp-financeiro-v2-management-alerts-2026'
export const V2_MANAGEMENT_ACTIONS_KEY = 'bp-financeiro-v2-management-actions-2026'
export const V2_MANAGEMENT_THRESHOLDS_KEY = 'bp-financeiro-v2-management-thresholds-2026'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function readV2ManagementAlerts(): V2ManagementAlert[] {
  return readJson<V2ManagementAlert[]>(V2_MANAGEMENT_ALERTS_KEY, [])
}

export function writeV2ManagementAlerts(alerts: V2ManagementAlert[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(V2_MANAGEMENT_ALERTS_KEY, JSON.stringify(alerts))
}

export function readV2ManagementActions(): V2ManagementAction[] {
  return readJson<V2ManagementAction[]>(V2_MANAGEMENT_ACTIONS_KEY, [])
}

export function writeV2ManagementActions(actions: V2ManagementAction[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(V2_MANAGEMENT_ACTIONS_KEY, JSON.stringify(actions))
}

export function readV2ManagementThresholds(): V2ManagementThresholds {
  return readJson<V2ManagementThresholds>(V2_MANAGEMENT_THRESHOLDS_KEY, DEFAULT_MANAGEMENT_THRESHOLDS)
}

export function writeV2ManagementThresholds(thresholds: V2ManagementThresholds): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(V2_MANAGEMENT_THRESHOLDS_KEY, JSON.stringify(thresholds))
}

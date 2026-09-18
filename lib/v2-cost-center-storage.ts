import type { CostCenter } from './v2-data-model'

const STORAGE_KEY = 'bp-financeiro-v2-cost-centers'

export function readV2CostCenters(): CostCenter[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as CostCenter[] : []
  } catch {
    return []
  }
}

export function writeV2CostCenters(centers: CostCenter[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(centers))
}

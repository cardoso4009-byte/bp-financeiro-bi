import type { FinancialEntry, ImportBatch } from './v2-data-model'
import { createV2PersistenceStore, type V2PersistenceStore } from './v2-persistence'

const STORAGE_KEY = 'bp-financeiro-v2-store'

export function readV2BrowserStore(): V2PersistenceStore {
  if (typeof window === 'undefined') return createV2PersistenceStore()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createV2PersistenceStore()
    const parsed = JSON.parse(raw) as Partial<V2PersistenceStore>
    return createV2PersistenceStore(parsed)
  } catch {
    return createV2PersistenceStore()
  }
}

export function writeV2BrowserStore(store: V2PersistenceStore): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function clearV2BrowserStore(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

export function makeEntryId(batchId: string, rowNumber: number): string {
  return `${batchId}-linha-${rowNumber}`
}

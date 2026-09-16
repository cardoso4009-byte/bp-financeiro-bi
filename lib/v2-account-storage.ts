import type { Account } from './v2-data-model'

const STORAGE_KEY = 'bp-financeiro-v2-accounts'

export function readV2Accounts(): Account[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as Account[] : []
  } catch {
    return []
  }
}

export function writeV2Accounts(accounts: Account[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

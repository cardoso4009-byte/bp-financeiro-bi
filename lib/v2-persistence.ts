import type { FinancialEntry, ImportBatch } from './v2-data-model'

export interface V2PersistenceStore {
  batches: ImportBatch[]
  entries: FinancialEntry[]
}

export interface PersistBatchInput {
  batch: ImportBatch
  entries: FinancialEntry[]
}

export interface PersistBatchResult {
  batch: ImportBatch
  entries: FinancialEntry[]
  duplicateExternalIds: string[]
}

export function createV2PersistenceStore(initial: Partial<V2PersistenceStore> = {}): V2PersistenceStore {
  return { batches: [...(initial.batches ?? [])], entries: [...(initial.entries ?? [])] }
}

export function findExistingExternalIds(store: V2PersistenceStore, companyId: string, externalIds: Array<string | undefined>): Set<string> {
  const requested = new Set(externalIds.filter((id): id is string => Boolean(id)))
  return new Set(store.entries
    .filter((entry) => entry.companyId === companyId && entry.externalId && requested.has(entry.externalId))
    .map((entry) => entry.externalId as string))
}

/**
 * Persiste somente linhas já validadas. A checagem de externalId é feita
 * por empresa para impedir que uma importação repita o mesmo lançamento.
 * A função é deliberadamente pura: a camada de armazenamento real será
 * conectada depois, sem alterar o contrato dos demonstrativos.
 */
export function persistApprovedBatch(store: V2PersistenceStore, input: PersistBatchInput): PersistBatchResult {
  const existing = findExistingExternalIds(store, input.batch.companyId, input.entries.map((entry) => entry.externalId))
  const seen = new Set<string>()
  const duplicateExternalIds: string[] = []
  const accepted: FinancialEntry[] = []

  for (const entry of input.entries) {
    if (entry.companyId !== input.batch.companyId) continue
    if (entry.externalId) {
      if (existing.has(entry.externalId) || seen.has(entry.externalId)) {
        duplicateExternalIds.push(entry.externalId)
        continue
      }
      seen.add(entry.externalId)
    }
    accepted.push(entry)
  }

  const finalBatch: ImportBatch = {
    ...input.batch,
    rowsAccepted: accepted.length,
    rowsRejected: input.batch.rowsReceived - accepted.length,
    status: accepted.length === input.batch.rowsReceived ? 'completed' : accepted.length > 0 ? 'completed_with_errors' : 'failed',
  }

  return { batch: finalBatch, entries: accepted, duplicateExternalIds }
}

export function commitV2Persistence(store: V2PersistenceStore, result: PersistBatchResult): V2PersistenceStore {
  return {
    batches: [...store.batches, result.batch],
    entries: [...store.entries, ...result.entries],
  }
}

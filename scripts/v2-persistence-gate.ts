import { createV2PersistenceStore, persistApprovedBatch, commitV2Persistence } from '../lib/v2-persistence'
import type { FinancialEntry, ImportBatch } from '../lib/v2-data-model'

const entry = (id: string, externalId: string): FinancialEntry => ({
  id, companyId: 'empresa-1', accountId: 'conta-101', description: `Lancamento ${id}`,
  date: '2026-09-15', competence: '2026-09', amount: 100, nature: 'credit',
  cashBasis: 'caixa', movementClass: 'receita', source: 'csv', externalId, reconciled: false,
})

const makeBatch = (id: string): ImportBatch => ({
  id, companyId: 'empresa-1', source: 'csv', fileName: 'teste.csv', importedAt: '2026-09-15T12:00:00Z',
  rowsReceived: 1, rowsAccepted: 1, rowsRejected: 0, status: 'processing',
})

let store = createV2PersistenceStore()
const first = persistApprovedBatch(store, { batch: makeBatch('lote-1'), entries: [entry('1', 'nf-1')] })
if (first.entries.length !== 1 || first.duplicateExternalIds.length !== 0 || first.batch.status !== 'completed') throw new Error('Falha ao persistir lote válido')
store = commitV2Persistence(store, first)

const duplicate = persistApprovedBatch(store, { batch: makeBatch('lote-2'), entries: [entry('2', 'nf-1')] })
if (duplicate.entries.length !== 0 || duplicate.duplicateExternalIds[0] !== 'nf-1' || duplicate.batch.status !== 'failed') throw new Error('Falha na prevenção de duplicidade')

console.log('V2 Persistence Gate: OK')

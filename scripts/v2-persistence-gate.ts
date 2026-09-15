import { createV2PersistenceStore, persistApprovedBatch, commitV2Persistence } from '../lib/v2-persistence'
import type { FinancialEntry, ImportBatch } from '../lib/v2-data-model'

const entry = (id: string, externalId: string): FinancialEntry => ({
  id, companyId: 'empresa-1', accountId: 'conta-101', description: `Lancamento ${id}`,
  date: '2026-09-15', competence: '2026-09', amount: 100, nature: 'credit',
  cashBasis: 'caixa', movementClass: 'receita', source: 'csv', externalId, reconciled: false,
})

const batch: ImportBatch = {
  id: 'lote-1', companyId: 'empresa-1', source: 'csv', fileName: 'teste.csv', importedAt: '2026-09-15T12:00:00Z',
  rowsReceived: 1, rowsAccepted: 1, rowsRejected: 0, status: 'processing',
}

let store = createV2PersistenceStore()
let result = persistApprovedBatch(store, { batch, entries: [entry('1', 'nf-1')] })
if (result.entries.length !== 1 || result.duplicateExternalIds.length !== 0 || result.batch.status !== 'completed') throw new Error('Falha ao persistir lote válido')
store = commitV2Persistence(store, result)

const duplicate = persistApprovedBatch(store, { ...batch, id: 'lote-2', rowsReceived: 1 }, [entry('2', 'nf-1')].length ? { batch: { ...batch, id: 'lote-2', rowsReceived: 1 }, entries: [entry('2', 'nf-1')] } : { batch, entries: [] })
if (duplicate.entries.length !== 0 || duplicate.duplicateExternalIds[0] !== 'nf-1' || duplicate.batch.status !== 'failed') throw new Error('Falha na prevenção de duplicidade')

console.log('V2 Persistence Gate: OK')

import { buildV2FinancialBase, filterV2BaseByPeriod } from '../lib/v2-financial-base'
import type { FinancialEntry } from '../lib/v2-data-model'

const entries: FinancialEntry[] = [
  { id: '1', companyId: 'empresa-1', accountId: 'receita', description: 'Venda', date: '2026-09-10', competence: '2026-09', amount: 1000, nature: 'credit', cashBasis: 'competencia', movementClass: 'receita', source: 'csv', externalId: 'v-1', reconciled: false },
  { id: '2', companyId: 'empresa-1', accountId: 'opex', description: 'Despesa', date: '2026-09-12', competence: '2026-09', amount: 300, nature: 'debit', cashBasis: 'caixa', movementClass: 'opex', source: 'csv', externalId: 'd-1', settlementDate: '2026-09-13', reconciled: false },
  { id: '3', companyId: 'empresa-1', accountId: 'receita', description: 'Venda anterior', date: '2026-08-31', competence: '2026-08', amount: 500, nature: 'credit', cashBasis: 'competencia', movementClass: 'receita', source: 'csv', externalId: 'v-0', reconciled: false },
]

const base = buildV2FinancialBase(entries)
if (base.totalEntries !== 3 || base.totalCredit !== 1500 || base.totalDebit !== 300) throw new Error('Falha nos totais da Base Financeira V2')
if (base.periods.join(',') !== '2026-08,2026-09') throw new Error('Falha no catálogo de períodos')
if (filterV2BaseByPeriod(base, '2026-09').length !== 2) throw new Error('Falha no filtro de competência')
if (!base.entries.find((entry) => entry.id === '2')?.isCashSettled) throw new Error('Falha na identificação de liquidação em caixa')

console.log('V2 Financial Base Gate: OK')

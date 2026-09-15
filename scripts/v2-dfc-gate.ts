import { buildV2FinancialBase } from '../lib/v2-financial-base'
import { buildV2Dfc, filterV2DfcByPeriod } from '../lib/v2-dfc'
import type { FinancialEntry } from '../lib/v2-data-model'

const entries: FinancialEntry[] = [
  {
    id: 'dfc-1', companyId: 'c1', accountId: 'a1', date: '2026-09-03', competence: '2026-09',
    amount: 1000, nature: 'credit', cashBasis: 'caixa', movementClass: 'receita', source: 'manual',
    settlementDate: '2026-09-05',
  },
  {
    id: 'dfc-2', companyId: 'c1', accountId: 'a2', date: '2026-09-04', competence: '2026-09',
    amount: 300, nature: 'debit', cashBasis: 'competencia', movementClass: 'opex', source: 'manual',
    settlementDate: '2026-09-10',
  },
  {
    id: 'dfc-3', companyId: 'c1', accountId: 'a3', date: '2026-09-06', competence: '2026-09',
    amount: 200, nature: 'debit', cashBasis: 'caixa', movementClass: 'capex', source: 'manual',
    settlementDate: '2026-09-12',
  },
  {
    id: 'dfc-4', companyId: 'c1', accountId: 'a4', date: '2026-09-07', competence: '2026-09',
    amount: 50, nature: 'debit', cashBasis: 'caixa', movementClass: 'financeiro', source: 'manual',
  },
  {
    id: 'dfc-5', companyId: 'c1', accountId: 'a5', date: '2026-09-08', competence: '2026-09',
    amount: 75, nature: 'debit', cashBasis: 'caixa', movementClass: 'transferencia', source: 'manual',
  },
]

const base = buildV2FinancialBase(entries)
const report = buildV2Dfc(base, '2026-09')
const selected = report.selectedPeriod

if (!selected) throw new Error('DFC Gate: período selecionado não encontrado')
if (selected.operacional !== 700) throw new Error(`DFC Gate: operacional esperado 700, recebido ${selected.operacional}`)
if (selected.investimento !== -200) throw new Error(`DFC Gate: investimento esperado -200, recebido ${selected.investimento}`)
if (selected.financeiro !== 0 - 50) throw new Error(`DFC Gate: financeiro esperado -50, recebido ${selected.financeiro}`)
if (selected.transferencia !== -75) throw new Error(`DFC Gate: transferência esperada -75, recebido ${selected.transferencia}`)
if (selected.variacaoCaixa !== 375) throw new Error(`DFC Gate: variação esperada 375, recebido ${selected.variacaoCaixa}`)
if (selected.entries !== 3) throw new Error(`DFC Gate: entries esperado 3, recebido ${selected.entries}`)
if (report.cashSettledEntries !== 3) throw new Error(`DFC Gate: liquidados esperado 3, recebido ${report.cashSettledEntries}`)
if (report.unsettledEntries !== 2) throw new Error(`DFC Gate: não liquidados esperado 2, recebido ${report.unsettledEntries}`)
if (report.cashBasisWithoutSettlement !== 2) throw new Error(`DFC Gate: caixa sem liquidação esperado 2, recebido ${report.cashBasisWithoutSettlement}`)
if (filterV2DfcByPeriod(base, '2026-09').length !== 3) throw new Error('DFC Gate: filtro por período incorreto')

console.log('V2 DFC Gate: OK')

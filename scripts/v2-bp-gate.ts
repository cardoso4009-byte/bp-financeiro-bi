import { buildV2FinancialBase } from '../lib/v2-financial-base'
import { buildV2Bp, filterV2BpAccountsByStatement } from '../lib/v2-bp'
import type { Account, FinancialEntry } from '../lib/v2-data-model'

const accounts: Account[] = [
  { id: 'a1', companyId: 'c1', code: '1.1', name: 'Caixa', nature: 'debit', statement: 'ativo', active: true },
  { id: 'a2', companyId: 'c1', code: '2.1', name: 'Fornecedores', nature: 'credit', statement: 'passivo', active: true },
  { id: 'a3', companyId: 'c1', code: '3.1', name: 'Capital', nature: 'credit', statement: 'patrimonio_liquido', active: true },
  { id: 'a4', companyId: 'c1', code: '4.1', name: 'Receita', nature: 'credit', statement: 'resultado', active: true },
]

const entries: FinancialEntry[] = [
  {
    id: 'bp-1', companyId: 'c1', accountId: 'a1', date: '2026-08-05', competence: '2026-08',
    amount: 1000, nature: 'debit', cashBasis: 'caixa', movementClass: 'outros', source: 'manual',
    description: 'Integralização em caixa', reconciled: true,
  },
  {
    id: 'bp-2', companyId: 'c1', accountId: 'a3', date: '2026-08-05', competence: '2026-08',
    amount: 1000, nature: 'credit', cashBasis: 'caixa', movementClass: 'outros', source: 'manual',
    description: 'Capital social', reconciled: true,
  },
  {
    id: 'bp-3', companyId: 'c1', accountId: 'a2', date: '2026-09-05', competence: '2026-09',
    amount: 300, nature: 'credit', cashBasis: 'competencia', movementClass: 'opex', source: 'manual',
    description: 'Fornecedor reconhecido', reconciled: true,
  },
  {
    id: 'bp-4', companyId: 'c1', accountId: 'a1', date: '2026-09-10', competence: '2026-09',
    amount: 300, nature: 'credit', cashBasis: 'caixa', movementClass: 'opex', source: 'manual',
    description: 'Pagamento ao fornecedor', reconciled: true,
  },
  {
    id: 'bp-5', companyId: 'c1', accountId: 'a4', date: '2026-09-12', competence: '2026-09',
    amount: 500, nature: 'credit', cashBasis: 'competencia', movementClass: 'receita', source: 'manual',
    description: 'Receita do período', reconciled: true,
  },
]

const base = buildV2FinancialBase(entries)
const report = buildV2Bp(base, accounts, '2026-09')

if (report.ativo !== 700) throw new Error(`BP Gate: ativo esperado 700, recebido ${report.ativo}`)
if (report.passivo !== 300) throw new Error(`BP Gate: passivo esperado 300, recebido ${report.passivo}`)
if (report.patrimonioLiquido !== 1000) throw new Error(`BP Gate: PL esperado 1000, recebido ${report.patrimonioLiquido}`)
if (report.passivoMaisPatrimonioLiquido !== 1300) throw new Error('BP Gate: P + PL incorreto')
if (report.diferencaPatrimonial !== -600) throw new Error(`BP Gate: diferença esperada -600, recebido ${report.diferencaPatrimonial}`)
if (report.balanced) throw new Error('BP Gate: equação não deveria estar equilibrada com fixture incompleta')
if (report.excludedResultEntries !== 1) throw new Error(`BP Gate: resultado excluído esperado 1, recebido ${report.excludedResultEntries}`)
if (report.entriesInSnapshot !== 5) throw new Error(`BP Gate: snapshot esperado 5, recebido ${report.entriesInSnapshot}`)
if (filterV2BpAccountsByStatement(report, 'ativo').length !== 1) throw new Error('BP Gate: filtro de ativo incorreto')

console.log('V2 BP Gate: OK')

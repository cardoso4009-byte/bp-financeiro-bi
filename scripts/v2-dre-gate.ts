import { buildV2Dre, isDreEntry } from '../lib/v2-dre'
import { buildV2FinancialBase } from '../lib/v2-financial-base'
import type { FinancialEntry } from '../lib/v2-data-model'

const entries: FinancialEntry[] = [
  { id: '1', companyId: 'empresa-1', accountId: 'r', description: 'Receita', date: '2026-09-05', competence: '2026-09', amount: 10000, nature: 'credit', cashBasis: 'competencia', movementClass: 'receita', source: 'csv', externalId: 'r-1', reconciled: false },
  { id: '2', companyId: 'empresa-1', accountId: 'c', description: 'Custo', date: '2026-09-06', competence: '2026-09', amount: 3000, nature: 'debit', cashBasis: 'competencia', movementClass: 'custo', source: 'csv', externalId: 'c-1', reconciled: false },
  { id: '3', companyId: 'empresa-1', accountId: 'o', description: 'OPEX', date: '2026-09-07', competence: '2026-09', amount: 2000, nature: 'debit', cashBasis: 'competencia', movementClass: 'opex', source: 'csv', externalId: 'o-1', reconciled: false },
  { id: '4', companyId: 'empresa-1', accountId: 'f', description: 'Despesa financeira', date: '2026-09-08', competence: '2026-09', amount: 500, nature: 'debit', cashBasis: 'competencia', movementClass: 'financeiro', source: 'csv', externalId: 'f-1', reconciled: false },
  { id: '5', companyId: 'empresa-1', accountId: 'i', description: 'Imposto', date: '2026-09-09', competence: '2026-09', amount: 700, nature: 'debit', cashBasis: 'competencia', movementClass: 'imposto', source: 'csv', externalId: 'i-1', reconciled: false },
  { id: '6', companyId: 'empresa-1', accountId: 'x', description: 'CAPEX fora da DRE', date: '2026-09-10', competence: '2026-09', amount: 9000, nature: 'debit', cashBasis: 'caixa', movementClass: 'capex', source: 'csv', externalId: 'x-1', reconciled: false },
  { id: '7', companyId: 'empresa-1', accountId: 'r', description: 'Receita anterior', date: '2026-08-31', competence: '2026-08', amount: 1000, nature: 'credit', cashBasis: 'competencia', movementClass: 'receita', source: 'csv', externalId: 'r-0', reconciled: false },
]

const base = buildV2FinancialBase(entries)
const report = buildV2Dre(base, '2026-09')
const september = report.selectedPeriod

if (!september) throw new Error('Falha ao selecionar período da DRE V2')
if (september.receita !== 10000 || september.custos !== -3000 || september.opex !== -2000) throw new Error('Falha nas linhas operacionais da DRE V2')
if (september.ebitda !== 5000 || september.resultadoFinanceiro !== -500 || september.impostos !== -700 || september.resultadoLiquido !== 3800) throw new Error('Falha nos resultados da DRE V2')
if (september.entries !== 6) throw new Error('Falha na contagem do período')
if (isDreEntry(base.entries.find((entry) => entry.id === '6')!)) throw new Error('CAPEX não deve compor a DRE')
if (report.periods.length !== 2) throw new Error('Falha na visão mensal da DRE V2')

console.log('V2 DRE Gate: OK')

import { statementEngine } from './statement-engine'
import { buildLedger } from './razao-balancete'
import { mappingFor } from './account-mapping'

export function cashFlowEngine() {
  const statements = statementEngine()
  const ledger = buildLedger()
  const operational = ledger.filter(r => mappingFor(r.code)?.cashFlow === 'operacional').reduce((s,r) => s + (r.class === 'receita' ? r.balance : -r.balance), 0)
  const investment = ledger.filter(r => mappingFor(r.code)?.cashFlow === 'investimento').reduce((s,r) => s + r.balance, 0)
  const financing = ledger.filter(r => mappingFor(r.code)?.cashFlow === 'financiamento').reduce((s,r) => s + r.balance, 0)
  const caixa = ledger.find(r => r.code === '1.1.01')?.balance ?? 0
  const initialCash = 0
  const variation = operational + investment + financing
  const finalCash = initialCash + variation
  return { operational, investment, financing, variation, initialCash, finalCash, balanceCash: caixa, reconciliation: finalCash - caixa, result: statements.totals.receitas - statements.totals.custos - statements.totals.despesas }
}

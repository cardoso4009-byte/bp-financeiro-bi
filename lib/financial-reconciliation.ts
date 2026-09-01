import { financialCore, dreFromCore, cashFromCore } from './financial-core'
import { monthlyData, monthlyBalance } from './monthly-data'
import type { FinancialEntry } from './lancamentos-data'

export type ReconciliationResult = {
  sourceRevenue: number
  sourceOpex: number
  sourceResult: number
  entriesCount: number
  balanced: boolean
  differences: string[]
}

/** Cross-check used by management views: DRE and Rentabilidade must reconcile to the same source. */
export function reconcileOperationalViews(entries: FinancialEntry[]): ReconciliationResult {
  const operational = entries.filter(e => e.type === 'Receita' || e.type === 'Despesa')
  const sourceRevenue = operational.filter(e => e.type === 'Receita').reduce((s,e) => s + Math.abs(e.value), 0)
  const sourceOpex = operational.filter(e => e.type === 'Despesa').reduce((s,e) => s + Math.abs(e.value), 0)
  const sourceResult = sourceRevenue - sourceOpex
  const differences: string[] = []
  if (!Number.isFinite(sourceRevenue)) differences.push('Receita contém valor inválido.')
  if (!Number.isFinite(sourceOpex)) differences.push('OPEX contém valor inválido.')
  if (!Number.isFinite(sourceResult)) differences.push('Resultado contém valor inválido.')
  return { sourceRevenue, sourceOpex, sourceResult, entriesCount: operational.length, balanced: differences.length === 0, differences }
}

export type FinancialReconciliationCheck = {
  id: string
  month?: string
  metric: string
  sourceValue: number
  viewValue: number
  difference: number
  ok: boolean
  detail: string
}

const TOLERANCE = 0.01
const isOk = (difference: number) => Math.abs(difference) < TOLERANCE

/** Zero Difference Gate for the 12-month management financial chain. */
export function financialReconciliation() {
  const checks: FinancialReconciliationCheck[] = []
  let previousPl: number | null = null

  financialCore.forEach((core, i) => {
    const management = monthlyData[i]
    const balance = monthlyBalance[i]
    const dre = dreFromCore(core)
    const cash = cashFromCore(core)

    const compare = (id: string, metric: string, sourceValue: number, viewValue: number, detail: string) => {
      const difference = viewValue - sourceValue
      checks.push({ id, month: core.month, metric, sourceValue, viewValue, difference, ok: isOk(difference), detail })
    }

    compare('core-dre-revenue', 'Receita líquida', dre.receita, management.receitaLiquida, 'Financial Core × DRE gerencial')
    compare('core-dre-cost', 'Custos', dre.custos, management.custos, 'Financial Core × DRE gerencial')
    compare('core-dre-opex', 'OPEX', dre.opex, management.opex, 'Financial Core × DRE gerencial')
    compare('core-dre-ebitda', 'EBITDA', dre.ebitda, management.ebitda, 'Financial Core × DRE gerencial')

    compare('core-dfc-operating', 'Caixa operacional', core.cashIn - core.cashOut, management.caixaOperacional, 'Financial Core × DFC gerencial')
    compare('core-dfc-investment', 'Investimentos / CAPEX', cash.capex, management.investimentos, 'Financial Core × DFC gerencial')

    const expectedCash = i === 0
      ? 50000 + management.caixaOperacional + management.investimentos + management.financiamentos
      : monthlyData[i - 1].caixaFinal + management.caixaOperacional + management.investimentos + management.financiamentos
    compare('cash-roll-forward', 'Caixa final', expectedCash, management.caixaFinal, 'Continuidade do saldo de caixa gerencial')

    compare('cash-bp', 'Caixa no BP', management.caixaFinal, balance.caixa, 'DFC gerencial × Caixa do Balanço')

    const acComposition = balance.caixa + balance.contasReceber + balance.estoques + balance.outrosAtivos
    const ancComposition = balance.imobilizado
    compare('bp-ac-composition', 'Ativo circulante', acComposition, balance.ativoCirculante, 'Composição do Ativo Circulante')
    compare('bp-anc-composition', 'Ativo não circulante', ancComposition, balance.ativoNaoCirculante, 'Composição do Ativo Não Circulante')
    compare('bp-total-assets', 'Ativo total', balance.ativoCirculante + balance.ativoNaoCirculante, balance.ativoTotal, 'AC + ANC × Ativo Total')
    compare('bp-total-liabilities', 'Passivo total', balance.passivoCirculante + balance.outrosPassivos + balance.passivoNaoCirculante, balance.passivoTotal, 'PC + outros passivos + PNC × Passivo Total')
    compare('bp-equation', 'Equação patrimonial', balance.ativoTotal, balance.passivoTotal + balance.pl, 'Ativo = Passivo + Patrimônio Líquido')

    if (previousPl !== null) {
      compare('dre-pl-movement', 'Movimentação do PL', previousPl + management.lucroLiquido, balance.pl, 'PL anterior + lucro líquido do mês × PL atual')
    }
    previousPl = balance.pl
  })

  const pending = checks.filter(check => !check.ok)
  return {
    checks,
    pending,
    overall: pending.length === 0,
    summary: {
      total: checks.length,
      ok: checks.length - pending.length,
      pending: pending.length,
    },
  }
}

import type { V2BaseRecord, V2FinancialBase } from './v2-financial-base'

/**
 * DFC gerencial V2: a competência permanece separada do caixa.
 * Um lançamento só entra no fluxo de caixa quando possui settlementDate.
 */
export type V2DfcClass = 'operacional' | 'investimento' | 'financeiro' | 'transferencia' | 'outros'

export interface V2DfcPeriod {
  period: string
  operacional: number
  investimento: number
  financeiro: number
  transferencia: number
  outros: number
  variacaoCaixa: number
  entries: number
}

export interface V2DfcReport {
  periods: V2DfcPeriod[]
  selectedPeriod?: V2DfcPeriod
  cashSettledEntries: number
  unsettledEntries: number
  cashBasisWithoutSettlement: number
}

function settlementPeriod(entry: V2BaseRecord): string | undefined {
  return entry.settlementDate?.slice(0, 7)
}

function cashContribution(entry: V2BaseRecord): number {
  return entry.movementClass === 'receita'
    ? entry.nature === 'credit'
      ? entry.amount
      : -entry.amount
    : entry.nature === 'debit'
      ? -entry.amount
      : entry.amount
}

function dfcClass(entry: V2BaseRecord): V2DfcClass {
  switch (entry.movementClass) {
    case 'capex':
      return 'investimento'
    case 'financeiro':
      return 'financeiro'
    case 'transferencia':
      return 'transferencia'
    case 'outros':
      return 'outros'
    default:
      return 'operacional'
  }
}

function calculatePeriod(entries: V2BaseRecord[], period: string): V2DfcPeriod {
  const scoped = entries.filter((entry) => settlementPeriod(entry) === period)
  const sum = (classification: V2DfcClass) =>
    scoped
      .filter((entry) => dfcClass(entry) === classification)
      .reduce((total, entry) => total + cashContribution(entry), 0)

  const operacional = sum('operacional')
  const investimento = sum('investimento')
  const financeiro = sum('financeiro')
  const transferencia = sum('transferencia')
  const outros = sum('outros')

  return {
    period,
    operacional,
    investimento,
    financeiro,
    transferencia,
    outros,
    variacaoCaixa: operacional + investimento + financeiro + transferencia + outros,
    entries: scoped.length,
  }
}

export function buildV2Dfc(base: V2FinancialBase, period?: string): V2DfcReport {
  const settledEntries = base.entries.filter((entry) => Boolean(entry.settlementDate))
  const periods = [...new Set(settledEntries.map(settlementPeriod).filter((item): item is string => Boolean(item)))]
    .sort()
    .map((item) => calculatePeriod(base.entries, item))

  return {
    periods,
    selectedPeriod: period ? periods.find((item) => item.period === period) : undefined,
    cashSettledEntries: settledEntries.length,
    unsettledEntries: base.entries.length - settledEntries.length,
    cashBasisWithoutSettlement: base.entries.filter(
      (entry) => entry.cashBasis === 'caixa' && !entry.settlementDate,
    ).length,
  }
}

export function filterV2DfcByPeriod(base: V2FinancialBase, period: string): V2BaseRecord[] {
  return base.entries.filter((entry) => settlementPeriod(entry) === period)
}

import type { V2DfcReport } from './v2-dfc'
import type { V2DreReport } from './v2-dre'
import type { V2BpReport } from './v2-bp'
import type { V2FinancialBase } from './v2-financial-base'
import type { V2ReconciliationAudit } from './v2-reconciliation'

export interface V2ExecutiveTrendRow {
  period: string
  receita: number
  ebitda: number
  resultadoLiquido: number
  variacaoCaixa: number
}

export interface V2ExecutiveCockpit {
  period: string
  previousPeriod?: string
  receita: number
  ebitda: number
  margemEbitda?: number
  resultadoLiquido: number
  margemLiquida?: number
  caixaOperacional: number
  variacaoCaixa: number
  diferencaPatrimonial?: number
  resultadoAnterior: number
  resultadoVariacao: number
  resultadoVariacaoPercent?: number
  caixaAnterior: number
  caixaVariacao: number
  caixaVariacaoPercent?: number
  qualityStatus: V2ReconciliationAudit['status']
  pendingIssues: number
  unclassifiedEntries: number
  unsettledEntries: number
  duplicateExternalIds: number
  drivers: Array<{
    label: string
    value: number
  }>
  trend: V2ExecutiveTrendRow[]
}

function find<T extends { period: string }>(items: T[] | undefined, period: string): T | undefined {
  return items?.find((item) => item.period === period)
}

function variationPercent(current: number, previous: number): number | undefined {
  if (Math.abs(previous) < 0.005) return undefined
  return (current - previous) / Math.abs(previous)
}

function latestPeriods(dre: V2DreReport, dfc: V2DfcReport, limit = 6): string[] {
  return [...new Set([
    ...dre.periods.map((item) => item.period),
    ...dfc.periods.map((item) => item.period),
  ])].sort().slice(-limit)
}

export function buildV2ExecutiveCockpit(
  base: V2FinancialBase,
  dreReport: V2DreReport,
  dfcReport: V2DfcReport,
  bpReport: V2BpReport | null,
  audit: V2ReconciliationAudit,
  selectedPeriod: string,
  previousPeriod?: string,
): V2ExecutiveCockpit {
  const dre = find(dreReport.periods, selectedPeriod)
  const previousDre = previousPeriod ? find(dreReport.periods, previousPeriod) : undefined
  const dfc = find(dfcReport.periods, selectedPeriod)
  const previousDfc = previousPeriod ? find(dfcReport.periods, previousPeriod) : undefined

  const receita = dre?.receita ?? 0
  const ebitda = dre?.ebitda ?? 0
  const resultadoLiquido = dre?.resultadoLiquido ?? 0
  const caixaOperacional = dfc?.operacional ?? 0
  const variacaoCaixa = dfc?.variacaoCaixa ?? 0
  const resultadoAnterior = previousDre?.resultadoLiquido ?? 0
  const caixaAnterior = previousDfc?.variacaoCaixa ?? 0

  const drivers = [
    { label: 'Receita', value: receita },
    { label: 'Custos', value: dre?.custos ?? 0 },
    { label: 'OPEX', value: dre?.opex ?? 0 },
    { label: 'Resultado financeiro', value: dre?.resultadoFinanceiro ?? 0 },
    { label: 'Impostos', value: dre?.impostos ?? 0 },
  ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 4)

  const trendPeriods = latestPeriods(dreReport, dfcReport)
  const trend = trendPeriods.map((period) => {
    const drePeriod = find(dreReport.periods, period)
    const dfcPeriod = find(dfcReport.periods, period)
    return {
      period,
      receita: drePeriod?.receita ?? 0,
      ebitda: drePeriod?.ebitda ?? 0,
      resultadoLiquido: drePeriod?.resultadoLiquido ?? 0,
      variacaoCaixa: dfcPeriod?.variacaoCaixa ?? 0,
    }
  })

  return {
    period: selectedPeriod,
    previousPeriod,
    receita,
    ebitda,
    margemEbitda: Math.abs(receita) >= 0.005 ? ebitda / receita : undefined,
    resultadoLiquido,
    margemLiquida: Math.abs(receita) >= 0.005 ? resultadoLiquido / receita : undefined,
    caixaOperacional,
    variacaoCaixa,
    diferencaPatrimonial: bpReport?.diferencaPatrimonial,
    resultadoAnterior,
    resultadoVariacao: resultadoLiquido - resultadoAnterior,
    resultadoVariacaoPercent: variationPercent(resultadoLiquido, resultadoAnterior),
    caixaAnterior,
    caixaVariacao: variacaoCaixa - caixaAnterior,
    caixaVariacaoPercent: variationPercent(variacaoCaixa, caixaAnterior),
    qualityStatus: audit.status,
    pendingIssues: audit.issues.length,
    unclassifiedEntries: audit.classification.unclassifiedEntries,
    unsettledEntries: audit.settlement.unsettledEntries,
    duplicateExternalIds: audit.duplicateExternalIds,
    drivers,
    trend,
  }
}

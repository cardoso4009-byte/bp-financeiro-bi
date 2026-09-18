import type { Account } from './v2-data-model'
import type { V2FinancialBase } from './v2-financial-base'
import type { V2DrePeriod, V2DreReport } from './v2-dre'
import type { V2DfcPeriod, V2DfcReport } from './v2-dfc'
import type { V2BpReport } from './v2-bp'

export type V2AuditSeverity = 'info' | 'attention' | 'critical'
export type V2AuditStatus = 'ok' | 'attention' | 'pending'

export interface V2AuditIssue {
  code: string
  severity: V2AuditSeverity
  title: string
  count: number
  detail: string
}
export interface V2PeriodVariation {
  current: string
  previous?: string
  dreResultCurrent: number
  dreResultPrevious: number
  dreResultVariation: number
  cashCurrent: number
  cashPrevious: number
  cashVariation: number
  bpDifferenceCurrent?: number
  bpDifferencePrevious?: number
  bpDifferenceVariation?: number
}
export interface V2ReconciliationAudit {
  period: string
  previousPeriod?: string
  status: V2AuditStatus
  issues: V2AuditIssue[]
  classification: { totalEntries: number; classifiedEntries: number; unclassifiedEntries: number }
  settlement: { settledEntries: number; unsettledEntries: number; cashBasisWithoutSettlement: number }
  dreVsDfc: { dreResult: number; cashVariation: number; bridgeDifference: number; interpretation: 'aligned' | 'timing_bridge' }
  bpVsResult: {
    bpDifference: number; balanced: boolean; currentPl?: number; previousPl?: number; currentResult?: number
    plMovement?: number; unexplainedPlMovement?: number
    interpretation: 'balanced' | 'result_not_closed' | 'pl_movement_requires_review'
  }
  periodVariation: V2PeriodVariation
  duplicateExternalIds: number
}
function findPeriod(report: { periods: Array<{ period: string }> }, period: string) {
  return report.periods.find((item) => item.period === period)
}
function countDuplicateExternalIds(entries: V2FinancialBase['entries']): number {
  const seen = new Set<string>(), duplicates = new Set<string>()
  for (const entry of entries) {
    if (!entry.externalId) continue
    if (seen.has(entry.externalId)) duplicates.add(entry.externalId)
    seen.add(entry.externalId)
  }
  return duplicates.size
}
export function buildV2ReconciliationAudit(
  base: V2FinancialBase, accounts: Account[], dreReport: V2DreReport, dfcReport: V2DfcReport,
  bpReport: V2BpReport | null, selectedPeriod: string, previousPeriod?: string, previousBpReport?: V2BpReport | null,
): V2ReconciliationAudit {
  const accountById = new Map(accounts.map((account) => [account.id, account]))
  const unclassifiedEntries = base.entries.filter((entry) => {
    const account = accountById.get(entry.accountId)
    return !account || !account.companyId || !account.nature || !account.statement
  }).length
  const settledEntries = base.entries.filter((entry) => Boolean(entry.settlementDate)).length
  const unsettledEntries = base.entries.length - settledEntries
  const cashBasisWithoutSettlement = base.entries.filter((entry) => entry.cashBasis === 'caixa' && !entry.settlementDate).length
  const duplicateExternalIds = countDuplicateExternalIds(base.entries)
  const dre = findPeriod(dreReport, selectedPeriod) as V2DrePeriod | undefined
  const dfc = findPeriod(dfcReport, selectedPeriod) as V2DfcPeriod | undefined
  const previousDre = previousPeriod ? findPeriod(dreReport, previousPeriod) as V2DrePeriod | undefined : undefined
  const previousDfc = previousPeriod ? findPeriod(dfcReport, previousPeriod) as V2DfcPeriod | undefined : undefined
  const dreResult = dre?.resultadoLiquido ?? 0
  const cashVariation = dfc?.variacaoCaixa ?? 0
  const bridgeDifference = cashVariation - dreResult
  const previousResult = previousDre?.resultadoLiquido ?? 0
  const previousCash = previousDfc?.variacaoCaixa ?? 0
  const bpDifference = bpReport?.diferencaPatrimonial
  const previousBpDifference = previousBpReport?.diferencaPatrimonial
  const plMovement = bpReport && previousBpReport ? bpReport.patrimonioLiquido - previousBpReport.patrimonioLiquido : undefined
  const unexplainedPlMovement = plMovement !== undefined ? plMovement - dreResult : undefined
  const issues: V2AuditIssue[] = []
  if (unclassifiedEntries > 0) issues.push({code:'UNCLASSIFIED_ENTRIES',severity:'attention',title:'Lançamentos sem classificação completa',count:unclassifiedEntries,detail:'Conta inexistente ou classificação da conta incompleta. O motor não cria classificação automática.'})
  if (unsettledEntries > 0) issues.push({code:'UNSETTLED_ENTRIES',severity:'info',title:'Lançamentos sem liquidação',count:unsettledEntries,detail:'Permanecem na competência, mas não entram na variação de caixa até haver settlementDate.'})
  if (cashBasisWithoutSettlement > 0) issues.push({code:'CASH_WITHOUT_SETTLEMENT',severity:'attention',title:'Marcados como caixa sem liquidação efetiva',count:cashBasisWithoutSettlement,detail:'Requer revisão operacional da data efetiva de liquidação.'})
  if (duplicateExternalIds > 0) issues.push({code:'DUPLICATE_EXTERNAL_ID',severity:'critical',title:'IDs externos duplicados',count:duplicateExternalIds,detail:'Pode indicar duplicidade de importação e deve ser investigado antes de nova carga.'})
  if (bpReport && !bpReport.balanced) issues.push({code:'BP_UNBALANCED',severity:'critical',title:'Equação patrimonial não conciliada',count:1,detail:'Ativo difere de Passivo + Patrimônio Líquido. Nenhum ajuste artificial é criado.'})
  if (bpReport && previousBpReport && Math.abs(unexplainedPlMovement ?? 0) >= 0.005) issues.push({code:'PL_MOVEMENT_REVIEW',severity:'attention',title:'Movimento de PL requer explicação',count:1,detail:'A variação do PL não coincide com o resultado do período. Pode refletir capital, distribuições, ajustes ou ausência de fechamento do resultado.'})
  const status: V2AuditStatus =
    unclassifiedEntries > 0 ? 'pending' :
    duplicateExternalIds > 0 || Boolean(bpReport && !bpReport.balanced) ? 'attention' : 'ok'
  return {
    period:selectedPeriod, previousPeriod, status, issues,
    classification:{totalEntries:base.totalEntries,classifiedEntries:base.totalEntries-unclassifiedEntries,unclassifiedEntries},
    settlement:{settledEntries,unsettledEntries,cashBasisWithoutSettlement},
    dreVsDfc:{dreResult,cashVariation,bridgeDifference,interpretation:Math.abs(bridgeDifference)<0.005?'aligned':'timing_bridge'},
    bpVsResult:{
      bpDifference:bpDifference??0,balanced:bpReport?.balanced??false,currentPl:bpReport?.patrimonioLiquido,
      previousPl:previousBpReport?.patrimonioLiquido,currentResult:dreResult,plMovement,unexplainedPlMovement,
      interpretation:!bpReport?'result_not_closed':!bpReport.balanced?'pl_movement_requires_review':
        previousBpReport && Math.abs(unexplainedPlMovement??0)>=0.005?'pl_movement_requires_review':'balanced',
    },
    periodVariation:{
      current:selectedPeriod,previous:previousPeriod,dreResultCurrent:dreResult,dreResultPrevious:previousResult,
      dreResultVariation:dreResult-previousResult,cashCurrent:cashVariation,cashPrevious:previousCash,cashVariation:cashVariation-previousCash,
      bpDifferenceCurrent:bpDifference,bpDifferencePrevious:previousBpDifference,
      bpDifferenceVariation:bpDifference!==undefined&&previousBpDifference!==undefined?bpDifference-previousBpDifference:undefined,
    },
    duplicateExternalIds,
  }
}

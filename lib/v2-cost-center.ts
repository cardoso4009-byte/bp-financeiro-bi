import type { CostCenter } from './v2-data-model'
import type { V2FinancialBase, V2BaseRecord } from './v2-financial-base'

export interface V2CostCenterRow {
  costCenterId?: string
  code: string
  name: string
  entries: number
  receita: number
  custos: number
  opex: number
  ebitdaImpact: number
  capex: number
  resultadoFinanceiro: number
  impostos: number
  resultadoLiquido: number
}

export interface V2CostCenterReport {
  period: string
  rows: V2CostCenterRow[]
  unassignedEntries: number
  totalEntries: number
  assignedEntries: number
}

function dreContribution(entry: V2BaseRecord): number {
  return entry.movementClass === 'receita'
    ? (entry.nature === 'credit' ? entry.amount : -entry.amount)
    : (entry.nature === 'debit' ? -entry.amount : entry.amount)
}

function buildRow(entries: V2BaseRecord[], center?: CostCenter): V2CostCenterRow {
  const receita = entries.filter(e => e.movementClass === 'receita').reduce((s, e) => s + dreContribution(e), 0)
  const custos = entries.filter(e => e.movementClass === 'custo').reduce((s, e) => s + dreContribution(e), 0)
  const opex = entries.filter(e => e.movementClass === 'opex').reduce((s, e) => s + dreContribution(e), 0)
  const resultadoFinanceiro = entries.filter(e => e.movementClass === 'financeiro').reduce((s, e) => s + dreContribution(e), 0)
  const impostos = entries.filter(e => e.movementClass === 'imposto').reduce((s, e) => s + dreContribution(e), 0)
  const capex = entries.filter(e => e.movementClass === 'capex').reduce((s, e) => s + (e.nature === 'debit' ? e.amount : -e.amount), 0)
  return {
    costCenterId: center?.id,
    code: center?.code ?? 'SEM-CC',
    name: center?.name ?? 'Sem centro de resultado',
    entries: entries.length,
    receita,
    custos,
    opex,
    ebitdaImpact: receita + custos + opex,
    capex,
    resultadoFinanceiro,
    impostos,
    resultadoLiquido: receita + custos + opex + resultadoFinanceiro + impostos,
  }
}

export function buildV2CostCenterReport(
  base: V2FinancialBase,
  centers: CostCenter[],
  period: string,
): V2CostCenterReport {
  const scoped = base.entries.filter(entry => entry.period === period)
  const byCenter = new Map<string, V2BaseRecord[]>()
  scoped.forEach(entry => {
    const key = entry.costCenterId || ''
    const current = byCenter.get(key) ?? []
    current.push(entry)
    byCenter.set(key, current)
  })

  const known = new Map(centers.map(center => [center.id, center]))
  const rows = [...byCenter.entries()]
    .map(([id, entries]) => buildRow(entries, id ? known.get(id) : undefined))
    .sort((a, b) => Math.abs(b.resultadoLiquido) - Math.abs(a.resultadoLiquido))

  return {
    period,
    rows,
    unassignedEntries: byCenter.get('')?.length ?? 0,
    totalEntries: scoped.length,
    assignedEntries: scoped.filter(entry => Boolean(entry.costCenterId)).length,
  }
}

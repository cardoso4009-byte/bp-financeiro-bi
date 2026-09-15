import type { V2BaseRecord, V2FinancialBase } from './v2-financial-base'

export type V2DreClass = 'receita' | 'custo' | 'opex' | 'financeiro' | 'imposto'

export interface V2DrePeriod {
  period: string
  receita: number
  custos: number
  opex: number
  ebitda: number
  resultadoFinanceiro: number
  impostos: number
  resultadoLiquido: number
  entries: number
}

export interface V2DreReport {
  periods: V2DrePeriod[]
  selectedPeriod?: V2DrePeriod
}

function contribution(entry: V2BaseRecord): number {
  return entry.movementClass === 'receita'
    ? (entry.nature === 'credit' ? entry.amount : -entry.amount)
    : (entry.nature === 'debit' ? -entry.amount : entry.amount)
}

function calculatePeriod(entries: V2BaseRecord[], period: string): V2DrePeriod {
  const scoped = entries.filter((entry) => entry.period === period)
  const sum = (movementClass: V2DreClass) =>
    scoped.filter((entry) => entry.movementClass === movementClass).reduce((total, entry) => total + contribution(entry), 0)
  const receita = sum('receita')
  const custos = sum('custo')
  const opex = sum('opex')
  const ebitda = receita + custos + opex
  const resultadoFinanceiro = sum('financeiro')
  const impostos = sum('imposto')
  const resultadoLiquido = ebitda + resultadoFinanceiro + impostos
  return { period, receita, custos, opex, ebitda, resultadoFinanceiro, impostos, resultadoLiquido, entries: scoped.length }
}

export function buildV2Dre(base: V2FinancialBase, period?: string): V2DreReport {
  const periods = base.periods.map((item) => calculatePeriod(base.entries, item))
  return { periods, selectedPeriod: period ? periods.find((item) => item.period === period) : undefined }
}

export function isDreEntry(entry: V2BaseRecord): boolean {
  return ['receita', 'custo', 'opex', 'financeiro', 'imposto'].includes(entry.movementClass)
}

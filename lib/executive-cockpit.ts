import { buildAccountingIndicatorCards } from './financial-indicators'
import { buildFinancialDiagnosis, type Diagnosis } from './financial-diagnosis'
import { monthlyBalance, monthlyData } from './monthly-data'
import type { Indicator } from './financial-indicators'

export type ExecutivePriority = {
 title: string
 severity: 'critical' | 'attention' | 'positive'
 signal: string
 action: string
}

export type ExecutiveCockpit = {
 month: string
 revenue: number
 ebitda: number
 ebitdaMargin: number
 netIncome: number
 closingCash: number
 workingCapital: number
 ncg: number
 currentRatio: number
 debtRatio: number
 priorities: ExecutivePriority[]
}

export function buildExecutiveCockpit(index = monthlyBalance.length - 1, gerencial: Indicator[] = []): ExecutiveCockpit {
 const safe = Math.max(0, Math.min(index, monthlyBalance.length - 1))
 const balance = monthlyBalance[safe]
 const result = monthlyData[safe]
 const accounting = buildAccountingIndicatorCards(safe)
 const diagnoses = buildFinancialDiagnosis(accounting.snapshot, gerencial)
 const priorities: ExecutivePriority[] = diagnoses.slice(0, 5).map((d: Diagnosis) => ({
  title: d.title,
  severity: d.severity,
  signal: d.signal,
  action: d.action,
 }))
 return {
  month: balance.month,
  revenue: result.receitaLiquida,
  ebitda: result.ebitda,
  ebitdaMargin: result.receitaLiquida ? result.ebitda / result.receitaLiquida : 0,
  netIncome: result.lucroLiquido,
  closingCash: result.caixaFinal,
  workingCapital: accounting.snapshot.workingCapital,
  ncg: accounting.snapshot.ncg,
  currentRatio: accounting.snapshot.currentRatio,
  debtRatio: accounting.snapshot.debtRatio,
  priorities,
 }
}

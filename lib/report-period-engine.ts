import { competence, type ReportPeriod, type ReportView } from './report-period'

export function monthsForView(period: ReportPeriod): number[] {
  const month = Math.max(1, Math.min(12, period.month))
  return period.view === 'mensal' || period.view === 'comparativo'
    ? [month]
    : Array.from({ length: month }, (_, index) => index + 1)
}

export function competencesForView(period: ReportPeriod): string[] {
  return monthsForView(period).map(month => competence(period.year, month))
}

export function previousPeriod(period: ReportPeriod): ReportPeriod {
  return period.month === 1
    ? { ...period, year: period.year - 1, month: 12, view: 'mensal' }
    : { ...period, month: period.month - 1, view: 'mensal' }
}

export function periodLabel(period: ReportPeriod): string {
  const month = String(period.month).padStart(2, '0')
  if (period.view === 'acumulado') return `${period.year}-01 a ${period.year}-${month}`
  return competence(period.year, period.month)
}

export function isSupportedReportView(value: string): value is ReportView {
  return value === 'mensal' || value === 'acumulado' || value === 'comparativo'
}

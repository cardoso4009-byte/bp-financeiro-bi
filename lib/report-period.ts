export type ReportView = 'mensal' | 'acumulado' | 'comparativo'

export type ReportPeriod = {
  year: number
  month: number
  view: ReportView
}

export const REPORT_MONTHS: readonly string[] = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export const DEFAULT_REPORT_PERIOD: ReportPeriod = {
  year: 2026,
  month: 1,
  view: 'mensal',
}

export function competence(year:number, month:number) {
  return `${year}-${String(month).padStart(2,'0')}`
}

export function monthLabel(month:number) {
  return REPORT_MONTHS[month-1] || REPORT_MONTHS[0]
}

export function monthsUntil(month:number) {
  return REPORT_MONTHS.slice(0, Math.max(1, Math.min(12, month)))
}

export function isInPeriod(value:string, period:ReportPeriod) {
  return value === competence(period.year, period.month)
}

export function isInYear(value:string, year:number) {
  return value.startsWith(`${year}-`)
}

export function periodLabel(period:ReportPeriod) {
  return `${monthLabel(period.month)}/${period.year}`
}

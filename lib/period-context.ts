export type AnalysisPeriod = {
  startMonth: number
  endMonth: number
  baseMonth: number
}

export const defaultPeriod: AnalysisPeriod = {
  startMonth: 0,
  endMonth: 11,
  baseMonth: 11,
}

export const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function periodLabel(period: AnalysisPeriod) {
  const range = period.startMonth === period.endMonth
    ? months[period.startMonth]
    : `${months[period.startMonth]}–${months[period.endMonth]}`
  return `${range}/2026`
}

import type { JournalEntry } from './accounting-core'

export type AnalysisPeriod = {
  start: string
  end: string
}

// Normaliza datas para YYYY-MM e garante que a competência possa ser comparada
// sem depender de timezone ou horário do navegador.
export function competenceOf(entry: JournalEntry): string {
  return entry.competence || entry.date.slice(0, 7)
}

export function inAnalysisPeriod(entry: JournalEntry, period: AnalysisPeriod): boolean {
  const competence = competenceOf(entry)
  return competence >= period.start.slice(0, 7) && competence <= period.end.slice(0, 7)
}

export function filterByPeriod(entries: JournalEntry[], period: AnalysisPeriod): JournalEntry[] {
  return entries.filter((entry) => inAnalysisPeriod(entry, period))
}

export function periodFromMonths(startMonth: number, endMonth: number, year = 2026): AnalysisPeriod {
  const start = Math.min(Math.max(startMonth, 1), 12)
  const end = Math.min(Math.max(endMonth, start), 12)
  return {
    start: `${year}-${String(start).padStart(2, '0')}`,
    end: `${year}-${String(end).padStart(2, '0')}`,
  }
}

export function currentYearPeriod(year = 2026): AnalysisPeriod {
  return periodFromMonths(1, 12, year)
}

import type { FinancialEntry } from './lancamentos-data'

export type AgingBucket = 'A vencer' | '1–30 dias' | '31–60 dias' | '61–90 dias' | '> 90 dias'

export type OpenItem = FinancialEntry & {
  direction: 'Receber' | 'Pagar'
  aging: AgingBucket
  daysOverdue: number
}

function diffDays(a: string, b: string) {
  const ms = new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime()
  return Math.round(ms / 86400000)
}

export function agingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return 'A vencer'
  if (daysOverdue <= 30) return '1–30 dias'
  if (daysOverdue <= 60) return '31–60 dias'
  if (daysOverdue <= 90) return '61–90 dias'
  return '> 90 dias'
}

export function openReceivablesPayables(entries: FinancialEntry[], asOf = '2026-12-31'): OpenItem[] {
  return entries.filter(e => e.status === 'Em aberto' && (e.type === 'Receita' || e.type === 'Despesa')).map(e => {
    const direction = e.type === 'Receita' ? 'Receber' : 'Pagar'
    const due = diffDays(asOf, e.dueDate)
    return { ...e, direction, daysOverdue: Math.max(0, due), aging: agingBucket(due) }
  })
}

export function agingSummary(items: OpenItem[]) {
  const buckets: AgingBucket[] = ['A vencer','1–30 dias','31–60 dias','61–90 dias','> 90 dias']
  return buckets.map(aging => ({
    aging,
    receber: items.filter(i => i.direction === 'Receber' && i.aging === aging).reduce((s,i) => s + Math.abs(i.value), 0),
    pagar: items.filter(i => i.direction === 'Pagar' && i.aging === aging).reduce((s,i) => s + Math.abs(i.value), 0),
  }))
}

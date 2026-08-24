'use client'

import { months, type AnalysisPeriod } from '@/lib/period-context'

export default function PeriodFilter({ period, onChange }: { period: AnalysisPeriod; onChange: (period: AnalysisPeriod) => void }) {
  return <div className="period-controls">
    <label>Período de análise</label>
    <div>
      <select value={period.startMonth} onChange={e => { const startMonth = Number(e.target.value); onChange({ ...period, startMonth, endMonth: Math.max(startMonth, period.endMonth) }) }}>
        {months.map((m, i) => <option key={m} value={i}>Início: {m}/2026</option>)}
      </select>
      <select value={period.endMonth} onChange={e => { const endMonth = Number(e.target.value); onChange({ ...period, endMonth, startMonth: Math.min(period.startMonth, endMonth) }) }}>
        {months.map((m, i) => <option key={m} value={i}>Fim: {m}/2026</option>)}
      </select>
      <select value={period.baseMonth} onChange={e => onChange({ ...period, baseMonth: Number(e.target.value) })}>
        {months.map((m, i) => <option key={m} value={i}>Data-base: {m}/2026</option>)}
      </select>
    </div>
  </div>
}

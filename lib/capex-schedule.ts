export interface CapexScheduleEntry {
  id: string
  projectId: string
  competence: string
  plannedAmount: number
  plannedDate?: string
  note?: string
}

export const CAPEX_SCHEDULE_KEY = 'bp-financeiro-capex-schedule-2026'

const seed: CapexScheduleEntry[] = [
  { id:'capex-sch-001', projectId:'capex-001', competence:'2026-10', plannedAmount:20000, plannedDate:'2026-10-15' },
  { id:'capex-sch-002', projectId:'capex-001', competence:'2026-11', plannedAmount:30000, plannedDate:'2026-11-15' },
  { id:'capex-sch-003', projectId:'capex-001', competence:'2026-12', plannedAmount:28000, plannedDate:'2026-12-10' },
  { id:'capex-sch-004', projectId:'capex-002', competence:'2026-10', plannedAmount:25000, plannedDate:'2026-10-20' },
  { id:'capex-sch-005', projectId:'capex-002', competence:'2026-11', plannedAmount:20000, plannedDate:'2026-11-20' },
  { id:'capex-sch-006', projectId:'capex-002', competence:'2026-12', plannedAmount:11000, plannedDate:'2026-12-18' },
  { id:'capex-sch-007', projectId:'capex-003', competence:'2026-12', plannedAmount:50000, plannedDate:'2026-12-15' },
]

export function readCapexSchedule(): CapexScheduleEntry[] {
  if (typeof window === 'undefined') return seed
  try {
    const raw = window.localStorage.getItem(CAPEX_SCHEDULE_KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as CapexScheduleEntry[] : seed
  } catch { return seed }
}

export function writeCapexSchedule(entries: CapexScheduleEntry[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(CAPEX_SCHEDULE_KEY, JSON.stringify(entries))
}

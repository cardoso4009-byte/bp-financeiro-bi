import type { CapexProject } from './capex'

export interface CapexCashSchedule {
  id: string
  projectId: string
  companyId: string
  period: string
  plannedAmount: number
  realizedAmount: number
  description?: string
}

export interface CapexCashMonth {
  period: string
  plannedAmount: number
  realizedAmount: number
  futureAmount: number
  netCashImpact: number
  projects: number
}

export interface CapexCashReport {
  schedule: CapexCashSchedule[]
  monthly: CapexCashMonth[]
  plannedAmount: number
  realizedAmount: number
  futureAmount: number
  contractedFutureAmount: number
  uncontractedForecastAmount: number
}

const seed: CapexCashSchedule[] = [
  { id:'cc-001', projectId:'capex-001', companyId:'demo', period:'2026-01', plannedAmount:20000, realizedAmount:20000 },
  { id:'cc-002', projectId:'capex-001', companyId:'demo', period:'2026-04', plannedAmount:20000, realizedAmount:20000 },
  { id:'cc-003', projectId:'capex-001', companyId:'demo', period:'2026-07', plannedAmount:20000, realizedAmount:20000 },
  { id:'cc-004', projectId:'capex-001', companyId:'demo', period:'2026-10', plannedAmount:20000, realizedAmount:0 },
  { id:'cc-005', projectId:'capex-001', companyId:'demo', period:'2026-11', plannedAmount:18000, realizedAmount:0 },
  { id:'cc-006', projectId:'capex-001', companyId:'demo', period:'2026-12', plannedAmount:20000, realizedAmount:0 },
  { id:'cc-007', projectId:'capex-002', companyId:'demo', period:'2026-02', plannedAmount:10000, realizedAmount:10000 },
  { id:'cc-008', projectId:'capex-002', companyId:'demo', period:'2026-05', plannedAmount:10000, realizedAmount:10000 },
  { id:'cc-009', projectId:'capex-002', companyId:'demo', period:'2026-09', plannedAmount:20000, realizedAmount:0 },
  { id:'cc-010', projectId:'capex-002', companyId:'demo', period:'2026-10', plannedAmount:20000, realizedAmount:0 },
  { id:'cc-011', projectId:'capex-002', companyId:'demo', period:'2026-11', plannedAmount:16000, realizedAmount:0 },
  { id:'cc-012', projectId:'capex-003', companyId:'demo', period:'2026-08', plannedAmount:15000, realizedAmount:0 },
  { id:'cc-013', projectId:'capex-003', companyId:'demo', period:'2026-09', plannedAmount:15000, realizedAmount:0 },
  { id:'cc-014', projectId:'capex-003', companyId:'demo', period:'2026-11', plannedAmount:20000, realizedAmount:0 },
]

export const CAPEX_CASH_STORAGE_KEY='bp-financeiro-capex-cash-2026'

export function readCapexCashSchedule(): CapexCashSchedule[] {
  if (typeof window === 'undefined') return seed
  try {
    const raw=window.localStorage.getItem(CAPEX_CASH_STORAGE_KEY)
    if (!raw) return seed
    const parsed=JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as CapexCashSchedule[] : seed
  } catch { return seed }
}

export function writeCapexCashSchedule(schedule: CapexCashSchedule[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(CAPEX_CASH_STORAGE_KEY,JSON.stringify(schedule))
}

export function buildCapexCashReport(projects: CapexProject[], schedule: CapexCashSchedule[], year:number): CapexCashReport {
  const validProjects=new Map(projects.map(project=>[project.id,project]))
  const filtered=schedule.filter(item=>item.companyId && item.period.startsWith(`${year}-`) && validProjects.has(item.projectId))
  const monthly=Array.from({length:12},(_,index)=>{
    const period=`${year}-${String(index+1).padStart(2,'0')}`
    const items=filtered.filter(item=>item.period===period)
    const plannedAmount=items.reduce((sum,item)=>sum+item.plannedAmount,0)
    const realizedAmount=items.reduce((sum,item)=>sum+item.realizedAmount,0)
    return {period,plannedAmount,realizedAmount,futureAmount:Math.max(plannedAmount-realizedAmount,0),netCashImpact:-plannedAmount,projects:new Set(items.map(item=>item.projectId)).size}
  })
  const plannedAmount=filtered.reduce((sum,item)=>sum+item.plannedAmount,0)
  const realizedAmount=filtered.reduce((sum,item)=>sum+item.realizedAmount,0)
  const futureAmount=Math.max(plannedAmount-realizedAmount,0)
  const contractedFutureAmount=projects.reduce((sum,project)=>sum+Math.max(project.contractedAmount-project.realizedAmount,0),0)
  const uncontractedForecastAmount=projects.reduce((sum,project)=>sum+Math.max(project.forecastAmount-project.contractedAmount,0),0)
  return {schedule:filtered,monthly,plannedAmount,realizedAmount,futureAmount,contractedFutureAmount,uncontractedForecastAmount}
}

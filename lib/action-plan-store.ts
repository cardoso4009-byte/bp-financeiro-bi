export type ActionStatus = 'Pendente' | 'Em andamento' | 'Concluído' | 'Cancelado'
export type ActionPriority = 'Crítica' | 'Alta' | 'Média' | 'Baixa'

export type ActionPlanItem = {
 id: string
 createdAt: string
 title: string
 area: string
 diagnosisKey: string
 signal: string
 action: string
 responsible: string
 dueDate: string
 priority: ActionPriority
 status: ActionStatus
 expectedImpact: number
 actualImpact: number
 notes: string
}

const KEY = 'bp-financeiro-action-plan-v1'

export function readActionPlan(): ActionPlanItem[] {
 if (typeof window === 'undefined') return []
 try {
  const raw = window.localStorage.getItem(KEY)
  if (!raw) return []
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
 } catch { return [] }
}

export function writeActionPlan(items: ActionPlanItem[]) {
 if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function upsertAction(item: ActionPlanItem) {
 const items = readActionPlan()
 const next = items.some(i => i.id === item.id) ? items.map(i => i.id === item.id ? item : i) : [item, ...items]
 writeActionPlan(next)
 return next
}

export function deleteAction(id: string) {
 const next = readActionPlan().filter(i => i.id !== id)
 writeActionPlan(next)
 return next
}

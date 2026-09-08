export type GovernanceMeetingStatus = 'Agendada' | 'Realizada' | 'Cancelada'

export type GovernanceMeeting = {
  id: string
  createdAt: string
  updatedAt: string
  date: string
  competence: string
  title: string
  participants: string
  decisions: string
  evidence: string
  status: GovernanceMeetingStatus
}

const KEY = 'bp-financeiro-governance-v1'

export function readGovernanceMeetings(): GovernanceMeeting[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeGovernanceMeetings(items: GovernanceMeeting[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function upsertGovernanceMeeting(item: GovernanceMeeting) {
  const items = readGovernanceMeetings()
  const index = items.findIndex((x) => x.id === item.id)
  if (index >= 0) items[index] = item
  else items.unshift(item)
  writeGovernanceMeetings(items)
}

export function deleteGovernanceMeeting(id: string) {
  writeGovernanceMeetings(readGovernanceMeetings().filter((x) => x.id !== id))
}

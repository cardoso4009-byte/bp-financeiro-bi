import type { FinancialEntry } from './lancamentos-data'

export type DrillDimension = 'account' | 'costCenter' | 'category' | 'month' | 'entry'

export type DrillNode = {
  key: string
  label: string
  dimension: DrillDimension
  value: number
  entry?: FinancialEntry
  children: DrillNode[]
}

const abs = (v:number) => Math.abs(v)

/** Shared hierarchy used by DRE and Rentabilidade so both views resolve to the same source entry. */
export function buildFinancialDrilldown(entries: FinancialEntry[], accountResolver?: (e: FinancialEntry) => string) {
  const roots = new Map<string, DrillNode>()
  for (const e of entries) {
    const account = accountResolver?.(e) || e.category || 'Sem conta'
    const center = e.costCenter || 'Sem centro de custo'
    const category = e.category || 'Sem categoria'
    const month = e.competence || e.date?.slice(0,7) || 'Sem competência'
    const value = abs(e.value)
    const levels: [DrillDimension,string][] = [['account',account],['costCenter',center],['category',category],['month',month]]
    let map = roots
    let parent: DrillNode | undefined
    for (const [dimension,label] of levels) {
      const key = `${parent?.key || 'root'}|${dimension}|${label}`
      let node = map.get(key)
      if (!node) {
        node = {key,label,dimension,value:0,children:[]}
        map.set(key,node)
        if (parent) parent.children.push(node)
      }
      node.value += value
      parent = node
      const childMap = new Map<string, DrillNode>()
      for (const c of parent.children) childMap.set(c.key,c)
      map = childMap
      ;(parent as DrillNode & {_childMap?:Map<string,DrillNode>})._childMap = childMap
    }
    if (parent) parent.children.push({key:`${parent.key}|entry|${e.id}`,label:e.description || `Lançamento ${e.id}`,dimension:'entry',value,entry:e,children:[]})
  }
  return Array.from(roots.values()).map(stripMaps)
}

function stripMaps(n: DrillNode): DrillNode {
  const copy:any = {...n,children:n.children.map(stripMaps)}
  delete copy._childMap
  return copy
}

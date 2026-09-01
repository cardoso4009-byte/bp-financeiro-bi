import type { FinancialEntry } from './lancamentos-data'

export type DrillDimension = 'account' | 'costCenter' | 'category' | 'month' | 'entry'
export type DrillNode = { key:string; label:string; dimension:DrillDimension; value:number; entry?:FinancialEntry; children:DrillNode[] }

/** Builds one deterministic hierarchy from the financial source. DRE and Rentabilidade can consume the same nodes. */
export function buildFinancialDrilldown(entries:FinancialEntry[], accountResolver?:(e:FinancialEntry)=>string):DrillNode[]{
 const roots:DrillNode[]=[]
 const ensure=(list:DrillNode[],key:string,label:string,dimension:DrillDimension)=>{
  let n=list.find(x=>x.key===key); if(!n){n={key,label,dimension,value:0,children:[]};list.push(n)} return n
 }
 for(const e of entries){
  const account=accountResolver?.(e)||e.category||'Sem conta', center=e.costCenter||'Sem centro de custo', category=e.category||'Sem categoria', month=e.competence||e.date?.slice(0,7)||'Sem competência', value=Math.abs(e.value)
  const a=ensure(roots,`account|${account}`,account,'account'); a.value+=value
  const c=ensure(a.children,`${a.key}|costCenter|${center}`,center,'costCenter'); c.value+=value
  const g=ensure(c.children,`${c.key}|category|${category}`,category,'category'); g.value+=value
  const m=ensure(g.children,`${g.key}|month|${month}`,month,'month'); m.value+=value
  m.children.push({key:`${m.key}|entry|${e.id}`,label:e.description||`Lançamento ${e.id}`,dimension:'entry',value,entry:e,children:[]})
 }
 return roots
}

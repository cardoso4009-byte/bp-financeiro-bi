import { initialBudget } from './budget-plan-data'
import type { V2BudgetEntry } from './v2-budget'

export const V2_BUDGET_STORAGE_KEY = 'bp-financeiro-v2-budget-2026'
function seedBudget(): V2BudgetEntry[] {
  return initialBudget.flatMap((row,index)=>{const period=`2026-${String(index+1).padStart(2,'0')}`;return [
    {id:`budget-${period}-revenue`,companyId:'demo',period,movementClass:'receita' as const,amount:row.revenue,description:'Orçamento de receita'},
    {id:`budget-${period}-cost`,companyId:'demo',period,movementClass:'custo' as const,amount:-row.cost,description:'Orçamento de custos'},
    {id:`budget-${period}-opex`,companyId:'demo',period,movementClass:'opex' as const,amount:-row.opex,description:'Orçamento de OPEX'},
    {id:`budget-${period}-capex`,companyId:'demo',period,movementClass:'capex' as const,amount:row.capex,description:'Orçamento de CAPEX'},
  ]})
}
export function readV2BudgetEntries(): V2BudgetEntry[]{if(typeof window==='undefined')return seedBudget();try{const raw=window.localStorage.getItem(V2_BUDGET_STORAGE_KEY);if(!raw)return seedBudget();const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed as V2BudgetEntry[]:seedBudget()}catch{return seedBudget()}}
export function writeV2BudgetEntries(entries:V2BudgetEntry[]){if(typeof window!=='undefined')window.localStorage.setItem(V2_BUDGET_STORAGE_KEY,JSON.stringify(entries))}

import type { CapexProject } from './capex'

export const CAPEX_STORAGE_KEY='bp-financeiro-capex-2026'

const seed:CapexProject[]=[
 {id:'capex-001',companyId:'demo',code:'CAP-001',name:'Modernização da infraestrutura',category:'infraestrutura',approvedBudget:120000,contractedAmount:90000,realizedAmount:60000,forecastAmount:118000,status:'em_execucao',responsible:'Operações',supplier:'Fornecedor demonstrativo',description:'Projeto demonstrativo para homologação do módulo CAPEX.'},
 {id:'capex-002',companyId:'demo',code:'CAP-002',name:'Atualização de tecnologia',category:'tecnologia',approvedBudget:80000,contractedAmount:65000,realizedAmount:20000,forecastAmount:76000,status:'contratado',responsible:'TI',supplier:'Fornecedor demonstrativo'},
 {id:'capex-003',companyId:'demo',code:'CAP-003',name:'Equipamentos operacionais',category:'equipamentos',approvedBudget:50000,contractedAmount:0,realizedAmount:0,forecastAmount:50000,status:'aprovado',responsible:'Operações'},
]
export function readCapexProjects():CapexProject[]{if(typeof window==='undefined')return seed;try{const raw=window.localStorage.getItem(CAPEX_STORAGE_KEY);if(!raw)return seed;const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed as CapexProject[]:seed}catch{return seed}}
export function writeCapexProjects(projects:CapexProject[]){if(typeof window!=='undefined')window.localStorage.setItem(CAPEX_STORAGE_KEY,JSON.stringify(projects))}

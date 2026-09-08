export type BudgetAnalyticLine = {
  id: string
  competence: string
  type: 'Receita' | 'Despesa' | 'CAPEX'
  account: string
  costCenter: string
  project?: string
  budget: number
}

const KEY = 'bp-financeiro-budget-analytic-v1'

export const initialBudgetAnalytic: BudgetAnalyticLine[] = [
  { id:'2026-01-vendas-comercial', competence:'2026-01', type:'Receita', account:'Vendas', costCenter:'Comercial', budget:63000 },
  { id:'2026-01-pessoal-adm', competence:'2026-01', type:'Despesa', account:'Pessoal', costCenter:'Administrativo', budget:6500 },
  { id:'2026-01-aluguel-adm', competence:'2026-01', type:'Despesa', account:'Aluguel', costCenter:'Administrativo', budget:6800 },
  { id:'2026-01-marketing-comercial', competence:'2026-01', type:'Despesa', account:'Marketing', costCenter:'Comercial', budget:0 },
  { id:'2026-01-equip-operacoes', competence:'2026-01', type:'CAPEX', account:'Equipamentos', costCenter:'Operações', project:'Expansão produtiva', budget:5000 },
  { id:'2026-02-vendas-comercial', competence:'2026-02', type:'Receita', account:'Vendas', costCenter:'Comercial', budget:67500 },
  { id:'2026-02-pessoal-adm', competence:'2026-02', type:'Despesa', account:'Pessoal', costCenter:'Administrativo', budget:7000 },
  { id:'2026-02-aluguel-adm', competence:'2026-02', type:'Despesa', account:'Aluguel', costCenter:'Administrativo', budget:7000 },
  { id:'2026-02-marketing-comercial', competence:'2026-02', type:'Despesa', account:'Marketing', costCenter:'Comercial', budget:250 },
  { id:'2026-02-equip-operacoes', competence:'2026-02', type:'CAPEX', account:'Equipamentos', costCenter:'Operações', project:'Expansão produtiva', budget:5000 },
  { id:'2026-03-vendas-comercial', competence:'2026-03', type:'Receita', account:'Vendas', costCenter:'Comercial', budget:72000 },
  { id:'2026-03-pessoal-adm', competence:'2026-03', type:'Despesa', account:'Pessoal', costCenter:'Administrativo', budget:7600 },
  { id:'2026-03-aluguel-adm', competence:'2026-03', type:'Despesa', account:'Aluguel', costCenter:'Administrativo', budget:7200 },
  { id:'2026-03-marketing-comercial', competence:'2026-03', type:'Despesa', account:'Marketing', costCenter:'Comercial', budget:400 },
  { id:'2026-03-equip-operacoes', competence:'2026-03', type:'CAPEX', account:'Equipamentos', costCenter:'Operações', project:'Expansão produtiva', budget:5000 },
]

export function readBudgetAnalytic(): BudgetAnalyticLine[] {
  if (typeof window === 'undefined') return initialBudgetAnalytic
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return initialBudgetAnalytic
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : initialBudgetAnalytic
  } catch { return initialBudgetAnalytic }
}

export function writeBudgetAnalytic(lines: BudgetAnalyticLine[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(lines))
}

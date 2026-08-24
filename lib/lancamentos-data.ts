export type FinancialEntry = {
  id: number
  date: string
  type: 'Receita' | 'Despesa' | 'CAPEX' | 'Financiamento'
  category: string
  costCenter: string
  description: string
  competence: string
  dueDate: string
  paymentDate: string
  status: 'Pago' | 'Em aberto'
  value: number
}

export const initialEntries: FinancialEntry[] = [
  { id: 1, date: '2026-01-05', type: 'Receita', category: 'Vendas', costCenter: 'Comercial', description: 'Cliente A', competence: '2026-01', dueDate: '2026-01-05', paymentDate: '2026-01-05', status: 'Pago', value: 20000 },
  { id: 2, date: '2026-01-10', type: 'Despesa', category: 'Aluguel', costCenter: 'Administrativo', description: 'Aluguel escritório', competence: '2026-01', dueDate: '2026-01-10', paymentDate: '2026-01-10', status: 'Pago', value: -8000 },
  { id: 3, date: '2026-01-15', type: 'CAPEX', category: 'Equipamentos', costCenter: 'Operações', description: 'Máquina produtiva', competence: '2026-01', dueDate: '2026-01-15', paymentDate: '2026-01-15', status: 'Pago', value: -15000 },
  { id: 4, date: '2026-02-08', type: 'Receita', category: 'Vendas', costCenter: 'Comercial', description: 'Cliente B', competence: '2026-02', dueDate: '2026-02-08', paymentDate: '', status: 'Em aberto', value: 18000 },
  { id: 5, date: '2026-02-12', type: 'Despesa', category: 'Pessoal', costCenter: 'Administrativo', description: 'Folha mensal', competence: '2026-02', dueDate: '2026-02-12', paymentDate: '2026-02-12', status: 'Pago', value: -12000 },
  { id: 6, date: '2026-02-20', type: 'Financiamento', category: 'Empréstimos', costCenter: 'Financeiro', description: 'Parcela financiamento', competence: '2026-02', dueDate: '2026-02-20', paymentDate: '', status: 'Em aberto', value: -5000 },
]

export const entryTypes: FinancialEntry['type'][] = ['Receita', 'Despesa', 'CAPEX', 'Financiamento']
export const entryStatuses: FinancialEntry['status'][] = ['Pago', 'Em aberto']

export function summarizeEntries(entries: FinancialEntry[]) {
  const revenue = entries.filter(e => e.type === 'Receita').reduce((s, e) => s + e.value, 0)
  const opex = entries.filter(e => e.type === 'Despesa').reduce((s, e) => s + Math.abs(e.value), 0)
  const capex = entries.filter(e => e.type === 'CAPEX').reduce((s, e) => s + Math.abs(e.value), 0)
  const financing = entries.filter(e => e.type === 'Financiamento').reduce((s, e) => s + e.value, 0)
  const open = entries.filter(e => e.status === 'Em aberto').reduce((s, e) => s + e.value, 0)
  const net = entries.reduce((s, e) => s + e.value, 0)
  const ebitda = revenue - opex
  const cashOperating = entries.filter(e => (e.type === 'Receita' || e.type === 'Despesa') && e.status === 'Pago').reduce((s, e) => s + e.value, 0)
  const cashInvesting = -capex
  const cashFinancing = financing
  const cashVariation = cashOperating + cashInvesting + cashFinancing
  return { revenue, opex, capex, financing, open, net, ebitda, cashOperating, cashInvesting, cashFinancing, cashVariation }
}

export function monthlySummary(entries: FinancialEntry[]) {
  const months = Array.from(new Set(entries.map(e => e.competence))).sort()
  return months.map(month => ({ month, ...summarizeEntries(entries.filter(e => e.competence === month)) }))
}

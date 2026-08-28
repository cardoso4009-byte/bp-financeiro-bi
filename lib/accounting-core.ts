export type AccountNature = 'devedora' | 'credora'
export type AccountClass = 'ativo' | 'passivo' | 'patrimonio' | 'receita' | 'custo' | 'despesa'

export interface Account {
  code: string
  name: string
  class: AccountClass
  nature: AccountNature
  level: number
  active?: boolean
  parentCode?: string
}

export interface JournalLine {
  account: string
  debit: number
  credit: number
}

export interface JournalEntry {
  id: string
  date: string
  description: string
  lines: JournalLine[]
  competence?: string
  document?: string
  costCenter?: string
  source?: 'MANUAL' | 'IMPORTACAO' | 'INTEGRACAO'
}

// Fonte única da verdade do modelo contábil. Todos os módulos devem consumir
// este plano de contas e o Diário, sem manter um segundo modelo paralelo.
export const chartOfAccounts: Account[] = [
  { code:'1', name:'Ativo', class:'ativo', nature:'devedora', level:1 },
  { code:'1.1', name:'Ativo Circulante', class:'ativo', nature:'devedora', level:2, parentCode:'1' },
  { code:'1.1.01', name:'Caixa e Bancos', class:'ativo', nature:'devedora', level:3, parentCode:'1.1' },
  { code:'1.1.02', name:'Contas a Receber', class:'ativo', nature:'devedora', level:3, parentCode:'1.1' },
  { code:'1.1.03', name:'Estoques', class:'ativo', nature:'devedora', level:3, parentCode:'1.1' },
  { code:'1.2', name:'Ativo Não Circulante', class:'ativo', nature:'devedora', level:2, parentCode:'1' },
  { code:'1.2.01', name:'Imobilizado', class:'ativo', nature:'devedora', level:3, parentCode:'1.2' },
  { code:'2', name:'Passivo', class:'passivo', nature:'credora', level:1 },
  { code:'2.1', name:'Passivo Circulante', class:'passivo', nature:'credora', level:2, parentCode:'2' },
  { code:'2.1.01', name:'Fornecedores', class:'passivo', nature:'credora', level:3, parentCode:'2.1' },
  { code:'2.1.02', name:'Obrigações e Tributos', class:'passivo', nature:'credora', level:3, parentCode:'2.1' },
  { code:'2.2', name:'Passivo Não Circulante', class:'passivo', nature:'credora', level:2, parentCode:'2' },
  { code:'2.2.01', name:'Empréstimos e Financiamentos', class:'passivo', nature:'credora', level:3, parentCode:'2.2' },
  { code:'3', name:'Patrimônio Líquido', class:'patrimonio', nature:'credora', level:1 },
  { code:'3.1', name:'Capital Social', class:'patrimonio', nature:'credora', level:2, parentCode:'3' },
  { code:'3.2', name:'Lucros/Prejuízos Acumulados', class:'patrimonio', nature:'credora', level:2, parentCode:'3' },
  { code:'4', name:'Receitas', class:'receita', nature:'credora', level:1 },
  { code:'4.1', name:'Receita de Vendas', class:'receita', nature:'credora', level:2, parentCode:'4' },
  { code:'5', name:'Custos', class:'custo', nature:'devedora', level:1 },
  { code:'5.1', name:'Custo dos Produtos/Serviços', class:'custo', nature:'devedora', level:2, parentCode:'5' },
  { code:'6', name:'Despesas', class:'despesa', nature:'devedora', level:1 },
  { code:'6.1', name:'Despesas Operacionais', class:'despesa', nature:'devedora', level:2, parentCode:'6' },
  { code:'6.2', name:'Despesas Financeiras', class:'despesa', nature:'devedora', level:2, parentCode:'6' },
]

export const sampleJournal: JournalEntry[] = [
  { id:'000', date:'2026-01-02', description:'Integralização de capital social', competence:'2026-01', source:'MANUAL', lines:[{account:'1.1.01',debit:75000,credit:0},{account:'3.1',debit:0,credit:75000}] },
  { id:'001', date:'2026-01-05', description:'Venda a prazo', competence:'2026-01', source:'MANUAL', lines:[{account:'1.1.02',debit:100000,credit:0},{account:'4.1',debit:0,credit:100000}] },
  { id:'002', date:'2026-01-10', description:'Pagamento de despesas operacionais', competence:'2026-01', source:'MANUAL', lines:[{account:'6.1',debit:25000,credit:0},{account:'1.1.01',debit:0,credit:25000}] },
  { id:'003', date:'2026-01-15', description:'Compra de equipamento', competence:'2026-01', source:'MANUAL', lines:[{account:'1.2.01',debit:50000,credit:0},{account:'1.1.01',debit:0,credit:50000}] },
]

export function entryTotals(entry: JournalEntry) {
  const debit = entry.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0)
  const credit = entry.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0)
  return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 }
}

export function journalIsBalanced(entries: JournalEntry[]) {
  return entries.every(entry => entryTotals(entry).balanced)
}

export function validateJournalEntry(entry: JournalEntry): string[] {
  const errors: string[] = []
  const codes = new Set(chartOfAccounts.map(account => account.code))
  if (!entry.date) errors.push('Data do lançamento é obrigatória.')
  if (!entry.description) errors.push('Histórico é obrigatório.')
  if (!entry.lines.length) errors.push('O lançamento deve possuir ao menos duas partidas.')
  const totals = entryTotals(entry)
  if (!totals.balanced) errors.push('Débitos e créditos do lançamento não estão balanceados.')
  for (const line of entry.lines) {
    if (!codes.has(line.account)) errors.push(`Conta inexistente: ${line.account}.`)
    if (line.debit < 0 || line.credit < 0) errors.push(`Valores negativos não são permitidos: ${line.account}.`)
    if (line.debit > 0 && line.credit > 0) errors.push(`A partida ${line.account} não pode ter débito e crédito simultaneamente.`)
  }
  return errors
}

export function validateJournal(entries: JournalEntry[]) {
  return entries.flatMap(entry => validateJournalEntry(entry).map(error => `${entry.id}: ${error}`))
}

export type AccountBalance = {
  accountCode: string
  debit: number
  credit: number
  balance: number
}

export function ledgerFromJournal(entries: JournalEntry[]): AccountBalance[] {
  const balances = new Map<string, AccountBalance>()
  const ensure = (accountCode: string) => {
    if (!balances.has(accountCode)) balances.set(accountCode, { accountCode, debit: 0, credit: 0, balance: 0 })
    return balances.get(accountCode)!
  }
  for (const entry of entries) {
    for (const line of entry.lines) {
      ensure(line.account).debit += Number(line.debit || 0)
      ensure(line.account).credit += Number(line.credit || 0)
    }
  }
  return Array.from(balances.values()).map(item => ({ ...item, balance: item.debit - item.credit }))
}

export function journalTotals(entries: JournalEntry[]) {
  const totals = entries.reduce((acc, entry) => {
    const t = entryTotals(entry)
    acc.debit += t.debit
    acc.credit += t.credit
    return acc
  }, { debit: 0, credit: 0 })
  return { ...totals, difference: totals.debit - totals.credit, balanced: Math.abs(totals.debit - totals.credit) < 0.01 }
}

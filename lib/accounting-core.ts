export type AccountType = 'ATIVO' | 'PASSIVO' | 'PL' | 'RECEITA' | 'CUSTO' | 'DESPESA'

export type AccountNature = 'DEVEDORA' | 'CREDORA'

export type Account = {
  code: string
  name: string
  type: AccountType
  nature: AccountNature
  parentCode?: string
  active?: boolean
}

export type JournalEntry = {
  id: string
  date: string
  competence: string
  description: string
  document?: string
  debitAccount: string
  creditAccount: string
  amount: number
  costCenter?: string
  source?: 'MANUAL' | 'IMPORTACAO' | 'INTEGRACAO'
}

// Plano de contas mínimo do modelo demonstrativo. A estrutura pode crescer
// sem alterar as demonstrações, pois elas deverão consumir os lançamentos.
export const chartOfAccounts: Account[] = [
  { code: '1', name: 'Ativo', type: 'ATIVO', nature: 'DEVEDORA' },
  { code: '1.1', name: 'Ativo Circulante', type: 'ATIVO', nature: 'DEVEDORA', parentCode: '1' },
  { code: '1.1.01', name: 'Caixa e Equivalentes', type: 'ATIVO', nature: 'DEVEDORA', parentCode: '1.1' },
  { code: '1.1.02', name: 'Contas a Receber', type: 'ATIVO', nature: 'DEVEDORA', parentCode: '1.1' },
  { code: '1.1.03', name: 'Estoques', type: 'ATIVO', nature: 'DEVEDORA', parentCode: '1.1' },
  { code: '1.2', name: 'Ativo Não Circulante', type: 'ATIVO', nature: 'DEVEDORA', parentCode: '1' },
  { code: '1.2.01', name: 'Imobilizado', type: 'ATIVO', nature: 'DEVEDORA', parentCode: '1.2' },
  { code: '2', name: 'Passivo', type: 'PASSIVO', nature: 'CREDORA' },
  { code: '2.1', name: 'Passivo Circulante', type: 'PASSIVO', nature: 'CREDORA', parentCode: '2' },
  { code: '2.1.01', name: 'Fornecedores', type: 'PASSIVO', nature: 'CREDORA', parentCode: '2.1' },
  { code: '2.1.02', name: 'Obrigações', type: 'PASSIVO', nature: 'CREDORA', parentCode: '2.1' },
  { code: '2.2', name: 'Passivo Não Circulante', type: 'PASSIVO', nature: 'CREDORA', parentCode: '2' },
  { code: '2.2.01', name: 'Financiamentos', type: 'PASSIVO', nature: 'CREDORA', parentCode: '2.2' },
  { code: '3', name: 'Patrimônio Líquido', type: 'PL', nature: 'CREDORA' },
  { code: '3.1', name: 'Capital Social', type: 'PL', nature: 'CREDORA', parentCode: '3' },
  { code: '3.2', name: 'Lucros Acumulados', type: 'PL', nature: 'CREDORA', parentCode: '3' },
  { code: '3.3', name: 'Dividendos / Distribuições', type: 'PL', nature: 'DEVEDORA', parentCode: '3' },
  { code: '4', name: 'Receitas', type: 'RECEITA', nature: 'CREDORA' },
  { code: '4.1', name: 'Receita de Vendas', type: 'RECEITA', nature: 'CREDORA', parentCode: '4' },
  { code: '4.2', name: 'Deduções da Receita', type: 'RECEITA', nature: 'DEVEDORA', parentCode: '4' },
  { code: '5', name: 'Custos', type: 'CUSTO', nature: 'DEVEDORA' },
  { code: '5.1', name: 'Custos dos Produtos / Serviços', type: 'CUSTO', nature: 'DEVEDORA', parentCode: '5' },
  { code: '5.2', name: 'CAPEX', type: 'CUSTO', nature: 'DEVEDORA', parentCode: '5' },
  { code: '6', name: 'Despesas', type: 'DESPESA', nature: 'DEVEDORA' },
  { code: '6.1', name: 'Despesas Comerciais', type: 'DESPESA', nature: 'DEVEDORA', parentCode: '6' },
  { code: '6.2', name: 'Despesas Administrativas', type: 'DESPESA', nature: 'DEVEDORA', parentCode: '6' },
  { code: '6.3', name: 'Outras Despesas Operacionais', type: 'DESPESA', nature: 'DEVEDORA', parentCode: '6' },
  { code: '6.4', name: 'Resultado Financeiro', type: 'DESPESA', nature: 'DEVEDORA', parentCode: '6' },
  { code: '6.5', name: 'IR / CSLL', type: 'DESPESA', nature: 'DEVEDORA', parentCode: '6' },
]

export function validateJournalEntry(entry: JournalEntry): string[] {
  const errors: string[] = []
  const codes = new Set(chartOfAccounts.map((account) => account.code))
  if (!entry.date) errors.push('Data do lançamento é obrigatória.')
  if (!entry.competence) errors.push('Competência é obrigatória.')
  if (!entry.description) errors.push('Histórico é obrigatório.')
  if (!codes.has(entry.debitAccount)) errors.push(`Conta de débito inexistente: ${entry.debitAccount}.`)
  if (!codes.has(entry.creditAccount)) errors.push(`Conta de crédito inexistente: ${entry.creditAccount}.`)
  if (entry.debitAccount === entry.creditAccount) errors.push('Débito e crédito não podem ser a mesma conta.')
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) errors.push('Valor deve ser maior que zero.')
  return errors
}

export function validateJournal(entries: JournalEntry[]): string[] {
  return entries.flatMap((entry) => validateJournalEntry(entry).map((error) => `${entry.id}: ${error}`))
}

export type AccountBalance = {
  accountCode: string
  debit: number
  credit: number
  balance: number
}

// Razão derivado do Diário: saldo = débitos - créditos.
export function ledgerFromJournal(entries: JournalEntry[]): AccountBalance[] {
  const balances = new Map<string, AccountBalance>()
  const ensure = (accountCode: string) => {
    if (!balances.has(accountCode)) balances.set(accountCode, { accountCode, debit: 0, credit: 0, balance: 0 })
    return balances.get(accountCode)!
  }

  for (const entry of entries) {
    ensure(entry.debitAccount).debit += entry.amount
    ensure(entry.creditAccount).credit += entry.amount
  }

  return Array.from(balances.values()).map((item) => ({
    ...item,
    balance: item.debit - item.credit,
  }))
}

// Todo lançamento contábil nasce balanceado: um débito e um crédito pelo mesmo valor.
export function journalTotals(entries: JournalEntry[]) {
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0)
  return { debit: total, credit: total, difference: 0, balanced: true }
}

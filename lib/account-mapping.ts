import { chartOfAccounts, type AccountClass } from './contabil-model'

export type Statement = 'BP' | 'DRE' | 'DFC' | 'DMPL'

export type AccountMapping = {
  code: string
  name: string
  class: AccountClass
  statements: Statement[]
  section: string
  cashFlow?: 'operacional' | 'investimento' | 'financiamento' | 'nao-caixa'
}

const sectionByClass: Record<AccountClass, string> = {
  ativo: 'Ativo',
  passivo: 'Passivo',
  patrimonio: 'Patrimônio Líquido',
  receita: 'Receitas',
  custo: 'Custos',
  despesa: 'Despesas',
}

export const accountMappings: AccountMapping[] = chartOfAccounts.map(account => ({
  code: account.code,
  name: account.name,
  class: account.class,
  statements: account.class === 'ativo' || account.class === 'passivo'
    ? ['BP', 'DFC']
    : account.class === 'patrimonio'
      ? ['BP', 'DMPL']
      : ['DRE', 'DFC'],
  section: sectionByClass[account.class],
  cashFlow: account.class === 'receita' || account.class === 'custo' || account.class === 'despesa'
    ? 'operacional'
    : account.code === '1.2.01'
      ? 'investimento'
      : account.code === '2.2.01'
        ? 'financiamento'
        : 'nao-caixa',
}))

export function mappingFor(code: string) {
  return accountMappings.find(account => account.code === code)
}

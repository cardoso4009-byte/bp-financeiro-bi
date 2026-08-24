export type AccountNature = 'devedora' | 'credora'
export type AccountClass = 'ativo' | 'passivo' | 'patrimonio' | 'receita' | 'custo' | 'despesa'

export interface Account { code: string; name: string; class: AccountClass; nature: AccountNature; level: number }
export interface JournalLine { account: string; debit: number; credit: number }
export interface JournalEntry { id: string; date: string; description: string; lines: JournalLine[] }

export const chartOfAccounts: Account[] = [
  { code:'1', name:'Ativo', class:'ativo', nature:'devedora', level:1 }, { code:'1.1', name:'Ativo Circulante', class:'ativo', nature:'devedora', level:2 },
  { code:'1.1.01', name:'Caixa e Bancos', class:'ativo', nature:'devedora', level:3 }, { code:'1.1.02', name:'Contas a Receber', class:'ativo', nature:'devedora', level:3 }, { code:'1.1.03', name:'Estoques', class:'ativo', nature:'devedora', level:3 },
  { code:'1.2', name:'Ativo Não Circulante', class:'ativo', nature:'devedora', level:2 }, { code:'1.2.01', name:'Imobilizado', class:'ativo', nature:'devedora', level:3 },
  { code:'2', name:'Passivo', class:'passivo', nature:'credora', level:1 }, { code:'2.1', name:'Passivo Circulante', class:'passivo', nature:'credora', level:2 }, { code:'2.1.01', name:'Fornecedores', class:'passivo', nature:'credora', level:3 }, { code:'2.1.02', name:'Obrigações e Tributos', class:'passivo', nature:'credora', level:3 },
  { code:'2.2', name:'Passivo Não Circulante', class:'passivo', nature:'credora', level:2 }, { code:'2.2.01', name:'Empréstimos e Financiamentos', class:'passivo', nature:'credora', level:3 },
  { code:'3', name:'Patrimônio Líquido', class:'patrimonio', nature:'credora', level:1 }, { code:'3.1', name:'Capital Social', class:'patrimonio', nature:'credora', level:2 }, { code:'3.2', name:'Lucros/Prejuízos Acumulados', class:'patrimonio', nature:'credora', level:2 },
  { code:'4', name:'Receitas', class:'receita', nature:'credora', level:1 }, { code:'4.1', name:'Receita de Vendas', class:'receita', nature:'credora', level:2 },
  { code:'5', name:'Custos', class:'custo', nature:'devedora', level:1 }, { code:'5.1', name:'Custo dos Produtos/Serviços', class:'custo', nature:'devedora', level:2 },
  { code:'6', name:'Despesas', class:'despesa', nature:'devedora', level:1 }, { code:'6.1', name:'Despesas Operacionais', class:'despesa', nature:'devedora', level:2 }, { code:'6.2', name:'Despesas Financeiras', class:'despesa', nature:'devedora', level:2 },
]

export const sampleJournal: JournalEntry[] = [
  { id:'000', date:'2026-01-02', description:'Integralização de capital social', lines:[{account:'1.1.01',debit:75000,credit:0},{account:'3.1',debit:0,credit:75000}] },
  { id:'001', date:'2026-01-05', description:'Venda a prazo', lines:[{account:'1.1.02',debit:100000,credit:0},{account:'4.1',debit:0,credit:100000}] },
  { id:'002', date:'2026-01-10', description:'Pagamento de despesas operacionais', lines:[{account:'6.1',debit:25000,credit:0},{account:'1.1.01',debit:0,credit:25000}] },
  { id:'003', date:'2026-01-15', description:'Compra de equipamento', lines:[{account:'1.2.01',debit:50000,credit:0},{account:'1.1.01',debit:0,credit:50000}] },
]

export function entryTotals(entry: JournalEntry){const debit=entry.lines.reduce((s,l)=>s+l.debit,0);const credit=entry.lines.reduce((s,l)=>s+l.credit,0);return {debit,credit,balanced:Math.abs(debit-credit)<0.01}}
export function journalIsBalanced(entries: JournalEntry[]){return entries.every(entry=>entryTotals(entry).balanced)}

import type { Account, JournalEntry } from '../lib/accounting-core'
import { buildTrialBalance } from '../lib/trial-balance-engine'

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(`TRIAL BALANCE GATE: ${message}`)
}
const close = (actual: number, expected: number) => Math.abs(actual - expected) < 0.01

const accounts: Account[] = [
  { code: '1', name: 'Ativo', class: 'ativo', nature: 'devedora', level: 1 },
  { code: '1.1', name: 'Ativo Circulante', class: 'ativo', nature: 'devedora', level: 2, parentCode: '1' },
  { code: '1.1.01', name: 'Caixa', class: 'ativo', nature: 'devedora', level: 3, parentCode: '1.1' },
  { code: '2', name: 'Passivo', class: 'passivo', nature: 'credora', level: 1 },
  { code: '2.1', name: 'Fornecedores', class: 'passivo', nature: 'credora', level: 2, parentCode: '2' },
  { code: '3', name: 'Patrimônio Líquido', class: 'patrimonio', nature: 'credora', level: 1 },
  { code: '3.1', name: 'Capital', class: 'patrimonio', nature: 'credora', level: 2, parentCode: '3' },
  { code: '4', name: 'Receitas', class: 'receita', nature: 'credora', level: 1 },
  { code: '4.1', name: 'Receita de Serviços', class: 'receita', nature: 'credora', level: 2, parentCode: '4' },
]

const entries: JournalEntry[] = [
  {
    id: 'OPEN-01', date: '2025-12-31', competence: '2025-12', description: 'Abertura',
    lines: [
      { account: '1.1.01', debit: 1000, credit: 0 },
      { account: '3.1', debit: 0, credit: 1000 },
    ],
  },
  {
    id: 'JAN-01', date: '2026-01-15', competence: '2026-01', description: 'Compra a prazo',
    lines: [
      { account: '1.1.01', debit: 200, credit: 0 },
      { account: '2.1', debit: 0, credit: 200 },
    ],
  },
  {
    id: 'FEB-01', date: '2026-02-10', competence: '2026-02', description: 'Receita recebida',
    lines: [
      { account: '1.1.01', debit: 300, credit: 0 },
      { account: '4.1', debit: 0, credit: 300 },
    ],
  },
  {
    id: 'MAR-01', date: '2026-03-05', competence: '2026-03', description: 'Pagamento fornecedor',
    lines: [
      { account: '2.1', debit: 50, credit: 0 },
      { account: '1.1.01', debit: 0, credit: 50 },
    ],
  },
]

const result = buildTrialBalance(entries, accounts, '2026-02', '2026-02')
const row = (code: string) => result.rows.find(item => item.account.code === code)!

assert(result.rows.length === accounts.length, 'todas as contas, inclusive sem movimento, devem aparecer')
assert(close(row('1.1.01').openingBalance, 1200), 'saldo anterior de Caixa deve incluir abertura e janeiro')
assert(close(row('1.1.01').debit, 300) && close(row('1.1.01').credit, 0), 'movimentação de Caixa deve considerar somente fevereiro')
assert(close(row('1.1.01').closingBalance, 1500), 'saldo final de Caixa deve somar saldo anterior e movimento')
assert(close(row('1').openingBalance, 1200) && close(row('1').closingBalance, 1500), 'conta sintética deve consolidar os filhos')
assert(close(row('2').openingBalance, 200) && close(row('2').closingBalance, 200), 'natureza credora deve apresentar saldo credor positivo')
assert(close(row('4').credit, 300) && close(row('4').closingBalance, 300), 'receita sintética deve consolidar crédito da conta analítica')
assert(close(result.totals.debit, 300) && close(result.totals.credit, 300), 'totais do período devem ser calculados sem duplicar contas sintéticas')
assert(result.totals.balanced, 'período balanceado deve retornar status OK')

const accumulated = buildTrialBalance(entries, accounts, '2026-01', '2026-02')
assert(close(rowFrom(accumulated, '1.1.01').debit, 500), 'acumulado jan-fev deve somar somente movimentação do intervalo')
assert(close(rowFrom(accumulated, '1.1.01').openingBalance, 1000), 'acumulado jan-fev deve preservar abertura anterior')
assert(close(accumulated.totals.debit, 500) && close(accumulated.totals.credit, 500), 'totais acumulados devem permanecer balanceados')

function rowFrom(value: typeof accumulated, code: string) {
  return value.rows.find(item => item.account.code === code)!
}

let invalidCompetenceRejected = false
try {
  buildTrialBalance(entries, accounts, '2026-13')
} catch {
  invalidCompetenceRejected = true
}
assert(invalidCompetenceRejected, 'competência inválida deve ser rejeitada')

console.log('TRIAL BALANCE GATE: OK — saldo anterior, mensal, acumulado, natureza, hierarquia e totais sem duplicidade.')

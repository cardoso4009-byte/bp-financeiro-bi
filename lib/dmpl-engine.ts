import { JournalEntry, chartOfAccounts } from './accounting-core'
import { buildTrialBalance } from './trial-balance-engine'

export type DmplResult = {
  plInicial: number
  lucroLiquido: number
  dividendos: number
  outrosMovimentos: number
  plCalculado: number
  plContabil: number
  diferenca: number
  status: 'OK' | 'REVISAR'
  evidence: string[]
}

/**
 * Calcula a ponte do patrimônio líquido a partir do balancete.
 * Não cria ajustes automaticamente: qualquer diferença fica explícita para análise.
 */
export function buildDmpl(entries: JournalEntry[], plInicial: number, dividendos = 0, outrosMovimentos = 0): DmplResult {
  const trial = buildTrialBalance(entries, chartOfAccounts)
  const lucroLiquido = trial.rows
    .filter(row => row.type === 'RECEITA' || row.type === 'CUSTO' || row.type === 'DESPESA')
    .reduce((sum, row) => sum + (row.type === 'RECEITA' ? row.balance : -row.balance), 0)

  const plContabil = trial.rows
    .filter(row => row.type === 'PL')
    .reduce((sum, row) => sum + row.balance, 0)

  const plCalculado = plInicial + lucroLiquido + dividendos + outrosMovimentos
  const diferenca = plCalculado - plContabil

  const evidence = trial.rows
    .filter(row => row.type === 'PL' || row.type === 'RECEITA' || row.type === 'CUSTO' || row.type === 'DESPESA')
    .filter(row => Math.abs(row.balance) >= 0.01)
    .map(row => `${row.code} ${row.name}: ${row.balance}`)

  return {
    plInicial,
    lucroLiquido,
    dividendos,
    outrosMovimentos,
    plCalculado,
    plContabil,
    diferenca,
    status: Math.abs(diferenca) < 0.01 ? 'OK' : 'REVISAR',
    evidence,
  }
}

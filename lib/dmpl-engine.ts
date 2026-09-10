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
 * Calcula a ponte do patrimônio líquido a partir do balancete do período.
 *
 * `plInicial` representa o PL de abertura da competência analisada. As
 * movimentações patrimoniais encontradas no diário entram em `plLedger`,
 * enquanto o resultado do período entra em `lucroLiquido`.
 */
export function buildDmpl(entries: JournalEntry[], plInicial: number, dividendos = 0, outrosMovimentos = 0): DmplResult {
  const trial = buildTrialBalance(entries, chartOfAccounts)

  const lucroLiquido = trial.rows
    .filter(row => row.class === 'receita' || row.class === 'custo' || row.class === 'despesa')
    .reduce((sum, row) => sum + (row.class === 'receita' ? row.balance : -row.balance), 0)

  const plLedger = trial.rows
    .filter(row => row.class === 'patrimonio')
    .reduce((sum, row) => sum + row.balance, 0)

  // O saldo contábil final parte do PL de abertura e incorpora tanto o
  // resultado quanto as movimentações registradas diretamente no PL.
  const plContabil = plInicial + lucroLiquido + plLedger
  const plCalculado = plInicial + lucroLiquido + dividendos + outrosMovimentos
  const diferenca = plCalculado - plContabil

  const evidence = trial.rows
    .filter(row => row.class === 'patrimonio' || row.class === 'receita' || row.class === 'custo' || row.class === 'despesa')
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

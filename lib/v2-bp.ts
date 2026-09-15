/**
 * Balanço Patrimonial gerencial V2.
 *
 * O BP é uma fotografia por competência: entram somente contas
 * classificadas como ativo, passivo ou patrimônio líquido e todos os
 * lançamentos até o período selecionado. Contas de resultado ficam fora.
 *
 * A equação patrimonial é medida, nunca ajustada artificialmente.
 */
import type { Account } from './v2-data-model'
import type { V2BaseRecord, V2FinancialBase } from './v2-financial-base'

export type V2BpStatement = 'ativo' | 'passivo' | 'patrimonio_liquido'

export interface V2BpAccountBalance {
  accountId: string
  code: string
  name: string
  statement: V2BpStatement
  balance: number
  entries: number
}

export interface V2BpReport {
  period: string
  ativo: number
  passivo: number
  patrimonioLiquido: number
  passivoMaisPatrimonioLiquido: number
  diferencaPatrimonial: number
  balanced: boolean
  accounts: V2BpAccountBalance[]
  excludedResultEntries: number
  entriesInSnapshot: number
}

function signedBalance(entry: V2BaseRecord, statement: V2BpStatement): number {
  // Débito aumenta ativo; crédito aumenta passivo/PL.
  return statement === 'ativo' ? entry.signedAmount : -entry.signedAmount
}

function isBeforeOrAt(entry: V2BaseRecord, period: string): boolean {
  return entry.period <= period
}

export function buildV2Bp(
  base: V2FinancialBase,
  accounts: Account[],
  period: string,
): V2BpReport {
  const accountById = new Map(accounts.map((account) => [account.id, account]))
  const snapshot = base.entries.filter((entry) => isBeforeOrAt(entry, period))
  const balanceSheetEntries = snapshot.filter((entry) => {
    const account = accountById.get(entry.accountId)
    return account?.statement !== 'resultado'
  })

  const grouped = new Map<string, V2BpAccountBalance>()
  for (const entry of balanceSheetEntries) {
    const account = accountById.get(entry.accountId)
    if (!account || account.statement === 'resultado') continue
    const current = grouped.get(account.id) ?? {
      accountId: account.id,
      code: account.code,
      name: account.name,
      statement: account.statement,
      balance: 0,
      entries: 0,
    }
    current.balance += signedBalance(entry, account.statement)
    current.entries += 1
    grouped.set(account.id, current)
  }

  const accountsReport = [...grouped.values()].sort((a, b) => a.code.localeCompare(b.code))
  const sum = (statement: V2BpStatement) =>
    accountsReport
      .filter((account) => account.statement === statement)
      .reduce((total, account) => total + account.balance, 0)

  const ativo = sum('ativo')
  const passivo = sum('passivo')
  const patrimonioLiquido = sum('patrimonio_liquido')
  const passivoMaisPatrimonioLiquido = passivo + patrimonioLiquido
  const diferencaPatrimonial = ativo - passivoMaisPatrimonioLiquido

  return {
    period,
    ativo,
    passivo,
    patrimonioLiquido,
    passivoMaisPatrimonioLiquido,
    diferencaPatrimonial,
    balanced: Math.abs(diferencaPatrimonial) < 0.005,
    accounts: accountsReport,
    excludedResultEntries: snapshot.length - balanceSheetEntries.length,
    entriesInSnapshot: snapshot.length,
  }
}

export function filterV2BpAccountsByStatement(
  report: V2BpReport,
  statement: V2BpStatement,
): V2BpAccountBalance[] {
  return report.accounts.filter((account) => account.statement === statement)
}

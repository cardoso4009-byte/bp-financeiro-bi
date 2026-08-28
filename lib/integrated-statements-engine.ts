import { chartOfAccounts, type JournalEntry } from './accounting-core'
import { buildTrialBalance, type TrialBalanceRow } from './trial-balance-engine'

export type StatementLine = {
  code: string
  name: string
  value: number
}

export type IntegratedStatements = {
  balanceSheet: {
    assets: StatementLine[]
    liabilities: StatementLine[]
    equity: StatementLine[]
    totalAssets: number
    totalLiabilities: number
    totalEquity: number
    difference: number
    balanced: boolean
  }
  incomeStatement: {
    revenue: StatementLine[]
    costs: StatementLine[]
    expenses: StatementLine[]
    revenueTotal: number
    costsTotal: number
    expensesTotal: number
    netIncome: number
  }
  trialBalance: ReturnType<typeof buildTrialBalance>
  controls: {
    trialBalanceBalanced: boolean
    balanceSheetBalanced: boolean
    incomeStatementCalculated: boolean
  }
}

function statementValue(row: TrialBalanceRow) {
  return Math.abs(row.balance) < 0.01 ? 0 : row.balance
}

export function buildIntegratedStatements(entries: JournalEntry[], accounts = chartOfAccounts): IntegratedStatements {
  const trialBalance = buildTrialBalance(entries, accounts)

  const assets = trialBalance.rows
    .filter(row => row.class === 'ativo' && Math.abs(row.balance) >= 0.01)
    .map(row => ({ code: row.code, name: row.name, value: statementValue(row) }))

  const liabilities = trialBalance.rows
    .filter(row => row.class === 'passivo' && Math.abs(row.balance) >= 0.01)
    .map(row => ({ code: row.code, name: row.name, value: statementValue(row) }))

  const equity = trialBalance.rows
    .filter(row => row.class === 'patrimonio' && Math.abs(row.balance) >= 0.01)
    .map(row => ({ code: row.code, name: row.name, value: statementValue(row) }))

  const revenue = trialBalance.rows
    .filter(row => row.class === 'receita' && Math.abs(row.balance) >= 0.01)
    .map(row => ({ code: row.code, name: row.name, value: statementValue(row) }))

  const costs = trialBalance.rows
    .filter(row => row.class === 'custo' && Math.abs(row.balance) >= 0.01)
    .map(row => ({ code: row.code, name: row.name, value: statementValue(row) }))

  const expenses = trialBalance.rows
    .filter(row => row.class === 'despesa' && Math.abs(row.balance) >= 0.01)
    .map(row => ({ code: row.code, name: row.name, value: statementValue(row) }))

  const revenueTotal = revenue.reduce((sum, row) => sum + row.value, 0)
  const costsTotal = costs.reduce((sum, row) => sum + row.value, 0)
  const expensesTotal = expenses.reduce((sum, row) => sum + row.value, 0)
  const netIncome = revenueTotal - costsTotal - expensesTotal

  // Em período aberto, o resultado ainda não foi encerrado para lucros acumulados.
  // Portanto, ele entra como linha transitória do PL para que o BP permaneça conciliado.
  const equityWithCurrentResult = netIncome !== 0
    ? [...equity, { code: 'RESULTADO_PERIODO', name: 'Resultado do período', value: netIncome }]
    : equity

  const totalAssets = assets.reduce((sum, row) => sum + row.value, 0)
  const totalLiabilities = liabilities.reduce((sum, row) => sum + row.value, 0)
  const totalEquity = equityWithCurrentResult.reduce((sum, row) => sum + row.value, 0)
  const difference = totalAssets - totalLiabilities - totalEquity

  return {
    balanceSheet: {
      assets,
      liabilities,
      equity: equityWithCurrentResult,
      totalAssets,
      totalLiabilities,
      totalEquity,
      difference,
      balanced: Math.abs(difference) < 0.01,
    },
    incomeStatement: {
      revenue,
      costs,
      expenses,
      revenueTotal,
      costsTotal,
      expensesTotal,
      netIncome,
    },
    trialBalance,
    controls: {
      trialBalanceBalanced: trialBalance.balanced,
      balanceSheetBalanced: Math.abs(difference) < 0.01,
      incomeStatementCalculated: Number.isFinite(netIncome),
    },
  }
}

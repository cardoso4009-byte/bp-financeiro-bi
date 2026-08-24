import type { FinancialEntry } from './lancamentos-data'

export type IntegratedModel = {
  receitaBruta: number
  deducoes: number
  receitaLiquida: number
  custos: number
  lucroBruto: number
  despesasComerciais: number
  despesasAdministrativas: number
  outrasDespesasOperacionais: number
  resultadoOperacional: number
  resultadoFinanceiro: number
  irCsll: number
  lucroLiquido: number
  caixaOperacional: number
  investimentos: number
  financiamentos: number
  caixaInicial: number
  caixaFinal: number
  lancamentos: number
  saldoAberto: number
}

const abs = (n: number) => Math.abs(n)
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export function buildIntegratedModel(entries: FinancialEntry[], openingCash = 50_000): IntegratedModel {
  const receitas = entries.filter(e => e.type === 'Receita')
  const despesas = entries.filter(e => e.type === 'Despesa')
  const capex = entries.filter(e => e.type === 'CAPEX')
  const financiamentos = entries.filter(e => e.type === 'Financiamento')

  const byCategory = (names: string[]) => sum(despesas.filter(e => names.includes(e.category)).map(e => -abs(e.value)))
  const receitaBruta = sum(receitas.filter(e => e.category !== 'Impostos').map(e => abs(e.value)))
  const deducoes = byCategory(['Impostos', 'Deduções', 'Impostos sobre vendas'])
  const receitaLiquida = receitaBruta + deducoes
  const custos = byCategory(['Custos', 'CPV', 'CSP', 'Custo de vendas'])
  const lucroBruto = receitaLiquida + custos
  const despesasComerciais = byCategory(['Comercial', 'Vendas', 'Despesas Comerciais'])
  const despesasAdministrativas = byCategory(['Administrativo', 'Pessoal', 'Despesas Administrativas'])
  const outrasDespesasOperacionais = byCategory(['Outras despesas', 'Outros'])
  const resultadoFinanceiro = byCategory(['Financeiro', 'Juros', 'Resultado Financeiro'])
  const irCsll = byCategory(['IR/CSLL', 'Impostos sobre lucro'])
  const resultadoOperacional = lucroBruto + despesasComerciais + despesasAdministrativas + outrasDespesasOperacionais
  const lucroLiquido = resultadoOperacional + resultadoFinanceiro + irCsll

  const paid = entries.filter(e => e.status === 'Pago')
  const cashRevenue = sum(paid.filter(e => e.type === 'Receita').map(e => abs(e.value)))
  const cashOpex = sum(paid.filter(e => e.type === 'Despesa').map(e => e.value))
  const caixaOperacional = cashRevenue + cashOpex
  const investimentos = -sum(paid.filter(e => e.type === 'CAPEX').map(e => abs(e.value)))
  const financiamentosCash = sum(paid.filter(e => e.type === 'Financiamento').map(e => e.value))
  const caixaFinal = openingCash + caixaOperacional + investimentos + financiamentosCash
  const saldoAberto = sum(entries.filter(e => e.status === 'Em aberto').map(e => e.value))

  return { receitaBruta, deducoes, receitaLiquida, custos, lucroBruto, despesasComerciais, despesasAdministrativas, outrasDespesasOperacionais, resultadoOperacional, resultadoFinanceiro, irCsll, lucroLiquido, caixaOperacional, investimentos, financiamentos: financiamentosCash, caixaInicial: openingCash, caixaFinal, lancamentos: entries.length, saldoAberto }
}

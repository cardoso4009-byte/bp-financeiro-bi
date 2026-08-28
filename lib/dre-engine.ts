import { monthlyData, budgetData, type MonthlyFinancial } from './monthly-data'

export type DRELineKey =
  | 'receitaBruta' | 'deducoes' | 'receitaLiquida' | 'custos' | 'lucroBruto'
  | 'despesasComerciais' | 'despesasAdministrativas' | 'outrasDespesasOperacionais'
  | 'ebitda' | 'depreciacao' | 'resultadoOperacional' | 'resultadoFinanceiro'
  | 'resultadoAntesIR' | 'irCsll' | 'lucroLiquido'

export type DRELine = {
  key: DRELineKey
  label: string
  section: 'receita' | 'custos' | 'opex' | 'resultado' | 'financeiro' | 'tributos'
}

export const dreLines: DRELine[] = [
  { key: 'receitaBruta', label: 'Receita Bruta', section: 'receita' },
  { key: 'deducoes', label: '(-) Deduções da Receita', section: 'receita' },
  { key: 'receitaLiquida', label: '= Receita Líquida', section: 'receita' },
  { key: 'custos', label: '(-) Custos', section: 'custos' },
  { key: 'lucroBruto', label: '= Lucro Bruto', section: 'resultado' },
  { key: 'despesasComerciais', label: '(-) Despesas Comerciais', section: 'opex' },
  { key: 'despesasAdministrativas', label: '(-) Despesas Administrativas', section: 'opex' },
  { key: 'outrasDespesasOperacionais', label: '(-) Outras Despesas Operacionais', section: 'opex' },
  { key: 'ebitda', label: '= EBITDA', section: 'resultado' },
  { key: 'depreciacao', label: '(-) Depreciação', section: 'opex' },
  { key: 'resultadoOperacional', label: '= Resultado Operacional', section: 'resultado' },
  { key: 'resultadoFinanceiro', label: '(+/-) Resultado Financeiro', section: 'financeiro' },
  { key: 'resultadoAntesIR', label: '= Resultado Antes do IR/CSLL', section: 'resultado' },
  { key: 'irCsll', label: '(-) IR / CSLL', section: 'tributos' },
  { key: 'lucroLiquido', label: '= Lucro Líquido', section: 'resultado' },
]

export type DREPeriod = { start: number; end: number }
export type DRESnapshot = {
  actual: Record<DRELineKey, number>
  budget: Record<DRELineKey, number>
  variance: Record<DRELineKey, number>
  margins: { gross: number; ebitda: number; operational: number; net: number }
}

function sum(items: Array<Record<string, number>>, key: DRELineKey) {
  return items.reduce((total, item) => total + Number(item[key] ?? 0), 0)
}

function toStatement(item: MonthlyFinancial): Record<DRELineKey, number> {
  const opex = -item.opex
  const despesasComerciais = opex * (70 / 190)
  const despesasAdministrativas = opex * (101 / 190)
  const outrasDespesasOperacionais = opex * (19 / 190)
  const resultadoAntesIR = item.resultadoOperacional + item.resultadoFinanceiro
  return {
    receitaBruta: item.receitaBruta,
    deducoes: item.deducoes,
    receitaLiquida: item.receitaLiquida,
    custos: item.custos,
    lucroBruto: item.lucroBruto,
    despesasComerciais,
    despesasAdministrativas,
    outrasDespesasOperacionais,
    ebitda: item.ebitda,
    depreciacao: -item.depreciacao,
    resultadoOperacional: item.resultadoOperacional,
    resultadoFinanceiro: item.resultadoFinanceiro,
    resultadoAntesIR,
    irCsll: item.lucroLiquido - resultadoAntesIR,
    lucroLiquido: item.lucroLiquido,
  }
}

function budgetStatement(item: (typeof budgetData)[number]): Record<DRELineKey, number> {
  const receitaLiquida = item.receitaLiquida
  const lucroBruto = item.lucroBruto
  const custos = lucroBruto - receitaLiquida
  const resultadoOperacional = item.resultadoOperacional
  const depreciacao = -2500
  const ebitda = resultadoOperacional - depreciacao
  const opex = ebitda - lucroBruto
  const resultadoFinanceiro = 0
  const resultadoAntesIR = resultadoOperacional
  const receitaBruta = receitaLiquida / 0.9
  return {
    receitaBruta,
    deducoes: receitaBruta * -0.1,
    receitaLiquida,
    custos,
    lucroBruto,
    despesasComerciais: opex * (70 / 190),
    despesasAdministrativas: opex * (101 / 190),
    outrasDespesasOperacionais: opex * (19 / 190),
    ebitda,
    depreciacao,
    resultadoOperacional,
    resultadoFinanceiro,
    resultadoAntesIR,
    irCsll: item.lucroLiquido - resultadoAntesIR,
    lucroLiquido: item.lucroLiquido,
  }
}

/** Motor da DRE: soma somente os meses do período, sem multiplicação anual artificial. */
export function buildDRE(period: DREPeriod = { start: 0, end: 11 }): DRESnapshot {
  const start = Math.max(0, Math.min(11, period.start))
  const end = Math.max(start, Math.min(11, period.end))
  const actualItems = monthlyData.slice(start, end + 1).map(toStatement)
  const budgetItems = budgetData.slice(start, end + 1).map(budgetStatement)
  const actual = Object.fromEntries(dreLines.map(line => [line.key, sum(actualItems, line.key)])) as Record<DRELineKey, number>
  const budget = Object.fromEntries(dreLines.map(line => [line.key, sum(budgetItems, line.key)])) as Record<DRELineKey, number>
  const variance = Object.fromEntries(dreLines.map(line => [line.key, actual[line.key] - budget[line.key]])) as Record<DRELineKey, number>
  const revenue = actual.receitaLiquida
  return {
    actual,
    budget,
    variance,
    margins: {
      gross: revenue ? actual.lucroBruto / revenue : 0,
      ebitda: revenue ? actual.ebitda / revenue : 0,
      operational: revenue ? actual.resultadoOperacional / revenue : 0,
      net: revenue ? actual.lucroLiquido / revenue : 0,
    },
  }
}

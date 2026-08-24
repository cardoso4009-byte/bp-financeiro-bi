export type MonthlyFinancial = {
  month: string
  receitaBruta: number
  deducoes: number
  receitaLiquida: number
  custos: number
  lucroBruto: number
  opex: number
  ebitda: number
  depreciacao: number
  resultadoOperacional: number
  resultadoFinanceiro: number
  lucroLiquido: number
  caixaOperacional: number
  investimentos: number
  financiamentos: number
  caixaFinal: number
}

const receitas = [70000,75000,80000,78000,82000,85000,88000,80000,90000,92000,85000,95000]
const deducoes = receitas.map(v => -v * 0.10)
const custos = receitas.map(v => -v * 0.50)
const opex = receitas.map(v => -v * 0.19)
const financeiro = [-3000,-3000,-3000,-3000,-3000,-3000,-4000,-3000,-4000,-4000,-3000,-4000]
const impostos = [-18529,-19853,-21176,-20647,-21765,-22500,-23294,-21176,-23824,-24353,-22500,-25176]
const caixaOperacional = [8000,9000,10000,8000,10000,11000,12000,9000,11000,12000,10000,10000]
const investimentos = [-5000,-5000,-10000,-5000,-10000,-10000,-15000,-10000,-10000,-10000,-5000,-15000]
const financiamentos = [10000,0,0,0,20000,0,0,0,0,0,-20000,30000]
const depreciacoes = [2500,2500,2500,2500,2500,2500,2500,2500,2500,2500,2500,2500]
const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

let caixa = 50000
export const monthlyData: MonthlyFinancial[] = months.map((month, i) => {
  const receitaLiquida = receitas[i] + deducoes[i]
  const lucroBruto = receitaLiquida + custos[i]
  const ebitda = lucroBruto + opex[i]
  const resultadoOperacional = ebitda - depreciacoes[i]
  const resultadoAntesIR = resultadoOperacional + financeiro[i]
  const lucroLiquido = resultadoAntesIR + impostos[i]
  caixa += caixaOperacional[i] + investimentos[i] + financiamentos[i]
  return {
    month,
    receitaBruta: receitas[i],
    deducoes: deducoes[i],
    receitaLiquida,
    custos: custos[i],
    lucroBruto,
    opex: opex[i],
    ebitda,
    depreciacao: depreciacoes[i],
    resultadoOperacional,
    resultadoFinanceiro: financeiro[i],
    lucroLiquido,
    caixaOperacional: caixaOperacional[i],
    investimentos: investimentos[i],
    financiamentos: financiamentos[i],
    caixaFinal: caixa,
  }
})

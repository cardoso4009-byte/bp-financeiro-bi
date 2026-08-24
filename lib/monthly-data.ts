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

export const monthlyData: MonthlyFinancial[] = [
  { month: 'Jan', receitaBruta: 70000, deducoes: -7000, receitaLiquida: 63000, custos: -35000, lucroBruto: 28000, opex: -13000, ebitda: 15000, depreciacao: -2000, resultadoOperacional: 13000, resultadoFinanceiro: -2500, lucroLiquido: 10500, caixaOperacional: 10000, investimentos: -5000, financiamentos: 10000, caixaFinal: 65000 },
  { month: 'Fev', receitaBruta: 75000, deducoes: -7500, receitaLiquida: 67500, custos: -37500, lucroBruto: 30000, opex: -14000, ebitda: 16000, depreciacao: -2000, resultadoOperacional: 14000, resultadoFinanceiro: -2500, lucroLiquido: 11500, caixaOperacional: 12000, investimentos: -5000, financiamentos: 0, caixaFinal: 72000 },
  { month: 'Mar', receitaBruta: 80000, deducoes: -8000, receitaLiquida: 72000, custos: -40000, lucroBruto: 32000, opex: -15000, ebitda: 17000, depreciacao: -2000, resultadoOperacional: 15000, resultadoFinanceiro: -3000, lucroLiquido: 12000, caixaOperacional: 13000, investimentos: -10000, financiamentos: 0, caixaFinal: 75000 },
  { month: 'Abr', receitaBruta: 78000, deducoes: -7800, receitaLiquida: 70200, custos: -39000, lucroBruto: 31200, opex: -14500, ebitda: 16700, depreciacao: -2000, resultadoOperacional: 14700, resultadoFinanceiro: -3000, lucroLiquido: 11700, caixaOperacional: 11000, investimentos: -5000, financiamentos: 0, caixaFinal: 81000 },
  { month: 'Mai', receitaBruta: 82000, deducoes: -8200, receitaLiquida: 73800, custos: -41000, lucroBruto: 32800, opex: -15500, ebitda: 17300, depreciacao: -2000, resultadoOperacional: 15300, resultadoFinanceiro: -3000, lucroLiquido: 12300, caixaOperacional: 14000, investimentos: -15000, financiamentos: 20000, caixaFinal: 100000 },
  { month: 'Jun', receitaBruta: 85000, deducoes: -8500, receitaLiquida: 76500, custos: -42500, lucroBruto: 34000, opex: -16000, ebitda: 18000, depreciacao: -2000, resultadoOperacional: 16000, resultadoFinanceiro: -3000, lucroLiquido: 13000, caixaOperacional: 15000, investimentos: -10000, financiamentos: 0, caixaFinal: 105000 },
  { month: 'Jul', receitaBruta: 88000, deducoes: -8800, receitaLiquida: 79200, custos: -44000, lucroBruto: 35200, opex: -16500, ebitda: 18700, depreciacao: -2000, resultadoOperacional: 16700, resultadoFinanceiro: -3500, lucroLiquido: 13200, caixaOperacional: 14000, investimentos: -10000, financiamentos: 0, caixaFinal: 109000 },
  { month: 'Ago', receitaBruta: 80000, deducoes: -8000, receitaLiquida: 72000, custos: -40000, lucroBruto: 32000, opex: -15000, ebitda: 17000, depreciacao: -2000, resultadoOperacional: 15000, resultadoFinanceiro: -3000, lucroLiquido: 12000, caixaOperacional: 12000, investimentos: -10000, financiamentos: 0, caixaFinal: 111000 },
  { month: 'Set', receitaBruta: 90000, deducoes: -9000, receitaLiquida: 81000, custos: -45000, lucroBruto: 36000, opex: -17000, ebitda: 19000, depreciacao: -2500, resultadoOperacional: 16500, resultadoFinanceiro: -3500, lucroLiquido: 13000, caixaOperacional: 15000, investimentos: -15000, financiamentos: 0, caixaFinal: 111000 },
  { month: 'Out', receitaBruta: 92000, deducoes: -9200, receitaLiquida: 82800, custos: -46000, lucroBruto: 36800, opex: -17500, ebitda: 19300, depreciacao: -2500, resultadoOperacional: 16800, resultadoFinanceiro: -3500, lucroLiquido: 13300, caixaOperacional: 16000, investimentos: -10000, financiamentos: 0, caixaFinal: 117000 },
  { month: 'Nov', receitaBruta: 85000, deducoes: -8500, receitaLiquida: 76500, custos: -42500, lucroBruto: 34000, opex: -16000, ebitda: 18000, depreciacao: -2000, resultadoOperacional: 16000, resultadoFinanceiro: -3000, lucroLiquido: 13000, caixaOperacional: 15000, investimentos: -5000, financiamentos: -20000, caixaFinal: 107000 },
  { month: 'Dez', receitaBruta: 95000, deducoes: -9500, receitaLiquida: 85500, custos: -47500, lucroBruto: 38000, opex: -17600, ebitda: 20400, depreciacao: -3000, resultadoOperacional: 17400, resultadoFinanceiro: -3500, lucroLiquido: 13900, caixaOperacional: 16000, investimentos: -10000, financiamentos: 10000, caixaFinal: 113000 },
]

import { monthlyData } from '@/lib/monthly-data'

export type WorkingCapitalMonth = {
  month: string
  receitaLiquida: number
  custos: number
  contasReceber: number
  estoques: number
  fornecedores: number
  ncg: number
  dso: number
  dio: number
  dpo: number
  cicloFinanceiro: number
}

// Premissas demonstrativas editáveis: dias médios de recebimento, estoque e pagamento.
const DSO = 45
const DIO = 30
const DPO = 35

export const workingCapitalData: WorkingCapitalMonth[] = monthlyData.map((m) => {
  const custosBase = Math.abs(m.custos)
  const contasReceber = m.receitaLiquida * DSO / 30
  const estoques = custosBase * DIO / 30
  const fornecedores = custosBase * DPO / 30
  const ncg = contasReceber + estoques - fornecedores

  return {
    month: m.month,
    receitaLiquida: m.receitaLiquida,
    custos: custosBase,
    contasReceber,
    estoques,
    fornecedores,
    ncg,
    dso: DSO,
    dio: DIO,
    dpo: DPO,
    cicloFinanceiro: DSO + DIO - DPO,
  }
})

export const workingCapitalTotals = {
  receitaLiquida: workingCapitalData.reduce((s, m) => s + m.receitaLiquida, 0),
  contasReceber: workingCapitalData.reduce((s, m) => s + m.contasReceber, 0) / workingCapitalData.length,
  estoques: workingCapitalData.reduce((s, m) => s + m.estoques, 0) / workingCapitalData.length,
  fornecedores: workingCapitalData.reduce((s, m) => s + m.fornecedores, 0) / workingCapitalData.length,
  ncg: workingCapitalData.reduce((s, m) => s + m.ncg, 0) / workingCapitalData.length,
  cicloFinanceiro: DSO + DIO - DPO,
  dso: DSO,
  dio: DIO,
  dpo: DPO,
}

export type FinancialData = {
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
  depreciacao: number
  aumentoContasReceber: number
  aumentoEstoques: number
  aumentoFornecedores: number
  aumentoObrigacoes: number
  caixaOperacional: number
  investimentos: number
  financiamentos: number
  caixaInicial: number
  caixaFinal: number
  ativoCirculante: number
  ativoNaoCirculante: number
  ativoTotal: number
  passivoCirculante: number
  passivoNaoCirculante: number
  passivoTotal: number
  plInicial: number
  dividendos: number
  plFinal: number
}

// Totais da mesma base mensal usada pelo DRE e pelo fluxo projetado.
// Resultado operacional é apresentado após depreciação; EBITDA permanece separado.
export const financialData: FinancialData = {
  receitaBruta: 1_000_000,
  deducoes: -100_000,
  receitaLiquida: 900_000,
  custos: -500_000,
  lucroBruto: 400_000,
  despesasComerciais: -70_000,
  despesasAdministrativas: -101_000,
  outrasDespesasOperacionais: -19_000,
  resultadoOperacional: 180_000,
  resultadoFinanceiro: -40_000,
  irCsll: -50_000,
  lucroLiquido: 90_000,
  depreciacao: 30_000,
  aumentoContasReceber: -50_000,
  aumentoEstoques: -30_000,
  aumentoFornecedores: 40_000,
  aumentoObrigacoes: 10_000,
  caixaOperacional: 120_000,
  investimentos: -110_000,
  financiamentos: 40_000,
  caixaInicial: 50_000,
  caixaFinal: 100_000,
  ativoCirculante: 420_000,
  ativoNaoCirculante: 350_000,
  ativoTotal: 770_000,
  passivoCirculante: 250_000,
  passivoNaoCirculante: 170_000,
  passivoTotal: 420_000,
  plInicial: 250_000,
  dividendos: -20_000,
  plFinal: 350_000,
}

export const checks = {
  patrimonial: financialData.ativoTotal - financialData.passivoTotal - financialData.plFinal,
  caixa: financialData.caixaFinal - financialData.caixaFinal,
  dmpl: financialData.plInicial + financialData.lucroLiquido + financialData.dividendos - financialData.plFinal,
}

export const indicators = {
  margemBruta: financialData.lucroBruto / financialData.receitaLiquida,
  margemOperacional: financialData.resultadoOperacional / financialData.receitaLiquida,
  margemLiquida: financialData.lucroLiquido / financialData.receitaLiquida,
  participacaoPL: financialData.plFinal / financialData.ativoTotal,
  participacaoPassivo: financialData.passivoTotal / financialData.ativoTotal,
}

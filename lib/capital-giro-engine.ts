import { monthlyBalance } from './monthly-data'

export type WorkingCapitalRow = {
  month: string
  contasReceber: number
  estoques: number
  outrosAtivosOperacionais: number
  fornecedores: number
  outrasObrigacoesOperacionais: number
  capitalCirculanteLiquido: number
  necessidadeCapitalGiro: number
  tesouraria: number
  diasReceber: number
  diasEstoque: number
  diasFornecedores: number
}

const receitaMensal = [63000,67500,72000,70200,73800,76500,79200,72000,81000,82800,76500,85500]
const custoMensal = receitaMensal.map(v => v * 0.5)

export const workingCapitalData: WorkingCapitalRow[] = monthlyBalance.map((b, i) => {
  const outrosAtivos = b.outrosAtivos
  const outrasObrigacoes = b.outrosPassivos
  const ativosOperacionais = b.contasReceber + b.estoques + outrosAtivos
  const passivosOperacionais = b.fornecedores + outrasObrigacoes
  const capitalCirculanteLiquido = b.ativoCirculante - b.passivoCirculante
  const necessidadeCapitalGiro = ativosOperacionais - passivosOperacionais
  const tesouraria = capitalCirculanteLiquido - necessidadeCapitalGiro
  const receita = receitaMensal[i]
  const custo = custoMensal[i]
  return { month: b.month, contasReceber: b.contasReceber, estoques: b.estoques, outrosAtivosOperacionais: outrosAtivos, fornecedores: b.fornecedores, outrasObrigacoesOperacionais: outrasObrigacoes, capitalCirculanteLiquido, necessidadeCapitalGiro, tesouraria, diasReceber: receita ? b.contasReceber / receita * 30 : 0, diasEstoque: custo ? b.estoques / custo * 30 : 0, diasFornecedores: custo ? b.fornecedores / custo * 30 : 0 }
})

export function workingCapitalDiagnosis(row: WorkingCapitalRow) {
  if (row.tesouraria < 0) return { status: 'ATENÇÃO', title: 'Tesouraria pressionada', detail: 'A necessidade de capital de giro supera os recursos de curto prazo disponíveis.' }
  if (row.necessidadeCapitalGiro > row.capitalCirculanteLiquido * 0.8) return { status: 'MONITORAR', title: 'Capital de giro elevado', detail: 'Grande parte do capital circulante está comprometida com a operação.' }
  return { status: 'SAUDÁVEL', title: 'Estrutura equilibrada', detail: 'O capital circulante suporta a necessidade operacional com folga.' }
}

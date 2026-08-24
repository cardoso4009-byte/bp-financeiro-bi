export type TipoLancamento = 'RECEITA' | 'OPEX' | 'CAPEX' | 'FINANCIAMENTO'
export type StatusLancamento = 'PAGO' | 'EM_ABERTO'

export type Lancamento = {
  id: string
  data: string
  tipo: TipoLancamento
  categoria: string
  centroCusto: string
  descricao: string
  competencia: string
  vencimento: string
  pagamento?: string
  valor: number
  status: StatusLancamento
}

export const STORAGE_KEY = 'bp-financeiro-lancamentos-v1'

export function readLancamentos(): Lancamento[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function writeLancamentos(items: Lancamento[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function totalBy(items: Lancamento[], tipo: TipoLancamento, competencia?: string) {
  return items.filter(x => x.tipo === tipo && (!competencia || x.competencia === competencia)).reduce((s, x) => s + x.valor, 0)
}

export function financialIntegration(items: Lancamento[]) {
  const receita = totalBy(items, 'RECEITA')
  const opex = totalBy(items, 'OPEX')
  const capex = totalBy(items, 'CAPEX')
  const financiamento = totalBy(items, 'FINANCIAMENTO')
  const receitasAbertas = items.filter(x => x.tipo === 'RECEITA' && x.status === 'EM_ABERTO').reduce((s, x) => s + x.valor, 0)
  const despesasAbertas = items.filter(x => x.tipo !== 'RECEITA' && x.status === 'EM_ABERTO').reduce((s, x) => s + x.valor, 0)
  const ebitda = receita - opex
  const caixaOperacional = receita - opex
  const variacaoCaixa = caixaOperacional - capex + financiamento
  return { receita, opex, capex, financiamento, receitasAbertas, despesasAbertas, ebitda, caixaOperacional, variacaoCaixa }
}

export const integrationRules = [
  'RECEITA em competência alimenta a DRE; recebimento alimenta a DFC.',
  'OPEX em competência alimenta a DRE; pagamento alimenta a DFC.',
  'CAPEX não reduz EBITDA; pagamento entra em investimento na DFC e aumenta o ativo imobilizado no BP.',
  'FINANCIAMENTO não compõe lucro; recebimento/pagamento entra em financiamento na DFC e altera o passivo.',
  'O caixa final deve conciliar com Caixa e Equivalentes no Balanço.',
]

import type { FinancialEntry } from './lancamentos-data'

export type IndicatorTone = 'normal' | 'attention' | 'critical' | 'info'
export type Indicator = { key: string; label: string; value: number; unit: 'currency' | 'percent' | 'days' | 'ratio'; tone: IndicatorTone; interpretation: string }

const absSum = (entries: FinancialEntry[], type: FinancialEntry['type'], status?: FinancialEntry['status']) =>
  entries.filter(e => e.type === type && (!status || e.status === status)).reduce((s, e) => s + Math.abs(e.value), 0)

const toneBy = (value: number, attention: number, critical: number, inverse = false): IndicatorTone => {
  if (inverse) return value <= critical ? 'critical' : value <= attention ? 'attention' : 'normal'
  return value >= critical ? 'critical' : value >= attention ? 'attention' : 'normal'
}

export function calculateFinancialIndicators(entries: FinancialEntry[]) {
  const revenue = absSum(entries, 'Receita')
  const opex = absSum(entries, 'Despesa')
  const capex = absSum(entries, 'CAPEX')
  const financing = entries.filter(e => e.type === 'Financiamento').reduce((s, e) => s + e.value, 0)
  const ebitda = revenue - opex
  const receivables = absSum(entries, 'Receita', 'Em aberto')
  const payables = absSum(entries, 'Despesa', 'Em aberto')
  const financingOpen = absSum(entries, 'Financiamento', 'Em aberto')
  const operatingOutflow = opex + capex + Math.abs(financing)
  const pmr = revenue ? receivables / revenue * 365 : 0
  const pmp = opex ? payables / opex * 365 : 0
  const cycle = pmr - pmp
  const netWorkingCapitalProxy = receivables - payables
  const cashGeneration = entries.filter(e => e.status === 'Pago').reduce((s, e) => s + e.value, 0)
  const coverage = operatingOutflow ? Math.max(cashGeneration, 0) / operatingOutflow : 0

  const indicators: Indicator[] = [
    { key: 'ebitdaMargin', label: 'Margem EBITDA gerencial', value: revenue ? ebitda / revenue : 0, unit: 'percent', tone: ebitda / Math.max(revenue, 1) < 0.05 ? 'critical' : ebitda / Math.max(revenue, 1) < 0.15 ? 'attention' : 'normal', interpretation: ebitda >= 0 ? 'A operação gera resultado antes de CAPEX e financiamento.' : 'A operação está consumindo margem; revisar estrutura de despesas e preço.' },
    { key: 'liquidityProxy', label: 'Liquidez operacional', value: payables ? receivables / payables : receivables > 0 ? 999 : 0, unit: 'ratio', tone: payables && receivables / payables < 1 ? 'critical' : payables && receivables / payables < 1.2 ? 'attention' : 'normal', interpretation: 'Proxy de cobertura das obrigações abertas por recebíveis abertos; não substitui a Liquidez Corrente do Balanço.' },
    { key: 'workingCapital', label: 'Capital de giro operacional', value: netWorkingCapitalProxy, unit: 'currency', tone: netWorkingCapitalProxy < 0 ? 'critical' : netWorkingCapitalProxy < revenue * 0.05 ? 'attention' : 'normal', interpretation: netWorkingCapitalProxy >= 0 ? 'Recebíveis abertos superam contas a pagar abertas na base atual.' : 'Contas a pagar abertas superam recebíveis; há pressão sobre o capital de giro.' },
    { key: 'pmr', label: 'PMR', value: pmr, unit: 'days', tone: toneBy(pmr, 45, 60), interpretation: pmr > 60 ? 'Prazo de recebimento elevado: priorizar cobrança e política comercial.' : pmr > 45 ? 'Prazo de recebimento merece atenção.' : 'Prazo de recebimento está controlado na base disponível.' },
    { key: 'pmp', label: 'PMP', value: pmp, unit: 'days', tone: pmp < 30 ? 'critical' : pmp < 45 ? 'attention' : 'normal', interpretation: pmp < 30 ? 'Prazo curto de pagamento pode pressionar o caixa.' : pmp < 45 ? 'Há espaço para avaliar negociação de prazos.' : 'Prazo de pagamento oferece maior folga financeira.' },
    { key: 'cycle', label: 'Ciclo financeiro', value: cycle, unit: 'days', tone: cycle > 45 ? 'critical' : cycle > 30 ? 'attention' : 'normal', interpretation: cycle > 45 ? 'Ciclo elevado: caixa fica comprometido por mais tempo.' : cycle > 30 ? 'Ciclo merece acompanhamento para reduzir capital empatado.' : 'Ciclo financeiro está relativamente controlado.' },
    { key: 'cashGeneration', label: 'Geração de caixa realizada', value: cashGeneration, unit: 'currency', tone: cashGeneration < 0 ? 'critical' : 'normal', interpretation: cashGeneration >= 0 ? 'Os lançamentos pagos geraram caixa líquido no período.' : 'Os lançamentos pagos consumiram caixa líquido no período.' },
    { key: 'cashCoverage', label: 'Cobertura de caixa', value: coverage, unit: 'ratio', tone: coverage < 0.5 ? 'critical' : coverage < 1 ? 'attention' : 'normal', interpretation: coverage < 1 ? 'A geração de caixa paga não cobre integralmente as saídas consideradas.' : 'A geração de caixa cobre as saídas consideradas na base atual.' },
  ]

  return { revenue, opex, capex, financing, ebitda, receivables, payables, financingOpen, pmr, pmp, cycle, netWorkingCapitalProxy, cashGeneration, coverage, indicators }
}

export function diagnosticSummary(data: ReturnType<typeof calculateFinancialIndicators>) {
  const critical = data.indicators.filter(i => i.tone === 'critical')
  const attention = data.indicators.filter(i => i.tone === 'attention')
  if (critical.length) return `Prioridade alta: ${critical.map(i => i.label).join(', ')}. Atue primeiro nos indicadores críticos para proteger liquidez e geração de caixa.`
  if (attention.length) return `Prioridade de acompanhamento: ${attention.map(i => i.label).join(', ')}. Há sinais de atenção, mas sem evidência de ruptura na base atual.`
  return 'Diagnóstico favorável na base disponível: os principais indicadores estão dentro dos parâmetros gerenciais definidos.'
}

import {financialCore, openingBalance} from './financial-core'

export type MonthlyFinancial={month:string;receitaBruta:number;deducoes:number;receitaLiquida:number;custos:number;lucroBruto:number;opex:number;ebitda:number;depreciacao:number;resultadoOperacional:number;resultadoFinanceiro:number;lucroLiquido:number;caixaOperacional:number;investimentos:number;financiamentos:number;caixaFinal:number}

const months=financialCore.map(m=>m.month)
let caixa=openingBalance.cash

export const monthlyData:MonthlyFinancial[]=financialCore.map((m,i)=>{
  const dre={receitaLiquida:m.revenue,custos:-m.cost,lucroBruto:m.revenue-m.cost,opex:-m.opex,ebitda:m.revenue-m.cost-m.opex,resultadoOperacional:m.revenue-m.cost-m.opex-m.depreciation,lucroLiquido:m.revenue-m.cost-m.opex-m.depreciation+m.financialResult+m.taxes}
  const caixaOperacional=m.cashIn-m.cashOut
  const investimentos=-m.capex
  const financiamentos=(i===0?m.debt-openingBalance.debt:m.debt-financialCore[i-1].debt)
  caixa+=caixaOperacional+investimentos+financiamentos
  return{month:m.month,receitaBruta:m.revenue/0.9,deducoes:m.revenue/0.9*-0.1,receitaLiquida:dre.receitaLiquida,custos:dre.custos,lucroBruto:dre.lucroBruto,opex:dre.opex,ebitda:dre.ebitda,depreciacao:m.depreciation,resultadoOperacional:dre.resultadoOperacional,resultadoFinanceiro:m.financialResult,lucroLiquido:dre.lucroLiquido,caixaOperacional,investimentos,financiamentos,caixaFinal:caixa}
})

export const budgetData=monthlyData.map((m,i)=>({month:m.month,receitaLiquida:Math.round(m.receitaLiquida*(i%3===0?.97:i%3===1?1.03:1)),lucroBruto:Math.round(m.lucroBruto*.98),resultadoOperacional:Math.round(m.resultadoOperacional*1.02),lucroLiquido:Math.round(m.lucroLiquido*1.02)}))

export type MonthlyBalance={month:string;ativoCirculante:number;caixa:number;contasReceber:number;estoques:number;outrosAtivos:number;ativoNaoCirculante:number;imobilizado:number;passivoCirculante:number;fornecedores:number;obrigacoes:number;outrosPassivos:number;passivoNaoCirculante:number;dividasLongoPrazo:number;pl:number;ativoTotal:number;passivoTotal:number}

let cumulativeProfit=0
export const monthlyBalance:MonthlyBalance[]=financialCore.map((m,i)=>{
  cumulativeProfit+=m.revenue-m.cost-m.opex-m.depreciation+m.financialResult+m.taxes
  const caixa=monthlyData[i].caixaFinal
  const contasReceber=m.accountsReceivable
  const estoques=m.inventory
  const imobilizado=m.fixedAssets
  const fornecedores=m.suppliers
  const obrigacoes=m.obligations
  const dividasLongoPrazo=m.debt
  const ativoCirculante=caixa+contasReceber+estoques
  const ativoNaoCirculante=imobilizado
  const ativoTotal=ativoCirculante+ativoNaoCirculante
  const passivoCirculante=fornecedores+obrigacoes
  const passivoNaoCirculante=dividasLongoPrazo
  const passivoTotal=passivoCirculante+passivoNaoCirculante
  const pl=openingBalance.equity+cumulativeProfit
  return{month:months[i],ativoCirculante,caixa,contasReceber,estoques,outrosAtivos:0,ativoNaoCirculante,imobilizado,passivoCirculante,fornecedores,obrigacoes,outrosPassivos:0,passivoNaoCirculante,dividasLongoPrazo,pl,ativoTotal,passivoTotal}
})

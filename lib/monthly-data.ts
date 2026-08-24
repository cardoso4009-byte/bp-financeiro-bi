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
const receitas=[70000,75000,80000,78000,82000,85000,88000,80000,90000,92000,85000,95000]
const deducoes=receitas.map(v=>-v*.10), custos=receitas.map(v=>-v*.50), opex=receitas.map(v=>-v*.19)
const financeiro=[-3000,-3000,-3000,-3000,-3000,-3000,-4000,-3000,-4000,-4000,-3000,-4000]
const impostos=[-3441,-3750,-4059,-3935,-4182,-4368,-4259,-4059,-4382,-4506,-4368,-4691]
const caixaOperacional=[8000,9000,10000,8000,10000,11000,12000,9000,11000,12000,10000,10000]
const investimentos=[-5000,-5000,-10000,-5000,-10000,-10000,-15000,-10000,-10000,-10000,-5000,-15000]
const financiamentos=[10000,0,0,0,20000,0,0,0,0,0,-20000,30000]
const depreciacoes=Array(12).fill(2500), months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
let caixa=50000
export const monthlyData:MonthlyFinancial[]=months.map((month,i)=>{const receitaLiquida=receitas[i]+deducoes[i],lucroBruto=receitaLiquida+custos[i],ebitda=lucroBruto+opex[i],resultadoOperacional=ebitda-depreciacoes[i],resultadoAntesIR=resultadoOperacional+financeiro[i],lucroLiquido=resultadoAntesIR+impostos[i];caixa+=caixaOperacional[i]+investimentos[i]+financiamentos[i];return{month,receitaBruta:receitas[i],deducoes:deducoes[i],receitaLiquida,custos:custos[i],lucroBruto,opex:opex[i],ebitda,depreciacao:depreciacoes[i],resultadoOperacional,resultadoFinanceiro:financeiro[i],lucroLiquido,caixaOperacional:caixaOperacional[i],investimentos:investimentos[i],financiamentos:financiamentos[i],caixaFinal:caixa}})
export const budgetData=monthlyData.map((m,i)=>({month:m.month,receitaLiquida:Math.round(m.receitaLiquida*(i%3===0?.97:i%3===1?1.03:1)),lucroBruto:Math.round(m.lucroBruto*.98),resultadoOperacional:Math.round(m.resultadoOperacional*1.02),lucroLiquido:Math.round(m.lucroLiquido*1.02)}))

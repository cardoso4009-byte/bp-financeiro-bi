import {financialCore,dreFromCore,type FinancialMonth} from './financial-core'

export type DRECoreMonth={
  month:string
  year:number
  revenue:number
  costs:number
  ebitda:number
  opex:number
  depreciation:number
  operatingResult:number
  financialResult:number
  taxes:number
  netIncome:number
}

const monthNumber=(month:string,index:number)=>{
  const match=month.match(/\d{1,2}$/)
  return match ? Number(match[0]) : index+1
}

export const dreCoreMonths:DRECoreMonth[]=financialCore.map((m:FinancialMonth)=>{
  const d=dreFromCore(m)
  const depreciation=Math.abs(d.depreciacao)
  return {
    month:m.month,
    year:m.year,
    revenue:d.receita,
    costs:m.cost,
    ebitda:d.ebitda,
    opex:m.opex,
    depreciation,
    operatingResult:d.ebitda-depreciation,
    financialResult:d.resultadoFinanceiro,
    taxes:d.impostos,
    netIncome:d.lucroLiquido,
  }
})

export const dreCoreByMonth=new Map(
  dreCoreMonths.map((item,i)=>[`${item.year}-${String(monthNumber(item.month,i)).padStart(2,'0')}`,item])
)

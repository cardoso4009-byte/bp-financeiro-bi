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

export const dreCoreMonths:DRECoreMonth[]=financialCore.map((m:FinancialMonth)=>{
  const d=dreFromCore(m)
  return {
    month:m.month,
    year:m.year,
    revenue:d.receita,
    costs:m.cost,
    ebitda:d.ebitda,
    opex:m.opex,
    depreciation:m.depreciation,
    operatingResult:d.ebitda-m.depreciation,
    financialResult:d.resultadoFinanceiro,
    taxes:d.impostos,
    netIncome:d.lucroLiquido,
  }
})

export const dreCoreByMonth=new Map(
  dreCoreMonths.map(item=>[`${item.year}-${String(dreCoreMonths.indexOf(item)+1).padStart(2,'0')}`,item])
)

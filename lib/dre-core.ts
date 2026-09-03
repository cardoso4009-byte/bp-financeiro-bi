import {financialCore,dreFromCore,type FinancialMonth} from './financial-core'

const MONTH_KEYS=['01','02','03','04','05','06','07','08','09','10','11','12']

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
  dreCoreMonths.map((item,i)=>[`2026-${MONTH_KEYS[i]}`,item])
)

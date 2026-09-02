export type FinancialMonth={month:string;year:number;revenue:number;cost:number;opex:number;capex:number;cashIn:number;cashOut:number;depreciation:number;financialResult:number;taxes:number;accountsReceivable:number;inventory:number;suppliers:number;obligations:number;debt:number;fixedAssets:number}

export type OpeningBalance={cash:number;accountsReceivable:number;inventory:number;fixedAssets:number;suppliers:number;obligations:number;debt:number;equity:number}

export const openingBalance:OpeningBalance={cash:50000,accountsReceivable:48000,inventory:29000,fixedAssets:167500,suppliers:78000,obligations:38000,debt:80000,equity:98500}

const gross=[70000,75000,80000,78000,82000,85000,88000,80000,90000,92000,85000,95000]
const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const capex=[5000,5000,10000,5000,10000,10000,15000,10000,10000,10000,5000,15000]
const depreciation=Array(12).fill(2500)
const financialResult=[-3000,-3000,-3000,-3000,-3000,-3000,-4000,-3000,-4000,-4000,-3000,-4000]
const taxes=[-3441,-3750,-4059,-3935,-4182,-4368,-4259,-4059,-4382,-4506,-4368,-4691]
const accountsReceivable=[50000,52000,55000,57000,60000,62000,65000,66000,70000,73000,70000,78000]
const inventory=[30000,32000,33000,31000,34000,36000,39000,38000,40000,43000,42000,45000]
const suppliers=[80000,82000,85000,83000,90000,94000,100000,98000,108000,115000,112000,125000]
const obligations=[40000,42000,43000,45000,47000,49000,52000,51000,54000,57000,55000,60000]
const financing=[10000,0,0,0,20000,0,0,0,0,0,-20000,30000]

const debt=months.map((_,i)=>openingBalance.debt+financing.slice(0,i+1).reduce((s,v)=>s+v,0))
const fixedAssets=months.map((_,i)=>openingBalance.fixedAssets+capex.slice(0,i+1).reduce((s,v)=>s+v,0)-depreciation.slice(0,i+1).reduce((s,v)=>s+v,0))

const netIncome=(i:number)=>gross[i]*.9-gross[i]*.5-gross[i]*.19-depreciation[i]+financialResult[i]+taxes[i]
const operatingCashIn=months.map((_,i)=>gross[i]*.9-(accountsReceivable[i]-(i===0?openingBalance.accountsReceivable:accountsReceivable[i-1])))
const operatingCashOut=months.map((_,i)=>{
  const previousInventory=i===0?openingBalance.inventory:inventory[i-1]
  const previousSuppliers=i===0?openingBalance.suppliers:suppliers[i-1]
  const previousObligations=i===0?openingBalance.obligations:obligations[i-1]
  const deltaInventory=inventory[i]-previousInventory
  const deltaSuppliers=suppliers[i]-previousSuppliers
  const deltaObligations=obligations[i]-previousObligations
  const cashOperating=netIncome(i)+depreciation[i]-(accountsReceivable[i]-(i===0?openingBalance.accountsReceivable:accountsReceivable[i-1]))-deltaInventory+deltaSuppliers+deltaObligations
  return operatingCashIn[i]-cashOperating
})

export const financialCore:FinancialMonth[]=months.map((month,i)=>({month,year:2026,revenue:gross[i]*.9,cost:gross[i]*.5,opex:gross[i]*.19,capex:capex[i],cashIn:operatingCashIn[i],cashOut:operatingCashOut[i],depreciation:depreciation[i],financialResult:financialResult[i],taxes:taxes[i],accountsReceivable:accountsReceivable[i],inventory:inventory[i],suppliers:suppliers[i],obligations:obligations[i],debt:debt[i],fixedAssets:fixedAssets[i]}))

export const dreFromCore=(m:FinancialMonth)=>({receita:m.revenue,custos:-m.cost,opex:-m.opex,lucroBruto:m.revenue-m.cost,ebitda:m.revenue-m.cost-m.opex,depreciacao:-m.depreciation,resultadoFinanceiro:m.financialResult,impostos:m.taxes,lucroLiquido:m.revenue-m.cost-m.opex-m.depreciation+m.financialResult+m.taxes})
export const cashFromCore=(m:FinancialMonth)=>({entradas:m.cashIn,saidas:-m.cashOut,capex:-m.capex,financiamento:0,variacao:m.cashIn-m.cashOut-m.capex})
export const financingFromCore=(m:FinancialMonth)=>m.debt

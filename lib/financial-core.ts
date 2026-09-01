export type FinancialMonth={month:string;year:number;revenue:number;cost:number;opex:number;capex:number;cashIn:number;cashOut:number}
const gross=[70000,75000,80000,78000,82000,85000,88000,80000,90000,92000,85000,95000]
const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const capex=[5000,5000,10000,5000,10000,10000,15000,10000,10000,10000,5000,15000]
// Entradas/saídas operacionais são a fonte única do caixa gerencial.
// O financiamento permanece separado no monthly-data para que DFC e saldo de caixa
// sejam reconciliados sem dupla contagem.
const operatingCashIn=[20000,55500,69500,55000,47700,66800,77500,56700,75500,71800,78500,57000]
const operatingCashOut=[45000,45500,52500,54000,50700,51800,54500,52700,55500,55800,59500,59000]
export const financialCore:FinancialMonth[]=months.map((month,i)=>({month,year:2026,revenue:gross[i]*.9,cost:gross[i]*.5,opex:gross[i]*.19,capex:capex[i],cashIn:operatingCashIn[i],cashOut:operatingCashOut[i]}))
export const dreFromCore=(m:FinancialMonth)=>({receita:m.revenue,custos:-m.cost,opex:-m.opex,lucroBruto:m.revenue-m.cost,ebitda:m.revenue-m.cost-m.opex})
export const cashFromCore=(m:FinancialMonth)=>({entradas:m.cashIn,saidas:-m.cashOut,capex:-m.capex,variacao:m.cashIn-m.cashOut-m.capex})

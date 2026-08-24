export type FinancialMonth={month:string;year:number;revenue:number;cost:number;opex:number;capex:number;cashIn:number;cashOut:number}
const gross=[70000,75000,80000,78000,82000,85000,88000,80000,90000,92000,85000,95000]
const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const capex=[5000,5000,10000,5000,10000,10000,15000,10000,10000,10000,5000,15000]
const cashIn=[8000,9000,10000,8000,10000,11000,12000,9000,11000,12000,10000,10000]
const cashOut=[0,0,0,0,0,0,0,0,0,0,0,0]
export const financialCore:FinancialMonth[]=months.map((month,i)=>({month,year:2026,revenue:gross[i]*.9,cost:gross[i]*.5,opex:gross[i]*.19,capex:capex[i],cashIn:cashIn[i],cashOut:cashOut[i]}))
export const dreFromCore=(m:FinancialMonth)=>({receita:m.revenue,custos:-m.cost,opex:-m.opex,lucroBruto:m.revenue-m.cost,ebitda:m.revenue-m.cost-m.opex})
export const cashFromCore=(m:FinancialMonth)=>({entradas:m.cashIn,saidas:m.cashOut,capex:m.capex,variacao:m.cashIn-m.cashOut-m.capex})

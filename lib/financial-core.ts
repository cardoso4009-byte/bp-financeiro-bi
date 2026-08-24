export type FinancialMonth={month:string;year:number;revenue:number;cost:number;opex:number;capex:number;cashIn:number;cashOut:number}
export const financialCore:FinancialMonth[]=[
 {month:'Jan',year:2026,revenue:63000,cost:25000,opex:15000,capex:5000,cashIn:63000,cashOut:45000},
 {month:'Fev',year:2026,revenue:67500,cost:27000,opex:15500,capex:3000,cashIn:67500,cashOut:45500},
 {month:'Mar',year:2026,revenue:72000,cost:28500,opex:16000,capex:8000,cashIn:72000,cashOut:52500},
 {month:'Abr',year:2026,revenue:70200,cost:27800,opex:16200,capex:10000,cashIn:70200,cashOut:54000},
 {month:'Mai',year:2026,revenue:73800,cost:29200,opex:16500,capex:5000,cashIn:73800,cashOut:50700},
 {month:'Jun',year:2026,revenue:76500,cost:30000,opex:16800,capex:5000,cashIn:76500,cashOut:51800},
 {month:'Jul',year:2026,revenue:79200,cost:30500,opex:17000,capex:7000,cashIn:79200,cashOut:54500},
 {month:'Ago',year:2026,revenue:81000,cost:31500,opex:17200,capex:4000,cashIn:81000,cashOut:52700},
 {month:'Set',year:2026,revenue:82800,cost:32000,opex:17500,capex:6000,cashIn:82800,cashOut:55500},
 {month:'Out',year:2026,revenue:85000,cost:33000,opex:17800,capex:5000,cashIn:85000,cashOut:55800},
 {month:'Nov',year:2026,revenue:87000,cost:33500,opex:18000,capex:8000,cashIn:87000,cashOut:59500},
 {month:'Dez',year:2026,revenue:90000,cost:34500,opex:18500,capex:6000,cashIn:90000,cashOut:59000}
]
export const dreFromCore=(m:FinancialMonth)=>({receita:m.revenue,custos:m.cost,opex:m.opex,ebitda:m.revenue-m.cost-m.opex})
export const cashFromCore=(m:FinancialMonth)=>({entradas:m.cashIn,saidas:m.cashOut,capex:m.capex,variacao:m.cashIn-m.cashOut-m.capex})

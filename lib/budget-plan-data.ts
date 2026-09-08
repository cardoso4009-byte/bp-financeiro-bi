export type BudgetPlan = {
  month: string
  revenue: number
  cost: number
  opex: number
  capex: number
}

export const initialBudget: BudgetPlan[] = [
  { month:'Jan', revenue:20000, cost:0, opex:8000, capex:15000 },
  { month:'Fev', revenue:18000, cost:0, opex:12000, capex:0 },
  { month:'Mar', revenue:22000, cost:6000, opex:9000, capex:0 },
  { month:'Abr', revenue:24000, cost:6500, opex:9000, capex:5000 },
  { month:'Mai', revenue:26000, cost:7000, opex:9500, capex:0 },
  { month:'Jun', revenue:28000, cost:7500, opex:10000, capex:0 },
  { month:'Jul', revenue:30000, cost:8000, opex:10000, capex:8000 },
  { month:'Ago', revenue:31000, cost:8200, opex:10500, capex:0 },
  { month:'Set', revenue:32000, cost:8500, opex:10500, capex:0 },
  { month:'Out', revenue:34000, cost:9000, opex:11000, capex:4000 },
  { month:'Nov', revenue:36000, cost:9500, opex:11500, capex:0 },
  { month:'Dez', revenue:40000, cost:10000, opex:12000, capex:10000 },
]

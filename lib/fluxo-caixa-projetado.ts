export type Scenario = 'base' | 'otimista' | 'pessimista'
export type CashForecastRow = { month:string; opening:number; inflows:number; operatingOutflows:number; capex:number; financing:number; net:number; closing:number; minimum:number }

const months=['Set','Out','Nov','Dez','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago']
const baseInflows=[90000,93000,88000,100000,95000,98000,102000,99000,105000,108000,104000,110000]
const baseOutflows=[72000,74000,73000,78000,76000,78000,80000,79000,82000,84000,81000,85000]
const capex=[5000,3000,8000,10000,5000,5000,7000,4000,6000,5000,8000,6000]
const financing=[0,0,20000,0,0,0,0,10000,0,0,-10000,0]
const factors:Record<Scenario,number>={base:1,otimista:1.08,pessimista:0.92}

export function buildCashForecast(scenario:Scenario='base',initialCash=50000):CashForecastRow[]{
 let closing=initialCash
 const f=factors[scenario]
 return months.map((month,i)=>{const inflows=baseInflows[i]*f;const operatingOutflows=baseOutflows[i]*(scenario==='pessimista'?1.04:scenario==='otimista'?.98:1);const net=inflows-operatingOutflows-capex[i]+financing[i];const opening=closing;closing=opening+net;return{month,opening,inflows,operatingOutflows,capex:capex[i],financing:financing[i],net,closing,minimum:30000}})
}

export function forecastStatus(rows:CashForecastRow[]){const min=Math.min(...rows.map(r=>r.closing));if(min<0)return{status:'CRÍTICO',title:'Risco de falta de caixa',detail:'O saldo projetado fica negativo em pelo menos um período.'};if(min<rows[0].minimum)return{status:'ATENÇÃO',title:'Caixa abaixo do mínimo',detail:'A projeção indica pressão de liquidez e exige ação preventiva.'};return{status:'SAUDÁVEL',title:'Caixa projetado dentro do limite',detail:'O saldo permanece acima do caixa mínimo definido.'}}

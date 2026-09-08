import type { FinancialEntry } from './lancamentos-data'
import { monthlyData, monthlyBalance } from './monthly-data'

export type IndicatorTone = 'normal' | 'attention' | 'critical' | 'info'
export type Indicator = { key:string; label:string; value:number; unit:'currency'|'percent'|'days'|'ratio'; tone:IndicatorTone; interpretation:string }
export type AccountingIndicatorSnapshot = {
  month:string; currentRatio:number; quickRatio:number; netMargin:number; roe:number; roic:number; debtRatio:number; equityParticipation:number; fixedAssetToEquity:number; workingCapital:number; ncg:number; cashConversionCycle:number
}

const absSum=(entries:FinancialEntry[],type:FinancialEntry['type'],status?:FinancialEntry['status'])=>entries.filter(e=>e.type===type&&(!status||e.status===status)).reduce((s,e)=>s+Math.abs(e.value),0)
const tone=(v:number, attention:number, critical:number, inverse=false):IndicatorTone=>inverse?(v<=critical?'critical':v<=attention?'attention':'normal'):(v>=critical?'critical':v>=attention?'attention':'normal')

export function calculateAccountingIndicators(index=monthlyBalance.length-1):AccountingIndicatorSnapshot{
 const b=monthlyBalance[Math.max(0,Math.min(index,monthlyBalance.length-1))]
 const d=monthlyData[Math.max(0,Math.min(index,monthlyData.length-1))]
 const currentRatio=b.passivoCirculante?b.ativoCirculante/b.passivoCirculante:0
 const quickRatio=b.passivoCirculante?(b.ativoCirculante-b.estoques)/b.passivoCirculante:0
 const netMargin=d.receitaLiquida?d.lucroLiquido/d.receitaLiquida:0
 const roe=b.pl?d.lucroLiquido/b.pl:0
 const investedCapital=b.pl+b.passivoNaoCirculante
 const nopat=d.resultadoOperacional
 const roic=investedCapital?nopat/investedCapital:0
 const debtRatio=b.ativoTotal?b.passivoTotal/b.ativoTotal:0
 const equityParticipation=b.ativoTotal?b.pl/b.ativoTotal:0
 const fixedAssetToEquity=b.pl?b.ativoNaoCirculante/b.pl:0
 const workingCapital=b.ativoCirculante-b.passivoCirculante
 const ncg=(b.contasReceber+b.estoques)-(b.fornecedores+b.obrigacoes)
 const pmr=d.receitaLiquida?b.contasReceber/d.receitaLiquida*30:0
 const pmp=(d.custos+d.opex)?(b.fornecedores+b.obrigacoes)/(d.custos+d.opex)*30:0
 return {month:b.month,currentRatio,quickRatio,netMargin,roe,roic,debtRatio,equityParticipation,fixedAssetToEquity,workingCapital,ncg,cashConversionCycle:pmr-pmp}
}

export function calculateFinancialIndicators(entries:FinancialEntry[]){
 const revenue=absSum(entries,'Receita'), opex=absSum(entries,'Despesa'), capex=absSum(entries,'CAPEX')
 const financing=entries.filter(e=>e.type==='Financiamento').reduce((s,e)=>s+e.value,0)
 const ebitda=revenue-opex, receivables=absSum(entries,'Receita','Em aberto'), payables=absSum(entries,'Despesa','Em aberto'), financingOpen=absSum(entries,'Financiamento','Em aberto')
 const operatingOutflow=opex+capex+Math.abs(financing), pmr=revenue?receivables/revenue*365:0, pmp=opex?payables/opex*365:0, cycle=pmr-pmp
 const netWorkingCapitalProxy=receivables-payables, cashGeneration=entries.filter(e=>e.status==='Pago').reduce((s,e)=>s+e.value,0), coverage=operatingOutflow?Math.max(cashGeneration,0)/operatingOutflow:0
 const indicators:Indicator[]=[
  {key:'ebitdaMargin',label:'Margem EBITDA gerencial',value:revenue?ebitda/revenue:0,unit:'percent',tone:ebitda/Math.max(revenue,1)<.05?'critical':ebitda/Math.max(revenue,1)<.15?'attention':'normal',interpretation:ebitda>=0?'A operação gera resultado antes de CAPEX e financiamento.':'A operação está consumindo margem; revisar despesas e preço.'},
  {key:'liquidityProxy',label:'Liquidez operacional',value:payables?receivables/payables:receivables>0?999:0,unit:'ratio',tone:payables&&receivables/payables<1?'critical':payables&&receivables/payables<1.2?'attention':'normal',interpretation:'Proxy operacional; não substitui a Liquidez Corrente patrimonial.'},
  {key:'workingCapital',label:'Capital de giro operacional',value:netWorkingCapitalProxy,unit:'currency',tone:netWorkingCapitalProxy<0?'critical':netWorkingCapitalProxy<revenue*.05?'attention':'normal',interpretation:'Recebíveis abertos menos contas a pagar abertas.'},
  {key:'pmr',label:'PMR',value:pmr,unit:'days',tone:tone(pmr,45,60),interpretation:pmr>60?'Prazo elevado: priorizar cobrança.':pmr>45?'Prazo merece atenção.':'Prazo controlado.'},
  {key:'pmp',label:'PMP',value:pmp,unit:'days',tone:pmp<30?'critical':pmp<45?'attention':'normal',interpretation:pmp<30?'Prazo curto pode pressionar caixa.':pmp<45?'Avaliar negociação de prazos.':'Prazo oferece folga financeira.'},
  {key:'cycle',label:'Ciclo financeiro',value:cycle,unit:'days',tone:cycle>45?'critical':cycle>30?'attention':'normal',interpretation:cycle>45?'Ciclo elevado.':cycle>30?'Ciclo merece acompanhamento.':'Ciclo controlado.'},
  {key:'cashGeneration',label:'Geração de caixa realizada',value:cashGeneration,unit:'currency',tone:cashGeneration<0?'critical':'normal',interpretation:cashGeneration>=0?'Lançamentos pagos geraram caixa líquido.':'Lançamentos pagos consumiram caixa.'},
  {key:'cashCoverage',label:'Cobertura de caixa',value:coverage,unit:'ratio',tone:coverage<.5?'critical':coverage<1?'attention':'normal',interpretation:coverage<1?'Geração paga não cobre integralmente as saídas.':'Geração cobre as saídas consideradas.'}
 ]
 return {revenue,opex,capex,financing,ebitda,receivables,payables,financingOpen,pmr,pmp,cycle,netWorkingCapitalProxy,cashGeneration,coverage,indicators}
}

export function buildAccountingIndicatorCards(index=monthlyBalance.length-1){
 const s=calculateAccountingIndicators(index)
 const cards:Indicator[]=[
  {key:'currentRatio',label:'Liquidez Corrente',value:s.currentRatio,unit:'ratio',tone:s.currentRatio<1?'critical':s.currentRatio<1.2?'attention':'normal',interpretation:s.currentRatio<1?'Ativo circulante não cobre o passivo circulante.':s.currentRatio<1.5?'Liquidez positiva, mas com margem de segurança moderada.':'Boa capacidade de cobertura das obrigações de curto prazo.'},
  {key:'quickRatio',label:'Liquidez Seca',value:s.quickRatio,unit:'ratio',tone:s.quickRatio<.8?'critical':s.quickRatio<1?'attention':'normal',interpretation:s.quickRatio<.8?'Dependência elevada de estoques para honrar curto prazo.':s.quickRatio<1?'Liquidez ajustada merece acompanhamento.':'Ativos de maior liquidez cobrem as obrigações de curto prazo.'},
  {key:'netMargin',label:'Margem Líquida',value:s.netMargin,unit:'percent',tone:s.netMargin<0?'critical':s.netMargin<.05?'attention':'normal',interpretation:s.netMargin<0?'Operação destrói resultado líquido.':s.netMargin<.05?'Margem líquida estreita.':'Resultado líquido preserva margem.'},
  {key:'roe',label:'ROE',value:s.roe,unit:'percent',tone:s.roe<0?'critical':s.roe<.1?'attention':'normal',interpretation:s.roe<0?'Patrimônio está sendo remunerado negativamente.':s.roe<.1?'Retorno sobre o PL merece acompanhamento.':'Boa remuneração do patrimônio na base atual.'},
  {key:'roic',label:'ROIC',value:s.roic,unit:'percent',tone:s.roic<0?'critical':s.roic<.1?'attention':'normal',interpretation:s.roic<0?'Capital investido não gera retorno operacional positivo.':s.roic<.1?'Retorno operacional sobre capital investido é moderado.':'Retorno operacional sobre capital investido é positivo.'},
  {key:'debtRatio',label:'Endividamento',value:s.debtRatio,unit:'percent',tone:s.debtRatio>.7?'critical':s.debtRatio>.5?'attention':'normal',interpretation:s.debtRatio>.7?'Estrutura com alta dependência de capital de terceiros.':s.debtRatio>.5?'Endividamento merece acompanhamento.':'Estrutura de capital relativamente equilibrada.'},
  {key:'fixedAssetToEquity',label:'Imobilização do PL',value:s.fixedAssetToEquity,unit:'percent',tone:s.fixedAssetToEquity>1?'critical':s.fixedAssetToEquity>.7?'attention':'normal',interpretation:s.fixedAssetToEquity>1?'Imobilizado supera o patrimônio líquido.':s.fixedAssetToEquity>.7?'Parcela relevante do PL está imobilizada.':'Imobilização do PL está controlada.'},
  {key:'workingCapital',label:'Capital de Giro Líquido',value:s.workingCapital,unit:'currency',tone:s.workingCapital<0?'critical':'normal',interpretation:s.workingCapital<0?'Capital de giro líquido negativo.':'Capital de giro líquido positivo.'},
  {key:'ncg',label:'Necessidade de Capital de Giro',value:s.ncg,unit:'currency',tone:s.ncg>0?'attention':'normal',interpretation:s.ncg>0?'A operação demanda recursos para financiar o ciclo.':'A operação não apresenta NCG positiva na posição atual.'},
  {key:'cashConversionCycle',label:'Ciclo Financeiro Patrimonial',value:s.cashConversionCycle,unit:'days',tone:s.cashConversionCycle>45?'critical':s.cashConversionCycle>30?'attention':'normal',interpretation:s.cashConversionCycle>45?'Capital permanece empatado por prazo elevado.':s.cashConversionCycle>30?'Ciclo merece redução.':'Ciclo relativamente controlado.'}
 ]
 return {snapshot:s,cards}
}

export function diagnosticSummary(data:ReturnType<typeof calculateFinancialIndicators>, accounting?:ReturnType<typeof buildAccountingIndicatorCards>){
 const all=[...data.indicators,...(accounting?.cards||[])], critical=all.filter(i=>i.tone==='critical'), attention=all.filter(i=>i.tone==='attention')
 if(critical.length)return `Prioridade alta: ${critical.slice(0,4).map(i=>i.label).join(', ')}. Atue primeiro nos indicadores críticos para proteger liquidez, rentabilidade e capital de giro.`
 if(attention.length)return `Prioridade de acompanhamento: ${attention.slice(0,4).map(i=>i.label).join(', ')}. Há sinais de atenção sem evidência de ruptura na base atual.`
 return 'Diagnóstico favorável na base disponível: os principais indicadores estão dentro dos parâmetros gerenciais definidos.'
}

'use client'

import { useMemo } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import { calculateFinancialIndicators, diagnosticSummary, type IndicatorTone } from '@/lib/financial-indicators'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`
const num=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:1})
const ratio=(n:number)=>n>=999?'∞':`${n.toFixed(2).replace('.',',')}x`
const fmt=(n:number,u:string)=>u==='currency'?brl(n):u==='percent'?pct(n):u==='days'?`${num(n)} dias`:ratio(n)

export default function IndicadoresPage(){
 const source=useMemo(()=>readFinancialSource(),[])
 const data=useMemo(()=>calculateFinancialIndicators(source.entries),[source.entries])
 const months=useMemo(()=>Array.from(new Set(source.entries.map(e=>e.competence))).sort(),[source.entries])
 const margin=data.revenue?data.ebitda/data.revenue:0
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Indicadores & Diagnóstico</h1><p>Dados → Indicadores → Diagnóstico → Recomendação → Decisão</p></div><div className="period">{months.length?`${months[0]} a ${months[months.length-1]}`:'Sem dados'}</div></header>
  {source.errors.length>0&&<div className="panel" style={{marginBottom:16}}><strong>Atenção à base:</strong> {source.errors.join(' ')}</div>}
  <section className="panel wide" style={{marginBottom:18}}><div className="panel-title"><h2>Diagnóstico executivo</h2><span>Leitura automática</span></div><div className="note"><strong>{diagnosticSummary(data)}</strong><p style={{marginBottom:0}}>A análise usa os lançamentos persistidos. Liquidez Corrente, Liquidez Seca, Margem Líquida, ROE e ROIC dependem da integração patrimonial/contábil e não são estimados artificialmente.</p></div></section>
  <div className="indicator-grid">
   <Metric title="Receita" value={brl(data.revenue)} detail="Base do período"/>
   <Metric title="EBITDA gerencial" value={brl(data.ebitda)} detail="Receita − OPEX" tone={data.ebitda<0?'critical':'normal'}/>
   <Metric title="Margem EBITDA" value={pct(margin)} detail="EBITDA ÷ receita" tone={margin<0.05?'critical':margin<0.15?'attention':'normal'}/>
   <Metric title="Liquidez operacional" value={ratio(data.payables?data.receivables/data.payables:0)} detail="Recebíveis ÷ obrigações abertas" tone={data.payables&&data.receivables/data.payables<1?'critical':data.payables&&data.receivables/data.payables<1.2?'attention':'normal'}/>
   <Metric title="Capital de giro" value={brl(data.netWorkingCapitalProxy)} detail="Recebíveis − contas a pagar" tone={data.netWorkingCapitalProxy<0?'critical':'normal'}/>
   <Metric title="PMR" value={`${num(data.pmr)} dias`} detail="Prazo médio de recebimento" tone={data.pmr>60?'critical':data.pmr>45?'attention':'normal'}/>
   <Metric title="PMP" value={`${num(data.pmp)} dias`} detail="Prazo médio de pagamento" tone={data.pmp<30?'critical':data.pmp<45?'attention':'normal'}/>
   <Metric title="Ciclo financeiro" value={`${num(data.cycle)} dias`} detail="PMR − PMP" tone={data.cycle>45?'critical':data.cycle>30?'attention':'normal'}/>
   <Metric title="Geração de caixa" value={brl(data.cashGeneration)} detail="Lançamentos pagos" tone={data.cashGeneration<0?'critical':'normal'}/>
   <Metric title="Cobertura de caixa" value={ratio(data.coverage)} detail="Geração ÷ saídas" tone={data.coverage<0.5?'critical':data.coverage<1?'attention':'normal'}/>
  </div>
  <div className="grid">
   <section className="panel"><div className="panel-title"><h2>Capital de Giro & Liquidez</h2><span>Base operacional</span></div><div className="rows"><Row label="Contas a receber em aberto" value={data.receivables}/><Row label="Contas a pagar em aberto" value={data.payables}/><Row label="Financiamentos em aberto" value={data.financingOpen}/><Row label="Capital de giro operacional" value={data.netWorkingCapitalProxy}/><Row label="PMR" value={data.pmr} currency={false} suffix=" dias"/><Row label="PMP" value={data.pmp} currency={false} suffix=" dias"/><Row label="Ciclo financeiro" value={data.cycle} currency={false} suffix=" dias"/></div></section>
   <section className="panel"><div className="panel-title"><h2>Plano de ação</h2><span>Prioridades gerenciais</span></div><div className="rows"><Action title="Recebimentos" text={data.pmr>45?'Reduzir PMR: priorizar cobrança e negociação de entrada.':'Manter disciplina de cobrança e acompanhamento do PMR.'}/><Action title="Fornecedores" text={data.pmp<45?'Avaliar extensão de prazos sem prejudicar a operação.':'Preservar os prazos negociados e evitar concentração de vencimentos.'}/><Action title="OPEX" text={margin<0.15?'Revisar despesas e desvios do orçamento para recuperar margem.':'Manter controle de OPEX e orçamento × realizado.'}/><Action title="Caixa" text={data.coverage<1?'Proteger liquidez: priorizar recebimentos e revisar saídas discricionárias.':'Preservar geração de caixa e manter colchão de liquidez.'}/></div></section>
  </div>
  <section className="panel wide"><div className="panel-title"><h2>Mapa de indicadores</h2><span>{data.indicators.length} indicadores calculados</span></div><div className="rows">{data.indicators.map(i=><div className="row" key={i.key}><span><b>{i.label}</b><small style={{display:'block',opacity:.7}}>{i.interpretation}</small></span><b className={`tone-${i.tone}`}>{fmt(i.value,i.unit)}</b></div>)}</div></section>
  <section className="panel wide"><div className="panel-title"><h2>Indicadores contábeis pendentes</h2><span>Próxima integração</span></div><div className="grid"><Insight title="Liquidez Corrente" text="Ativo Circulante ÷ Passivo Circulante, diretamente do Balanço Patrimonial."/><Insight title="Liquidez Seca" text="(Ativo Circulante − Estoques) ÷ Passivo Circulante."/><Insight title="Margem Líquida" text="Lucro Líquido ÷ Receita, após integração do resultado contábil."/><Insight title="ROE / ROIC" text="Retorno sobre patrimônio e capital investido após integração patrimonial."/></div></section>
 </main>
}
function Metric({title,value,detail,tone='normal'}:{title:string;value:string;detail:string;tone?:IndicatorTone}){return <div className={`indicator indicator-${tone}`}><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>}
function Row({label,value,currency=true,suffix=''}:{label:string;value:number;currency?:boolean;suffix?:string}){return <div className="row"><span>{label}</span><b>{currency?brl(value):`${num(value)}${suffix}`}</b></div>}
function Action({title,text}:{title:string;text:string}){return <div className="row"><span><b>{title}</b><small style={{display:'block',opacity:.75}}>{text}</small></span><b>→</b></div>}
function Insight({title,text}:{title:string;text:string}){return <div className="note"><strong>{title}</strong><p>{text}</p></div>}

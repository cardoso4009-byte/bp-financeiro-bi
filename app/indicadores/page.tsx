'use client'

import {useMemo,useState} from 'react'
import {readFinancialSource} from '@/lib/financial-source'
import {calculateFinancialIndicators,buildAccountingIndicatorCards,diagnosticSummary,type IndicatorTone} from '@/lib/financial-indicators'
import {monthlyBalance} from '@/lib/monthly-data'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`
const num=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:1})
const ratio=(n:number)=>`${n.toFixed(2).replace('.',',')}x`
const fmt=(n:number,u:string)=>u==='currency'?brl(n):u==='percent'?pct(n):u==='days'?`${num(n)} dias`:ratio(n)
const months=monthlyBalance.map((m,i)=>({key:String(i),label:`${m.month}/2026`}))

export default function IndicadoresPage(){
 const[sourceMonth,setSourceMonth]=useState(String(monthlyBalance.length-1))
 const source=useMemo(()=>readFinancialSource(),[])
 const data=useMemo(()=>calculateFinancialIndicators(source.entries),[source.entries])
 const accounting=useMemo(()=>buildAccountingIndicatorCards(Number(sourceMonth)),[sourceMonth])
 const margin=data.revenue?data.ebitda/data.revenue:0
 const critical=accounting.cards.filter(i=>i.tone==='critical').length+data.indicators.filter(i=>i.tone==='critical').length
 const attention=accounting.cards.filter(i=>i.tone==='attention').length+data.indicators.filter(i=>i.tone==='attention').length
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Indicadores & Diagnóstico</h1><p>DRE + Balanço + Caixa → Indicadores → Diagnóstico → Decisão</p></div><div style={{display:'grid',gap:6,justifyItems:'end'}}><span style={{fontSize:10,color:'#718098'}}>DATA-BASE PATRIMONIAL</span><select value={sourceMonth} onChange={e=>setSourceMonth(e.target.value)}>{months.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}</select></div></header>
  {source.errors.length>0&&<div className="panel" style={{marginBottom:16}}><strong>Atenção à base:</strong> {source.errors.join(' ')}</div>}
  <section className="panel wide" style={{marginBottom:18}}><div className="panel-title"><h2>Diagnóstico executivo</h2><span>{critical} críticos • {attention} em atenção</span></div><div className="note"><strong>{diagnosticSummary(data,accounting)}</strong><p style={{marginBottom:0}}>Os indicadores patrimoniais abaixo vêm do mesmo Balanço Gerencial e DRE mensal utilizados nas demonstrações. Não há valores estimados para preencher lacunas.</p></div></section>
  <section className="panel wide" style={{marginBottom:18}}><div className="panel-title"><div><h2>Indicadores patrimoniais & rentabilidade</h2><span>Data-base: {accounting.snapshot.month}/2026</span></div><span>{accounting.cards.length} indicadores</span></div><div className="indicator-grid">{accounting.cards.map(i=><Metric key={i.key} title={i.label} value={fmt(i.value,i.unit)} detail={i.interpretation} tone={i.tone}/>)}</div></section>
  <section className="panel wide" style={{marginBottom:18}}><div className="panel-title"><h2>Indicadores gerenciais de caixa</h2><span>Base de lançamentos persistidos</span></div><div className="indicator-grid">
   <Metric title="Receita" value={brl(data.revenue)} detail="Base do período"/>
   <Metric title="EBITDA gerencial" value={brl(data.ebitda)} detail="Receita − OPEX" tone={data.ebitda<0?'critical':'normal'}/>
   <Metric title="Margem EBITDA" value={pct(margin)} detail="EBITDA ÷ receita" tone={margin<.05?'critical':margin<.15?'attention':'normal'}/>
   <Metric title="Liquidez operacional" value={ratio(data.payables?data.receivables/data.payables:0)} detail="Recebíveis ÷ obrigações abertas" tone={data.payables&&data.receivables/data.payables<1?'critical':data.payables&&data.receivables/data.payables<1.2?'attention':'normal'}/>
   <Metric title="Capital de giro operacional" value={brl(data.netWorkingCapitalProxy)} detail="Recebíveis − contas a pagar" tone={data.netWorkingCapitalProxy<0?'critical':'normal'}/>
   <Metric title="PMR" value={`${num(data.pmr)} dias`} detail="Prazo médio de recebimento" tone={data.pmr>60?'critical':data.pmr>45?'attention':'normal'}/>
   <Metric title="PMP" value={`${num(data.pmp)} dias`} detail="Prazo médio de pagamento" tone={data.pmp<30?'critical':data.pmp<45?'attention':'normal'}/>
   <Metric title="Ciclo financeiro" value={`${num(data.cycle)} dias`} detail="PMR − PMP" tone={data.cycle>45?'critical':data.cycle>30?'attention':'normal'}/>
   <Metric title="Geração de caixa" value={brl(data.cashGeneration)} detail="Lançamentos pagos" tone={data.cashGeneration<0?'critical':'normal'}/>
   <Metric title="Cobertura de caixa" value={ratio(data.coverage)} detail="Geração ÷ saídas" tone={data.coverage<.5?'critical':data.coverage<1?'attention':'normal'}/>
  </div></section>
  <div className="grid">
   <section className="panel"><div className="panel-title"><h2>Capital de Giro & Liquidez</h2><span>Leitura patrimonial</span></div><div className="rows"><Row label="Ativo Circulante" value={accounting.snapshot.currentRatio*monthlyBalance[Number(sourceMonth)].passivoCirculante}/><Row label="Passivo Circulante" value={monthlyBalance[Number(sourceMonth)].passivoCirculante}/><Row label="Estoques" value={monthlyBalance[Number(sourceMonth)].estoques}/><Row label="Capital de Giro Líquido" value={accounting.snapshot.workingCapital}/><Row label="Necessidade de Capital de Giro" value={accounting.snapshot.ncg}/><Row label="Ciclo Financeiro" value={accounting.snapshot.cashConversionCycle} currency={false} suffix=" dias"/></div></section>
   <section className="panel"><div className="panel-title"><h2>Plano de ação</h2><span>Prioridades gerenciais</span></div><div className="rows"><Action title="Liquidez" text={accounting.snapshot.currentRatio<1?'Capital circulante insuficiente: proteger caixa e reprogramar saídas.':accounting.snapshot.currentRatio<1.2?'Liquidez positiva, porém com pouca folga.':'Manter colchão de liquidez.'}/><Action title="Rentabilidade" text={accounting.snapshot.netMargin<.05?'Margem líquida estreita: revisar preço, custos e OPEX.':'Preservar rentabilidade e disciplina de custos.'}/><Action title="Capital de giro" text={accounting.snapshot.ncg>0?'Reduzir recursos empatados em recebíveis/estoques ou ampliar prazo com fornecedores.':'Monitorar equilíbrio operacional do ciclo.'}/><Action title="Endividamento" text={accounting.snapshot.debtRatio>.7?'Priorizar desalavancagem e gestão do serviço da dívida.':accounting.snapshot.debtRatio>.5?'Acompanhar estrutura de capital e novas dívidas.':'Manter estrutura de capital equilibrada.'}/></div></section>
  </div>
  <section className="panel wide"><div className="panel-title"><h2>Mapa completo de indicadores</h2><span>{data.indicators.length+accounting.cards.length} indicadores integrados</span></div><div className="rows">{[...accounting.cards,...data.indicators].map(i=><div className="row" key={i.key}><span><b>{i.label}</b><small style={{display:'block',opacity:.7}}>{i.interpretation}</small></span><b className={`tone-${i.tone}`}>{fmt(i.value,i.unit)}</b></div>)}</div></section>
 </main>
}
function Metric({title,value,detail,tone='normal'}:{title:string;value:string;detail:string;tone?:IndicatorTone}){return <div className={`indicator indicator-${tone}`}><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>}
function Row({label,value,currency=true,suffix=''}:{label:string;value:number;currency?:boolean;suffix?:string}){return <div className="row"><span>{label}</span><b>{currency?brl(value):`${num(value)}${suffix}`}</b></div>}
function Action({title,text}:{title:string;text:string}){return <div className="row"><span><b>{title}</b><small style={{display:'block',opacity:.75}}>{text}</small></span><b>→</b></div>}

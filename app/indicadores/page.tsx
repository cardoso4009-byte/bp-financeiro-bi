'use client'

import { useMemo } from 'react'
import { readFinancialSource } from '@/lib/financial-source'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`

export default function IndicadoresPage(){
 const source=useMemo(()=>readFinancialSource(),[])
 const entries=source.entries
 const receitas=entries.filter(e=>e.type==='Receita')
 const despesas=entries.filter(e=>e.type==='Despesa')
 const receita=receitas.reduce((s,e)=>s+Math.abs(e.value),0)
 const despesa=despesas.reduce((s,e)=>s+Math.abs(e.value),0)
 const pagos=entries.filter(e=>e.status==='Pago')
 const abertos=entries.filter(e=>e.status==='Em aberto')
 const pagoValor=pagos.reduce((s,e)=>s+Math.abs(e.value),0)
 const abertoValor=abertos.reduce((s,e)=>s+Math.abs(e.value),0)
 const resultado=receita-despesa
 const margem=receita?resultado/receita:0
 const taxaPagamento=entries.length?pagos.length/entries.length:0
 const ticketMedio=entries.length?(receita+despesa)/entries.length:0
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Indicadores Gerenciais</h1><p>Rentabilidade • Caixa • Liquidez operacional • Eficiência financeira</p></div><div className="period">2026</div></header>
  <div className="indicator-grid">
   <Metric title="Receita" value={brl(receita)} detail="Lançamentos classificados como Receita"/>
   <Metric title="Despesas" value={brl(despesa)} detail="Lançamentos classificados como Despesa"/>
   <Metric title="Resultado" value={brl(resultado)} detail="Receita − despesas"/>
   <Metric title="Margem operacional" value={pct(margem)} detail="Resultado ÷ receita"/>
   <Metric title="Taxa de pagamento" value={pct(taxaPagamento)} detail={`${pagos.length} de ${entries.length} lançamentos pagos`}/>
   <Metric title="Ticket médio" value={brl(ticketMedio)} detail="Valor médio por lançamento"/>
  </div>
  <div className="grid">
   <section className="panel"><div className="panel-title"><h2>Posição financeira</h2><span>Base de lançamentos</span></div><div className="rows"><Row label="Valor pago" value={pagoValor}/><Row label="Valor em aberto" value={abertoValor}/><Row label="Lançamentos pagos" value={pagos.length} currency={false}/><Row label="Lançamentos em aberto" value={abertos.length} currency={false}/></div></section>
   <section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Indicadores-chave</span></div><div className="note"><strong>Rentabilidade:</strong> margem de {pct(margem)} no conjunto atual de lançamentos.<br/><br/><strong>Execução financeira:</strong> {pct(taxaPagamento)} dos lançamentos estão pagos. O valor em aberto de {brl(abertoValor)} merece acompanhamento no fluxo de caixa e capital de giro.<br/><br/><strong>Governança:</strong> os indicadores são derivados da mesma base financeira usada pelas demais visões.</div></section>
  </div>
  <section className="panel wide"><div className="panel-title"><h2>Indicadores a evoluir</h2><span>Próxima camada analítica</span></div><div className="grid"><Insight title="Liquidez" text="Adicionar liquidez corrente e seca quando o Balanço integrado estiver consolidado."/><Insight title="Capital de Giro" text="Conectar prazo médio de recebimento, pagamento e ciclo financeiro."/><Insight title="Rentabilidade" text="Adicionar ROIC, ROE e margem por unidade, centro de custo e período."/><Insight title="Eficiência" text="Adicionar OPEX/receita, orçamento × realizado e análise de desvios."/></div></section>
 </main>
}
function Metric({title,value,detail}:{title:string;value:string;detail:string}){return <div className="indicator"><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>}
function Row({label,value,currency=true}:{label:string;value:number;currency?:boolean}){return <div className="row"><span>{label}</span><b>{currency?brl(value):value.toLocaleString('pt-BR')}</b></div>}
function Insight({title,text}:{title:string;text:string}){return <div className="note"><strong>{title}</strong><p>{text}</p></div>}

'use client'

import { useMemo } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import { openReceivablesPayables } from '@/lib/contas-receber-pagar'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`
const num=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:1})

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
 const open=useMemo(()=>openReceivablesPayables(entries,'2026-12-31'),[entries])
 const contasReceber=open.filter(i=>i.direction==='Receber').reduce((s,i)=>s+Math.abs(i.value),0)
 const contasPagar=open.filter(i=>i.direction==='Pagar').reduce((s,i)=>s+Math.abs(i.value),0)
 const dso=receita?contasReceber/receita*365:0
 const dpo=despesa?contasPagar/despesa*365:0
 const ciclo=dso-dpo
 const opexRatio=receita?despesa/receita:0
 const ebitda=resultado
 const meses=useMemo(()=>Array.from({length:12},(_,idx)=>{const m=String(idx+1).padStart(2,'0');const rs=entries.filter(e=>e.type==='Receita'&&e.competence.startsWith(`2026-${m}`)).reduce((s,e)=>s+Math.abs(e.value),0);const ds=entries.filter(e=>e.type==='Despesa'&&e.competence.startsWith(`2026-${m}`)).reduce((s,e)=>s+Math.abs(e.value),0);return {label:m,receita:rs,resultado:rs-ds,margem:rs?(rs-ds)/rs:0}}),[entries])
 const max=Math.max(...meses.map(m=>m.receita),1)
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Indicadores Gerenciais</h1><p>Rentabilidade • Caixa • Liquidez • Eficiência • Capital de Giro</p></div><div className="period">2026</div></header>
  <div className="indicator-grid">
   <Metric title="Receita" value={brl(receita)} detail="Receitas do período"/>
   <Metric title="Resultado / EBITDA gerencial" value={brl(ebitda)} detail="Proxy gerencial: receita − despesas"/>
   <Metric title="Margem" value={pct(margem)} detail="Resultado ÷ receita"/>
   <Metric title="DSO" value={`${num(dso)} dias`} detail="Prazo médio estimado de recebimento" tone={dso>60?'warn':'normal'}/>
   <Metric title="DPO" value={`${num(dpo)} dias`} detail="Prazo médio estimado de pagamento"/>
   <Metric title="Ciclo financeiro" value={`${num(ciclo)} dias`} detail="DSO − DPO" tone={ciclo>45?'warn':'normal'}/>
   <Metric title="OPEX / Receita" value={pct(opexRatio)} detail="Despesas ÷ receita"/>
   <Metric title="Taxa de pagamento" value={pct(taxaPagamento)} detail={`${pagos.length} de ${entries.length} lançamentos pagos`}/>
  </div>
  <div className="grid">
   <section className="panel"><div className="panel-title"><h2>Capital de Giro</h2><span>Data-base 31/12/2026</span></div><div className="rows"><Row label="Contas a receber em aberto" value={contasReceber}/><Row label="Contas a pagar em aberto" value={contasPagar}/><Row label="Exposição líquida" value={contasReceber-contasPagar}/><Row label="DSO estimado" value={dso} currency={false} suffix=" dias"/><Row label="DPO estimado" value={dpo} currency={false} suffix=" dias"/><Row label="Ciclo financeiro" value={ciclo} currency={false} suffix=" dias"/></div></section>
   <section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Indicadores-chave</span></div><div className="note"><strong>Capital de giro:</strong> {ciclo>45?'o ciclo financeiro está elevado e merece atuação sobre recebimentos e/ou prazos com fornecedores.':'o ciclo financeiro está em patamar controlado pela base atual.'}<br/><br/><strong>Rentabilidade:</strong> margem de {pct(margem)} com resultado gerencial de {brl(resultado)}.<br/><br/><strong>Eficiência:</strong> despesas representam {pct(opexRatio)} da receita.<br/><br/><strong>Importante:</strong> DSO e DPO são estimativas com base no saldo em aberto da data-base e no volume anual; para gestão definitiva, evoluir para médias mensais.</div></section>
  </div>
  <section className="panel wide"><div className="panel-title"><h2>Evolução mensal</h2><span>Receita • Resultado • Margem</span></div><div className="monthly">{meses.map(m=><div className="month" key={m.label}><div className="month-head"><b>{m.label}</b><span>{brl(m.receita)}</span></div><div className="track"><i style={{width:`${m.receita/max*100}%`}}/></div><small>Resultado {brl(m.resultado)} • Margem {pct(m.margem)}</small></div>)}</div></section>
  <section className="panel wide"><div className="panel-title"><h2>Indicadores a evoluir</h2><span>Próxima camada analítica</span></div><div className="grid"><Insight title="Liquidez" text="Adicionar liquidez corrente, seca e cobertura de caixa quando o Balanço integrado estiver consolidado."/><Insight title="Capital de Giro" text="Evoluir DSO e DPO para médias móveis e análise por cliente, fornecedor e unidade."/><Insight title="Rentabilidade" text="Adicionar ROIC, ROE e margem por unidade, centro de custo e período."/><Insight title="Eficiência" text="Conectar OPEX/receita, orçamento × realizado e análise automática de desvios."/></div></section>
 </main>
}
function Metric({title,value,detail,tone='normal'}:{title:string;value:string;detail:string;tone?:'normal'|'warn'}){return <div className={`indicator ${tone==='warn'?'indicator-warn':''}`}><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>}
function Row({label,value,currency=true,suffix=''}:{label:string;value:number;currency?:boolean;suffix?:string}){return <div className="row"><span>{label}</span><b>{currency?brl(value):`${num(value)}${suffix}`}</b></div>}
function Insight({title,text}:{title:string;text:string}){return <div className="note"><strong>{title}</strong><p>{text}</p></div>}

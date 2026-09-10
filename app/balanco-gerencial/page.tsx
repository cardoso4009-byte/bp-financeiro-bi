'use client'
import {useMemo, useState} from 'react'
import {monthlyBalance} from '@/lib/monthly-data'
import ReportPeriodFilter from '@/components/report-period-filter'
import {DEFAULT_REPORT_PERIOD, competence, monthLabel, type ReportPeriod} from '@/lib/report-period'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`
const months=monthlyBalance.map(m=>m.month)
const availableYears=Array.from(new Set(months.map(x=>Number(x.slice(0,4))))).sort((a,b)=>a-b)
const latestCompetence=months.at(-1)
const defaultYear=latestCompetence?Number(latestCompetence.slice(0,4)):(availableYears.at(-1)??2026)
const defaultMonth=latestCompetence?Number(latestCompetence.slice(5,7)):1

type GroupProps={title:string;value:number;children:React.ReactNode;defaultOpen?:boolean}
function Group({title,value,children,defaultOpen=true}:GroupProps){
 const[open,setOpen]=useState(defaultOpen)
 return <>
  <tr className="group-row" onClick={()=>setOpen(!open)}><td><button className="expand-btn" aria-label={open?'Recolher':'Expandir'}>{open?'−':'+'}</button><strong>{title}</strong></td><td className="amount"><strong>{brl(value)}</strong></td></tr>
  {open&&children}
 </>
}
function Item({label,value,indent=1}:{label:string;value:number;indent?:number}){return <tr className="item-row"><td style={{paddingLeft:`${28+indent*20}px`}}>{label}</td><td className="amount">{brl(value)}</td></tr>}
function Check({ok,label,value}:{ok:boolean;label:string;value:string}){return <div className={`check ${ok?'ok':'warning'}`}><span>{ok?'✓':'!'}</span><div><strong>{label}</strong><small>{value}</small></div></div>}

export default function BalancoGerencial(){
 const[period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,year:defaultYear,month:defaultMonth})
 const[mode,setMode]=useState<'estrutura'|'indicadores'>('estrutura')
 const competenceKey=competence(period.year,period.month)
 const baseIndex=Math.max(0,months.findIndex(x=>x===competenceKey))
 const m=monthlyBalance.find(x=>x.month===competenceKey) ?? monthlyBalance[baseIndex]
 const prevIndex=period.month===1 ? months.findIndex(x=>x===`${period.year-1}-12`) : baseIndex-1
 const prev=prevIndex>=0 ? monthlyBalance[prevIndex] : null
 const variance=(a:number,b:number)=>b!==0?(a-b)/Math.abs(b):0
 const patrimonioCheck=m.ativoTotal-(m.passivoTotal+m.pl)
 const capitalGiro=m.ativoCirculante-m.passivoCirculante
 const prevCapitalGiro=prev?prev.ativoCirculante-prev.passivoCirculante:null
 const rows=useMemo(()=>[
  ['Liquidez Corrente',m.ativoCirculante/m.passivoCirculante],['Participação do PL',m.pl/m.ativoTotal],['Endividamento',m.passivoTotal/m.ativoTotal],['Imobilização do PL',m.ativoNaoCirculante/m.pl],['Caixa / Ativo',m.caixa/m.ativoTotal]
 ],[m])
 const viewLabel=period.view==='acumulado'?'Posição no fechamento do mês selecionado (acumulado não soma saldos)':period.view==='comparativo'?'Comparativo com o período anterior':'Posição patrimonial do mês selecionado'
 const previousLabel=period.month===1?`Dez/${period.year-1}`:`${monthLabel(period.month-1)}/${period.year}`
 return <main className="bp-page"><div className="bp-container">
  <header className="bp-header"><div><small>CONTROLADORIA FINANCEIRA</small><h1>Balanço Patrimonial Gerencial</h1><p>Posição patrimonial • visão mensal, acumulada e comparativa</p></div><ReportPeriodFilter value={period} onChange={setPeriod} years={availableYears}/></header>
  <div className="bp-tabs">{(['estrutura','indicadores'] as const).map(x=><button key={x} className={mode===x?'active':''} onClick={()=>setMode(x)}>{x[0].toUpperCase()+x.slice(1)}</button>)}</div>
  {period.view!=='comparativo'&&mode==='estrutura'&&<>
   <div className="bp-summary"><div><span>Ativo Total</span><strong>{brl(m.ativoTotal)}</strong></div><div><span>Passivo Total</span><strong>{brl(m.passivoTotal)}</strong></div><div><span>Patrimônio Líquido</span><strong>{brl(m.pl)}</strong></div><div><span>Capital de Giro Líquido</span><strong>{brl(capitalGiro)}</strong></div></div>
   <section className="bp-card"><div className="bp-card-title"><div><small>ESTRUTURA PATRIMONIAL</small><h2>Ativo, Passivo e Patrimônio Líquido</h2></div><span>{monthLabel(period.month)}/{period.year}</span></div><div className="table-wrap"><table className="bp-table"><thead><tr><th>Valores em R$</th><th>Saldo</th></tr></thead><tbody>
    <Group title="ATIVO" value={m.ativoTotal}><Group title="Ativo Circulante" value={m.ativoCirculante}><Item label="Caixa" value={m.caixa}/><Item label="Contas a Receber" value={m.contasReceber}/><Item label="Estoques" value={m.estoques}/><Item label="Outros Ativos" value={m.outrosAtivos}/></Group><Group title="Ativo Não Circulante" value={m.ativoNaoCirculante}><Item label="Imobilizado" value={m.imobilizado}/></Group></Group>
    <Group title="PASSIVO" value={m.passivoTotal}><Group title="Passivo Circulante" value={m.passivoCirculante}><Item label="Fornecedores" value={m.fornecedores}/><Item label="Obrigações" value={m.obrigacoes}/><Item label="Outros Passivos" value={m.outrosPassivos}/></Group><Group title="Passivo Não Circulante" value={m.passivoNaoCirculante}><Item label="Dívidas de Longo Prazo" value={m.dividasLongoPrazo}/></Group></Group>
    <Group title="PATRIMÔNIO LÍQUIDO" value={m.pl} defaultOpen={false}><Item label="Patrimônio Líquido" value={m.pl}/></Group>
   </tbody></table></div></section>
   <div className="bp-checks"><Check ok={Math.abs(patrimonioCheck)<1} label="Ativo = Passivo + PL" value={Math.abs(patrimonioCheck)<1?'Estrutura patrimonial conciliada':`Diferença: ${brl(patrimonioCheck)}`}/><Check ok={Number.isFinite(capitalGiro)} label="Capital de Giro Líquido" value={prev&&prevCapitalGiro!==null?`${brl(capitalGiro)} • variação vs. ${previousLabel}: ${pct(variance(capitalGiro,prevCapitalGiro))}`:`${brl(capitalGiro)} • sem competência anterior disponível para comparação`}/></div>
  </>}
  {period.view==='comparativo'&&<section className="bp-card"><div className="bp-card-title"><div><small>ANÁLISE COMPARATIVA</small><h2>{monthLabel(period.month)}/{period.year} × {previousLabel}</h2></div><span>Período anterior</span></div>{prev?<div className="bp-grid">{[['Ativo Total',m.ativoTotal,prev.ativoTotal],['Passivo Total',m.passivoTotal,prev.passivoTotal],['Patrimônio Líquido',m.pl,prev.pl],['Capital de Giro Líquido',capitalGiro,prevCapitalGiro!]].map(([label,value,previous])=><div className="metric-card" key={label as string}><span>{label}</span><h2>{brl(value as number)}</h2><small>Anterior: {brl(previous as number)} • variação: {variance(value as number,previous as number)>=0?'+':''}{pct(variance(value as number,previous as number))}</small></div>)}</div>:<div className="note">Não há competência anterior disponível para comparação.</div>}</section>}
  {mode==='indicadores'&&<div className="indicator-grid">{rows.map(([label,value])=><div className="metric-card" key={label as string}><span>{label}</span><h2>{label==='Liquidez Corrente'?(value as number).toFixed(2):pct(value as number)}</h2><small>{viewLabel} • {monthLabel(period.month)}/{period.year}</small></div>)}<div className="metric-card"><span>Capital de Giro Líquido</span><h2>{brl(capitalGiro)}</h2><small>Ativo Circulante − Passivo Circulante</small></div></div>}
  <div className="report-period-context"><strong>{viewLabel}</strong><span>Data-base: {monthLabel(period.month)}/{period.year}</span></div>
 </div></main>
}

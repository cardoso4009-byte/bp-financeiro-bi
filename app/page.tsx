'use client'

import { useMemo, useState } from 'react'
import { financialEntriesToJournal } from '@/lib/financial-accounting-integration'
import { readFinancialSource } from '@/lib/financial-source'
import { statementEngine } from '@/lib/statement-engine'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`
const nav=[['Visão Executiva','/'],['DRE Gerencial','/dre-gerencial'],['Balanço','/balanco-gerencial'],['DFC','/dfc'],['DMPL','/dmpl'],['Indicadores','/indicadores']] as const
const modules=[['Gestão Financeira','/gestao'],['Capital de Giro','/capital-giro'],['Fluxo de Caixa','/fluxo-caixa'],['Lançamentos','/lancamentos'],['Integração Financeira','/integracao'],['Contabilidade','/contabil'],['Razão & Balancete','/razao'],['Mapeamento Contábil','/mapeamento-contabil'],['Demonstrações Integradas','/demonstracoes-integradas'],['DFC Integrada','/dfc-integrada'],['Fechamento Contábil','/fechamento-contabil'],['Auditoria Contábil','/auditoria-contabil']] as const

export default function Home(){
 const [source]=useState(()=>readFinancialSource())
 const integration=useMemo(()=>financialEntriesToJournal(source.entries),[source.entries])
 const {dre,totals}=useMemo(()=>statementEngine(integration.entries),[integration.entries])
 const despesasOp=dre.filter((r:any)=>r.class==='despesa'&&r.code.startsWith('6.1')).reduce((s:number,r:any)=>s+r.balance,0)
 const despesasFin=dre.filter((r:any)=>r.class==='despesa'&&r.code.startsWith('6.2')).reduce((s:number,r:any)=>s+r.balance,0)
 const lucroBruto=totals.receitas-totals.custos
 const resultadoOperacional=lucroBruto-despesasOp
 const resultadoFinanceiro=-despesasFin
 const lucroLiquido=resultadoOperacional+resultadoFinanceiro
 const margemBruta=totals.receitas?lucroBruto/totals.receitas:0
 const margemOp=totals.receitas?resultadoOperacional/totals.receitas:0
 const margemLiq=totals.receitas?lucroLiquido/totals.receitas:0
 const caixaOperacional=source.entries.reduce((s:any,e:any)=>s+(e.category==='receita'?e.amount:e.category==='despesa'?-e.amount:0),0)
 return <main className="shell">
  <aside className="side"><div className="brand"><b>BP</b><div><strong>BP Financeiro</strong><span>Controladoria & BI</span></div></div><div className="company"><small>EMPRESA DEMONSTRATIVA</small><strong>Grupo Exemplo</strong><span>2026 • Modelo integrado</span></div><nav>{nav.map(([label,url],i)=><a className={i===0?'nav-link active':'nav-link'} key={label} href={url}>{label}</a>)}<div className="nav-divider">MÓDULOS GERENCIAIS</div>{modules.map(([label,url])=><a className="nav-link" key={url} href={url}>{label}</a>)}</nav><footer>V2.7 • Projeto Consultoria Financeira</footer></aside>
  <section className="content"><header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Visão Executiva</h1><p>Painel consolidado • Desempenho • Rentabilidade • Caixa • Indicadores</p></div><div className="period">Jan–Dez 2026</div></header>
   <div className="cards"><Card title="Receita Líquida" value={totals.receitas} sub="Realizado no período"/><Card title="Lucro Bruto" value={lucroBruto} sub={`Margem ${pct(margemBruta)}`}/><Card title="Resultado Operacional" value={resultadoOperacional} sub={`Margem ${pct(margemOp)}`}/><Card title="Lucro Líquido" value={lucroLiquido} sub={`Margem ${pct(margemLiq)}`}/></div>
   <div className="grid"><section className="panel"><div className="panel-title"><h2>Desempenho financeiro</h2><span>2026</span></div><div className="rows"><div className="row"><span>Receita líquida</span><b>{brl(totals.receitas)}</b></div><div className="row"><span>Custos</span><b>{brl(-totals.custos)}</b></div><div className="row"><span>Despesas operacionais</span><b>{brl(-despesasOp)}</b></div><div className="row"><span>Resultado operacional</span><b>{brl(resultadoOperacional)}</b></div><div className="row"><span>Resultado financeiro</span><b>{brl(resultadoFinanceiro)}</b></div><div className="row"><span>Lucro líquido</span><b>{brl(lucroLiquido)}</b></div></div></section>
    <section className="panel"><div className="panel-title"><h2>Indicadores-chave</h2><span>Gestão</span></div><div className="rows"><div className="row"><span>Margem bruta</span><b>{pct(margemBruta)}</b></div><div className="row"><span>Margem operacional</span><b>{pct(margemOp)}</b></div><div className="row"><span>Margem líquida</span><b>{pct(margemLiq)}</b></div><div className="row"><span>Base de lançamentos</span><b>{source.entries.length}</b></div><div className="row"><span>Erros de integração</span><b className={integration.errors.length?'negative':'positive'}>{integration.errors.length}</b></div></div></section></div>
   <section className="panel wide"><div className="panel-title"><h2>Visão de gestão</h2><span>Tomada de decisão</span></div><div className="grid"><Insight title="Rentabilidade" text={`A empresa apresenta margem líquida de ${pct(margemLiq)}, permitindo acompanhar a conversão da receita em resultado.`}/><Insight title="Operação" text={`O resultado operacional é de ${brl(resultadoOperacional)}, com margem de ${pct(margemOp)}.`}/><Insight title="Caixa" text={`A base atual registra ${brl(caixaOperacional)} de geração operacional calculada a partir dos lançamentos.`}/></div></section>
   <section className="panel wide"><div className="panel-title"><h2>Acesso rápido</h2><span>Análises</span></div><div className="rows"><div className="row"><span>DRE Gerencial</span><a href="/dre-gerencial" style={{fontWeight:700}}>Abrir análise →</a></div><div className="row"><span>Fluxo de Caixa Projetado</span><a href="/fluxo-caixa" style={{fontWeight:700}}>Abrir análise →</a></div><div className="row"><span>Capital de Giro</span><a href="/capital-giro" style={{fontWeight:700}}>Abrir análise →</a></div><div className="row"><span>Demonstrações Integradas</span><a href="/demonstracoes-integradas" style={{fontWeight:700}}>Abrir análise →</a></div></div></section>
  </section></main>
}
function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}
function Insight({title,text}:{title:string;text:string}){return <div className="note"><strong>{title}</strong><p>{text}</p></div>}

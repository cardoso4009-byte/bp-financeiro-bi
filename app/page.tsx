'use client'

import { useMemo, useState } from 'react'
import { financialEntriesToJournal } from '@/lib/financial-accounting-integration'
import { readFinancialSource } from '@/lib/financial-source'
import { statementEngine } from '@/lib/statement-engine'
import { managementImpact } from '@/lib/management-integration'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`
const nav=[['Visão Executiva','/'],['DRE Gerencial','/dre-gerencial'],['Balanço','/balanco-gerencial'],['DFC','/dfc'],['DMPL','/dmpl'],['Indicadores','/indicadores']] as const
const modules=[['Gestão Financeira','/gestao'],['Capital de Giro','/capital-giro'],['Fluxo de Caixa','/fluxo-caixa'],['OPEX Gerencial','/opex'],['Lançamentos','/lancamentos'],['Integração Financeira','/integracao'],['Contabilidade','/contabil'],['Razão & Balancete','/razao'],['Mapeamento Contábil','/mapeamento-contabil'],['Demonstrações Integradas','/demonstracoes-integradas'],['DFC Integrada','/dfc-integrada'],['Fechamento Contábil','/fechamento-contabil'],['Auditoria Contábil','/auditoria-contabil']] as const

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
 const management=useMemo(()=>source.entries.reduce((a,e)=>{const x=managementImpact(e);return {dre:a.dre+x.dre,cash:a.cash+x.cash,balance:a.balance+x.balance,workingCapital:a.workingCapital+x.workingCapital}},{dre:0,cash:0,balance:0,workingCapital:0}),[source.entries])
 const paid=source.entries.filter(e=>e.status==='Pago').length
 const open=source.entries.filter(e=>e.status==='Em aberto').length
 return <main className="shell">
  <aside className="side"><div className="brand"><b>BP</b><div><strong>BP Financeiro</strong><span>Controladoria & BI</span></div></div><div className="company"><small>EMPRESA DEMONSTRATIVA</small><strong>Grupo Exemplo</strong><span>2026 • Modelo integrado</span></div><nav>{nav.map(([label,url],i)=><a className={i===0?'nav-link active':'nav-link'} key={label} href={url}>{label}</a>)}<div className="nav-divider">MÓDULOS GERENCIAIS</div>{modules.map(([label,url])=><a className="nav-link" key={url} href={url}>{label}</a>)}</nav><footer>V2.8 • Projeto Consultoria Financeira</footer></aside>
  <section className="content"><header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Visão Executiva</h1><p>Painel integrado • Resultado • Caixa • Patrimônio • Capital de Giro</p></div><div className="period">Jan–Dez 2026</div></header>
   <div className="cards"><Card title="Receita Líquida" value={totals.receitas} sub="Regime de competência"/><Card title="Lucro Bruto" value={lucroBruto} sub={`Margem ${pct(margemBruta)}`}/><Card title="Resultado Operacional" value={resultadoOperacional} sub={`Margem ${pct(margemOp)}`}/><Card title="Lucro Líquido" value={lucroLiquido} sub={`Margem ${pct(margemLiq)}`}/></div>
   <div className="grid"><section className="panel"><div className="panel-title"><h2>Desempenho financeiro</h2><span>2026 • DRE</span></div><div className="rows"><Row label="Receita líquida" value={totals.receitas}/><Row label="Custos" value={-totals.custos}/><Row label="Despesas operacionais" value={-despesasOp}/><Row label="Resultado operacional" value={resultadoOperacional}/><Row label="Resultado financeiro" value={resultadoFinanceiro}/><Row label="Lucro líquido" value={lucroLiquido}/></div></section>
    <section className="panel"><div className="panel-title"><h2>Integração financeira</h2><span>Base única</span></div><div className="rows"><Row label="Lançamentos" value={source.entries.length} currency={false}/><Row label="Pagos" value={paid} currency={false}/><Row label="Em aberto" value={open} currency={false}/><Row label="Impacto em caixa" value={management.cash}/><Row label="Impacto patrimonial pendente" value={management.balance}/><Row label="Pressão de capital de giro" value={management.workingCapital}/></div></section></div>
   <section className="panel wide"><div className="panel-title"><h2>Fluxo de integração</h2><span>Uma informação → múltiplas demonstrações</span></div><div className="grid"><Insight title="1. Lançamento" text="A base financeira registra competência, vencimento, pagamento, status, categoria e centro de custo."/><Insight title="2. Resultado" text="Receitas e despesas são reconhecidas por competência e alimentam a DRE gerencial."/><Insight title="3. Caixa" text="O pagamento ou recebimento efetivo alimenta o fluxo de caixa, sem misturar competência com caixa."/><Insight title="4. Patrimônio" text="Contas a receber, obrigações, CAPEX e financiamentos geram os efeitos patrimoniais correspondentes."/></div></section>
   <section className="panel wide"><div className="panel-title"><h2>Visão de gestão</h2><span>Tomada de decisão</span></div><div className="grid"><Insight title="Rentabilidade" text={`Margem líquida de ${pct(margemLiq)}. Acompanhe a conversão da receita em resultado.`}/><Insight title="Caixa" text={`Impacto líquido de ${brl(management.cash)} nos lançamentos pagos. Caixa deve ser analisado separadamente da competência.`}/><Insight title="Capital de Giro" text={`Pressão identificada de ${brl(Math.abs(management.workingCapital))} em itens ainda não liquidados.`}/><Insight title="Governança" text={`${integration.errors.length} erro(s) de integração identificados na transformação financeira → contábil.`}/></div></section>
   <section className="panel wide"><div className="panel-title"><h2>Acesso rápido</h2><span>Análises integradas</span></div><div className="rows"><Quick label="DRE Gerencial" url="/dre-gerencial"/><Quick label="OPEX Gerencial" url="/opex"/><Quick label="Fluxo de Caixa" url="/fluxo-caixa"/><Quick label="Capital de Giro" url="/capital-giro"/><Quick label="Balanço Patrimonial" url="/balanco-gerencial"/><Quick label="Demonstrações Integradas" url="/demonstracoes-integradas"/></div></section>
  </section></main>
}
function brlOrNumber(n:number,currency:boolean){return currency?brl(n):n.toLocaleString('pt-BR')}
function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}
function Row({label,value,currency=true}:{label:string;value:number;currency?:boolean}){return <div className="row"><span>{label}</span><b>{brlOrNumber(value,currency)}</b></div>}
function Insight({title,text}:{title:string;text:string}){return <div className="note"><strong>{title}</strong><p>{text}</p></div>}
function Quick({label,url}:{label:string;url:string}){return <div className="row"><span>{label}</span><a href={url} style={{fontWeight:700}}>Abrir análise →</a></div>}

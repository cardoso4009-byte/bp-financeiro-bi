'use client'

import { useMemo, useState } from 'react'
import { financialEntriesToJournal } from '@/lib/financial-accounting-integration'
import { readFinancialSource } from '@/lib/financial-source'
import { statementEngine } from '@/lib/statement-engine'
import { managementImpact } from '@/lib/management-integration'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`

type NavItem={label:string;url:string;icon:string}
type NavSection={title:string;items:NavItem[];color:string;icon:string}

const navSections:NavSection[]=[
 {title:'VISÃO EXECUTIVA',color:'#28a8ff',icon:'chart',items:[
  {label:'Visão Executiva',url:'/',icon:'chart'},{label:'DRE Gerencial',url:'/dre-gerencial',icon:'file'},{label:'Balanço Patrimonial',url:'/balanco-gerencial',icon:'balance'},
  {label:'DFC',url:'/dfc',icon:'layers'},{label:'DMPL',url:'/dmpl',icon:'people'},{label:'Indicadores',url:'/indicadores',icon:'trend'}
 ]},
 {title:'GESTÃO FINANCEIRA',color:'#35e68b',icon:'money',items:[
  {label:'Gestão Financeira',url:'/gestao',icon:'money'},{label:'Fluxo de Caixa',url:'/fluxo-caixa',icon:'cash'},{label:'Contas a Receber & Pagar',url:'/contas-receber-pagar',icon:'swap'},
  {label:'Capital de Giro',url:'/capital-giro',icon:'cycle'},{label:'OPEX Gerencial',url:'/opex',icon:'pie'},{label:'Orçamento × Realizado',url:'/budget-realizado',icon:'target'}
 ]},
 {title:'BASE FINANCEIRA',color:'#c06cff',icon:'database',items:[
  {label:'Lançamentos',url:'/lancamentos',icon:'list'},{label:'Integração Financeira',url:'/integracao',icon:'upload'}
 ]},
 {title:'CONTABILIDADE',color:'#38bdf8',icon:'book',items:[
  {label:'Contabilidade',url:'/contabil',icon:'book'},{label:'Razão & Balancete',url:'/razao',icon:'ledger'},{label:'Mapeamento Contábil',url:'/mapeamento-contabil',icon:'link'},
  {label:'Demonstrações Integradas',url:'/demonstracoes-integradas',icon:'layers'},{label:'DFC Integrada',url:'/dfc-integrada',icon:'cycle'}
 ]},
 {title:'FECHAMENTO & GOVERNANÇA',color:'#ffc83d',icon:'shield',items:[
  {label:'Fechamento Contábil',url:'/fechamento-contabil',icon:'calendar'},{label:'Auditoria Contábil',url:'/auditoria-contabil',icon:'search'}
 ]}
]

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
 return <>
  <style>{`
   .side{width:286px;padding:22px 14px;overflow-y:auto;overflow-x:hidden;background:#071526}
   .content{margin-left:286px;width:calc(100% - 286px)}
   .side nav{display:block}
   .nav-section{margin:0 0 12px;padding:0 0 8px;border:1px solid rgba(84,119,158,.22);border-radius:13px;background:rgba(12,31,53,.72);overflow:hidden}
   .nav-section-title{display:flex;align-items:center;gap:11px;min-height:48px;padding:8px 12px;border-bottom:1px solid rgba(84,119,158,.16);color:#fff;font-size:12px;letter-spacing:.06em;font-weight:800;line-height:1.2;background:rgba(20,46,77,.65)}
   .nav-section-title .nav-section-icon{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border-radius:9px;background:color-mix(in srgb,var(--section-color) 22%,#0d2540);color:var(--section-color);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--section-color) 55%,transparent)}
   .nav-section-title .nav-arrow{margin-left:auto;color:#fff;font-size:22px;font-weight:300;line-height:1}
   .nav-link{display:flex;align-items:center;gap:11px;min-height:40px;width:100%;padding:8px 13px;color:#e1e8f2;border-radius:0;background:transparent;font-size:12px;text-decoration:none;line-height:1.25;transition:.16s ease}
   .nav-link .nav-icon{display:grid;place-items:center;width:27px;height:27px;flex:0 0 27px;color:var(--item-color);opacity:.98}
   .nav-link .nav-icon svg{width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
   .nav-link:hover{background:rgba(35,69,110,.65);color:#fff}
   .nav-link.active{background:linear-gradient(90deg,rgba(32,100,171,.9),rgba(25,57,94,.88));color:#fff;font-weight:750;box-shadow:inset 3px 0 0 var(--item-color),inset 0 0 0 1px rgba(90,151,220,.18)}
   .nav-link.active .nav-icon{filter:drop-shadow(0 0 4px color-mix(in srgb,var(--item-color) 45%,transparent))}
   .side footer{padding-top:8px}
   @media(max-width:900px){.side{width:235px}.content{margin-left:235px;width:calc(100% - 235px)}}
   @media(max-width:650px){.side{width:100%;padding:18px 12px}.content{margin-left:0;width:100%}.side nav{display:block}.nav-section{margin-bottom:8px}.nav-link{width:100%;display:flex}.nav-section-title{padding-top:9px}}
  `}</style>
  <main className="shell">
   <aside className="side">
    <div className="brand"><b>BP</b><div><strong>BP Financeiro</strong><span>Controladoria & BI</span></div></div>
    <div className="company"><small>EMPRESA DEMONSTRATIVA</small><strong>Grupo Exemplo</strong><span>2026 • Modelo integrado</span></div>
    <nav aria-label="Navegação principal">
     {navSections.map(section=><div className="nav-section" key={section.title} style={{'--section-color':section.color} as React.CSSProperties}>
      <div className="nav-section-title"><span className="nav-section-icon"><Icon name={section.icon}/></span><span>{section.title}</span><span className="nav-arrow">›</span></div>
      {section.items.map(item=><a className={`nav-link${item.url==='/'?' active':''}`} style={{'--item-color':section.color} as React.CSSProperties} key={item.url} href={item.url}><span className="nav-icon"><Icon name={item.icon}/></span><span>{item.label}</span></a>)}
     </div>)}
    </nav>
    <footer>V2.10 • Projeto Consultoria Financeira</footer>
   </aside>
   <section className="content"><header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Visão Executiva</h1><p>Painel integrado • Resultado • Caixa • Patrimônio • Capital de Giro</p></div><div className="period">Jan–Dez 2026</div></header>
    <div className="cards"><Card title="Receita Líquida" value={totals.receitas} sub="Regime de competência"/><Card title="Lucro Bruto" value={lucroBruto} sub={`Margem ${pct(margemBruta)}`}/><Card title="Resultado Operacional" value={resultadoOperacional} sub={`Margem ${pct(margemOp)}`}/><Card title="Lucro Líquido" value={lucroLiquido} sub={`Margem ${pct(margemLiq)}`}/></div>
    <div className="grid"><section className="panel"><div className="panel-title"><h2>Desempenho financeiro</h2><span>2026 • DRE</span></div><div className="rows"><Row label="Receita líquida" value={totals.receitas}/><Row label="Custos" value={-totals.custos}/><Row label="Despesas operacionais" value={-despesasOp}/><Row label="Resultado operacional" value={resultadoOperacional}/><Row label="Resultado financeiro" value={resultadoFinanceiro}/><Row label="Lucro líquido" value={lucroLiquido}/></div></section>
     <section className="panel"><div className="panel-title"><h2>Integração financeira</h2><span>Base única</span></div><div className="rows"><Row label="Lançamentos" value={source.entries.length} currency={false}/><Row label="Pagos" value={paid} currency={false}/><Row label="Em aberto" value={open} currency={false}/><Row label="Impacto em caixa" value={management.cash}/><Row label="Impacto patrimonial pendente" value={management.balance}/><Row label="Pressão de capital de giro" value={management.workingCapital}/></div></section></div>
    <section className="panel wide"><div className="panel-title"><h2>Fluxo de integração</h2><span>Uma informação → múltiplas demonstrações</span></div><div className="grid"><Insight title="1. Lançamento" text="A base financeira registra competência, vencimento, pagamento, status, categoria e centro de custo."/><Insight title="2. Resultado" text="Receitas e despesas são reconhecidas por competência e alimentam a DRE gerencial."/><Insight title="3. Caixa" text="O pagamento ou recebimento efetivo alimenta o fluxo de caixa, sem misturar competência com caixa."/><Insight title="4. Patrimônio" text="Contas a receber, obrigações, CAPEX e financiamentos geram os efeitos patrimoniais correspondentes."/></div></section>
    <section className="panel wide"><div className="panel-title"><h2>Visão de gestão</h2><span>Tomada de decisão</span></div><div className="grid"><Insight title="Rentabilidade" text={`Margem líquida de ${pct(margemLiq)}. Acompanhe a conversão da receita em resultado.`}/><Insight title="Caixa" text={`Impacto líquido de ${brl(management.cash)} nos lançamentos pagos. Caixa deve ser analisado separadamente da competência.`}/><Insight title="Capital de Giro" text={`Pressão identificada de ${brl(Math.abs(management.workingCapital))} em itens ainda não liquidados.`}/><Insight title="Governança" text={`${integration.errors.length} erro(s) de integração identificados na transformação financeira → contábil.`}/></div></section>
    <section className="panel wide"><div className="panel-title"><h2>Acesso rápido</h2><span>Análises integradas</span></div><div className="rows"><Quick label="DRE Gerencial" url="/dre-gerencial"/><Quick label="OPEX Gerencial" url="/opex"/><Quick label="Fluxo de Caixa" url="/fluxo-caixa"/><Quick label="Capital de Giro" url="/capital-giro"/><Quick label="Balanço Patrimonial" url="/balanco-gerencial"/><Quick label="Demonstrações Integradas" url="/demonstracoes-integradas"/></div></section>
   </section>
  </main>
 </>
}
function Icon({name}:{name:string}){const common={width:22,height:22,viewBox:'0 0 24 24',ariaHidden:true} as any;switch(name){
 case 'chart':return <svg {...common}><path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15v-4"/><path d="M11 15V7"/><path d="M15 15V4"/><path d="M19 15v-7"/></svg>
 case 'file':return <svg {...common}><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/></svg>
 case 'balance':return <svg {...common}><path d="M12 3v18M7 6h10M5 8l-3 5a4 4 0 0 0 6 0L5 8zm14 0-3 5a4 4 0 0 0 6 0l-3-5zM8 21h8"/></svg>
 case 'layers':return <svg {...common}><path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg>
 case 'people':return <svg {...common}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M15 14c3 0 5 2 5 5"/></svg>
 case 'trend':return <svg {...common}><path d="M4 18V6M4 18h16"/><path d="m7 15 4-4 3 2 5-6"/></svg>
 case 'money':return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M14 8.5c-.6-.6-1.4-.9-2.3-.9-1.5 0-2.7.8-2.7 2 0 3 5.9 1.3 5.9 4.2 0 1.2-1.1 2.1-2.8 2.1-1 0-2-.3-2.7-1M12 6v12"/></svg>
 case 'cash':return <svg {...common}><rect x="3" y="7" width="18" height="11" rx="2"/><path d="M7 7V5h10v2M8 12h8M12 10v4"/></svg>
 case 'swap':return <svg {...common}><path d="M7 7h11l-3-3M17 17H6l3 3M18 7l-3 3M6 17l3-3"/></svg>
 case 'cycle':return <svg {...common}><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.5 9A7 7 0 0 1 19 7M17.5 15A7 7 0 0 1 5 17"/></svg>
 case 'pie':return <svg {...common}><path d="M12 3v9h9"/><path d="M20.5 15A9 9 0 1 1 9 3.5"/></svg>
 case 'target':return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="m15 9 5-5M16 4h4v4"/></svg>
 case 'database':return <svg {...common}><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/></svg>
 case 'list':return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>
 case 'upload':return <svg {...common}><path d="M12 16V4M8 8l4-4 4 4M5 14a4 4 0 0 0 0 8h13a3 3 0 0 0 .5-6"/></svg>
 case 'book':return <svg {...common}><path d="M5 4a3 3 0 0 1 3-1h11v18H8a3 3 0 0 0-3 1z"/><path d="M5 4v18M9 7h7M9 11h7"/></svg>
 case 'ledger':return <svg {...common}><path d="M5 4h14v16H5zM9 4v16M12 8h4M12 12h4M12 16h3"/></svg>
 case 'link':return <svg {...common}><path d="M9 15 7 17a4 4 0 0 1-6-3 4 4 0 0 1 1-3l4-4a4 4 0 0 1 6 0M15 9l2-2a4 4 0 0 1 6 3 4 4 0 0 1-1 3l-4 4a4 4 0 0 1-6 0"/><path d="m8 12 8 0"/></svg>
 case 'shield':return <svg {...common}><path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-5"/></svg>
 case 'calendar':return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14l2 2 5-5"/></svg>
 case 'search':return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
 default:return <svg {...common}><circle cx="12" cy="12" r="8"/></svg>
}}
function brlOrNumber(n:number,currency:boolean){return currency?brl(n):n.toLocaleString('pt-BR')}
function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}
function Row({label,value,currency=true}:{label:string;value:number;currency?:boolean}){return <div className="row"><span>{label}</span><b>{brlOrNumber(value,currency)}</b></div>}
function Insight({title,text}:{title:string;text:string}){return <div className="note"><strong>{title}</strong><p>{text}</p></div>}
function Quick({label,url}:{label:string;url:string}){return <div className="row"><span>{label}</span><a href={url} style={{fontWeight:700}}>Abrir análise →</a></div>}

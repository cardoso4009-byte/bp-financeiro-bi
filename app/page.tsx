'use client'

import { useEffect, useMemo, useState } from 'react'
import { financialEntriesToJournal } from '@/lib/financial-accounting-integration'
import { readFinancialSource } from '@/lib/financial-source'
import { statementEngine } from '@/lib/statement-engine'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct = (n:number) => `${n.toFixed(1).replace('.',',')}%`
const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const nav = [['Visão Executiva','/'],['DRE Gerencial','/'],['Balanço','/balanco-gerencial'],['DFC','/dfc'],['DMPL','/dmpl'],['Indicadores','/indicadores']] as const
const modules = [['Gestão Financeira','/gestao'],['Capital de Giro','/capital-giro'],['Fluxo de Caixa','/fluxo-caixa'],['Lançamentos','/lancamentos'],['Integração Financeira','/integracao'],['Contabilidade','/contabil'],['Razão & Balancete','/razao'],['Mapeamento Contábil','/mapeamento-contabil'],['Demonstrações Integradas','/demonstracoes-integradas'],['DFC Integrada','/dfc-integrada'],['Fechamento Contábil','/fechamento-contabil'],['Auditoria Contábil','/auditoria-contabil']] as const

type View = 'mensal'|'acumulado'|'trimestral'|'semestral'|'anual'

export default function Home(){
 const [source,setSource] = useState(()=>readFinancialSource())
 const [view,setView] = useState<View>('mensal')
 const [start,setStart] = useState(0)
 const [end,setEnd] = useState(11)
 const [base,setBase] = useState(11)
 const [showMargins,setShowMargins] = useState(true)
 const [showVariance,setShowVariance] = useState(true)
 useEffect(()=>{ const refresh=()=>setSource(readFinancialSource()); window.addEventListener('storage',refresh); return()=>window.removeEventListener('storage',refresh) },[])
 const integration = useMemo(()=>financialEntriesToJournal(source.entries),[source.entries])
 const {dre,totals} = useMemo(()=>statementEngine(integration.entries),[integration.entries])
 const grouped = useMemo(()=>dre.filter((r:any)=>r.level===2),[dre])
 const despesasOp = dre.filter((r:any)=>r.class==='despesa' && r.code.startsWith('6.1')).reduce((s:number,r:any)=>s+r.balance,0)
 const despesasFin = dre.filter((r:any)=>r.class==='despesa' && r.code.startsWith('6.2')).reduce((s:number,r:any)=>s+r.balance,0)
 const lucroBruto = totals.receitas-totals.custos
 const resultadoOperacional = lucroBruto-despesasOp
 const resultadoFinanceiro = -despesasFin
 const lucroLiquido = resultadoOperacional+resultadoFinanceiro
 const margemBruta = totals.receitas?lucroBruto/totals.receitas:0
 const margemOp = totals.receitas?resultadoOperacional/totals.receitas:0
 const margemLiq = totals.receitas?lucroLiquido/totals.receitas:0
 const filtered = source.entries.filter(e=>{const m=new Date(`${e.competence}-01`).getMonth(); return m>=start&&m<=end})
 const periodLabel = start===end?months[start]:`${months[start]}–${months[end]}`
 const rows = grouped.filter((r:any)=>r.code.startsWith('4')||r.code.startsWith('5')||r.code.startsWith('6.1')||r.code.startsWith('6.2'))
 return <main className="shell">
  <aside className="side"><div className="brand"><b>BP</b><div><strong>BP Financeiro</strong><span>Controladoria & BI</span></div></div><div className="company"><small>EMPRESA DEMONSTRATIVA</small><strong>Grupo Exemplo</strong><span>2026 • Modelo integrado</span></div><nav>{nav.map(([label,url],i)=><a className={i===1?'nav-link active':'nav-link'} key={label} href={url}>{label}</a>)}<div className="nav-divider">MÓDULOS GERENCIAIS</div>{modules.map(([label,url])=><a className="nav-link" key={url} href={url}>{label}</a>)}</nav><footer>V2.6 • Projeto Consultoria Financeira</footer></aside>
  <section className="content"><header><div><small>CONTROLADORIA FINANCEIRA</small><h1>DRE Gerencial</h1><p>Demonstração integrada • Razão + Mapeamento Contábil • Regime de competência</p></div><div className="period-controls"><label>PERÍODO DE ANÁLISE</label><div><select value={start} onChange={e=>setStart(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i}>Início: {m}/2026</option>)}</select><select value={end} onChange={e=>setEnd(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i}>Fim: {m}/2026</option>)}</select><select value={base} onChange={e=>setBase(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i}>Data-base: {m}/2026</option>)}</select></div><span>{periodLabel}/2026 • BP em {months[base]}/2026</span></div></header>
   <div className="cards"><Card title="Receita Líquida" value={totals.receitas} sub="Razão integrado"/><Card title="Lucro Bruto" value={lucroBruto} sub={`Margem ${pct(margemBruta*100)}`}/><Card title="Resultado Operacional" value={resultadoOperacional} sub={`Margem ${pct(margemOp*100)}`}/><Card title="Lucro Líquido" value={lucroLiquido} sub={`Margem ${pct(margemLiq*100)}`}/></div>
   <section className="panel wide"><div className="panel-title"><h2>DRE Gerencial — Orçado x Realizado</h2><span>Origem: Razão + Mapeamento Contábil</span></div><div className="dre-toolbar"><div><span>VISÃO</span><div className="segmented">{(['mensal','acumulado','trimestral','semestral','anual'] as View[]).map(v=><button key={v} className={view===v?'selected':''} onClick={()=>setView(v)}>{v[0].toUpperCase()+v.slice(1)}</button>)}</div></div><div className="dre-actions"><button className={showMargins?'selected':''} onClick={()=>setShowMargins(!showMargins)}>％ Mostrar Margens</button><button onClick={()=>window.print()}>⇩ Exportar</button><button className={showVariance?'selected':''} onClick={()=>setShowVariance(!showVariance)}>▥ Análise de Variações</button></div></div>
    <div className="table-wrap dre-wrap"><table className="dre-table"><thead><tr><th>Conta</th><th>Realizado</th><th>% Receita</th>{showVariance&&<><th>Orçado</th><th>Var. R$</th><th>Var. %</th></>}</tr></thead><tbody>
      <tr className="dre-main-row"><td>Receita Líquida</td><td>{brl(totals.receitas)}</td><td>100,0%</td>{showVariance&&<BudgetCells actual={totals.receitas} budget={totals.receitas*0.9998}/>}</tr>
      {rows.filter((r:any)=>r.code.startsWith('4')).map((r:any)=><Detail key={r.code} row={r} base={totals.receitas} negative={false}/>)}
      <Subtotal label="Lucro Bruto" value={lucroBruto} margin={margemBruta} variance={showVariance} budget={lucroBruto*0.98}/>
      <tr className="dre-main-row"><td>(-) Custos</td><td>{brl(-totals.custos)}</td><td>{totals.receitas?pct(-totals.custos/totals.receitas):'—'}</td>{showVariance&&<BudgetCells actual={-totals.custos} budget={-totals.custos*0.98}/>}</tr>
      {rows.filter((r:any)=>r.code.startsWith('5')).map((r:any)=><Detail key={r.code} row={r} base={totals.receitas} negative/>)}
      <tr className="dre-main-row"><td>(-) Despesas Operacionais</td><td>{brl(-despesasOp)}</td><td>{totals.receitas?pct(-despesasOp/totals.receitas):'—'}</td>{showVariance&&<BudgetCells actual={-despesasOp} budget={-despesasOp*0.98}/>}</tr>
      {rows.filter((r:any)=>r.code.startsWith('6.1')).map((r:any)=><Detail key={r.code} row={r} base={totals.receitas} negative/>)}
      <Subtotal label="Resultado Operacional" value={resultadoOperacional} margin={margemOp} variance={showVariance} budget={resultadoOperacional*1.02}/>
      <tr className="dre-main-row"><td>Resultado Financeiro</td><td>{brl(resultadoFinanceiro)}</td><td>{totals.receitas?pct(resultadoFinanceiro/totals.receitas):'—'}</td>{showVariance&&<BudgetCells actual={resultadoFinanceiro} budget={resultadoFinanceiro*1.02}/>}</tr>
      {rows.filter((r:any)=>r.code.startsWith('6.2')).map((r:any)=><Detail key={r.code} row={r} base={totals.receitas} negative/>)}
      <Subtotal label="Lucro Líquido" value={lucroLiquido} margin={margemLiq} variance={showVariance} budget={lucroLiquido*1.02}/>
      {showMargins&&<><MarginLine label="Margem Bruta" value={margemBruta}/><MarginLine label="Margem Operacional" value={margemOp}/><MarginLine label="Margem Líquida" value={margemLiq}/></>}
    </tbody></table></div><div className="dre-foot"><span>Variação = Realizado − Orçado • p.p. = pontos percentuais</span><span>{source.origin==='LOCAL_STORAGE'?'Base financeira atualizada':'Base demonstrativa inicial'} • {source.entries.length} lançamentos</span></div></section>
   <section className="panel"><div className="panel-title"><h2>Integridade da integração</h2><span>Base financeira → Diário → Razão → DRE</span></div><div className="grid"><Check label="Lançamentos integrados" value={String(integration.entries.length)} ok={integration.errors.length===0}/><Check label="Erros de integração" value={String(integration.errors.length)} ok={integration.errors.length===0}/><Check label="Período filtrado" value={`${filtered.length} lançamentos`} ok/></div></section>
  </section></main>
}

function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}
function Detail({row,base,negative=false}:{row:any;base:number;negative?:boolean}){const v=negative?-Math.abs(row.balance):row.balance;return <tr><td style={{paddingLeft:28}}>↳ {row.code} — {row.name}</td><td>{brl(v)}</td><td>{base?Math.abs(v/base).toLocaleString('pt-BR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1}):'—'}</td></tr>}
function BudgetCells({actual,budget}:{actual:number;budget:number}){const v=actual-budget;const p=budget?Math.abs(v/budget)*100:0;return <><td>{brl(budget)}</td><td className={v>=0?'positive':'negative'}>{brl(v)}</td><td className={v>=0?'positive':'negative'}>{pct(p)}</td></>}
function Subtotal({label,value,margin,variance,budget}:{label:string;value:number;margin:number;variance:boolean;budget:number}){return <tr className="margin-row"><td>= {label}</td><td><b>{brl(value)}</b></td><td><b>{pct(margin*100)}</b></td>{variance&&<BudgetCells actual={value} budget={budget}/>}</tr>}
function MarginLine({label,value}:{label:string;value:number}){return <tr className="margin-row"><td>{label}</td><td colSpan={2}>{pct(value*100)}</td></tr>}
function Check({label,value,ok}:{label:string;value:string;ok:boolean}){return <div className="check"><span>{label}</span><strong className={ok?'positive':'negative'}>{value}</strong></div>}

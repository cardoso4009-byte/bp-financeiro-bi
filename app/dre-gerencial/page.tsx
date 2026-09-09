'use client'
import {useMemo,useState} from 'react'
import {financialCore} from '@/lib/financial-core'
import {dreCoreByMonth,type DRECoreMonth} from '@/lib/dre-core'
import ReportPeriodFilter,{type ReportPeriod} from '@/components/report-period-filter'
import {REPORT_MONTHS,competence} from '@/lib/report-period'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${n.toFixed(1).replace('.',',')}%`
const availableYears=Array.from(new Set(financialCore.map((_,i)=>2026))).sort((a,b)=>a-b)
type M={revenue:number;costs:number;opex:number;depreciation:number;fin:number;taxes:number;gross:number;ebitda:number;op:number;net:number}
const empty=():M=>({revenue:0,costs:0,opex:0,depreciation:0,fin:0,taxes:0,gross:0,ebitda:0,op:0,net:0})
const coreToM=(m:DRECoreMonth):M=>({revenue:m.revenue,costs:m.costs,opex:m.opex,depreciation:m.depreciation,fin:m.financialResult,taxes:m.taxes,gross:m.revenue-m.costs,ebitda:m.ebitda,op:m.operatingResult,net:m.netIncome})
const emptyCore=(i:number,year:number):DRECoreMonth=>({month:REPORT_MONTHS[i]||'',year,revenue:0,costs:0,ebitda:0,opex:0,depreciation:0,operatingResult:0,financialResult:0,taxes:0,netIncome:0})
const sum=(a:M,b:M):M=>Object.fromEntries(Object.keys(a).map(k=>[k,(a as any)[k]+(b as any)[k]])) as M
function periodMonths(p:ReportPeriod){const end=Math.max(1,Math.min(12,p.month));return p.view==='mensal'?[end]:Array.from({length:end},(_,i)=>i+1)}

export default function DREGerencial(){
 const [period,setPeriod]=useState<ReportPeriod>({year:availableYears[0]??2026,month:2,view:'mensal'})
 const [view,setView]=useState<'dre'|'orcado'|'comparativo'>('dre')
 const data=useMemo(()=>new Map(Array.from({length:12},(_,i)=>{const key=competence(period.year,i+1);return [key,coreToM(dreCoreByMonth.get(key)||emptyCore(i,period.year))]})),[period.year])
 const months=periodMonths(period)
 const selected=useMemo(()=>months.reduce((a,m)=>sum(a,data.get(competence(period.year,m))||empty()),empty()),[months,data,period.year])
 const prior=useMemo(()=>{
   const previousYear=period.month===1?period.year-1:period.year
   const previousMonth=period.month===1?12:period.month-1
   return data.get(competence(previousYear,previousMonth))||null
 },[period,data])
 const label=period.view==='mensal'?REPORT_MONTHS[period.month-1]:`Jan–${REPORT_MONTHS[period.month-1]}`
 const change=(a:number,b:number)=>b===0?0:(a-b)/Math.abs(b)*100
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>DRE Gerencial</h1><p>Demonstração de resultados • Regime de competência</p></div><ReportPeriodFilter value={period} onChange={p=>setPeriod(p)} years={availableYears}/></header>
  <div className="bp-tabs" style={{marginBottom:18}}><button className={view==='dre'?'active':''} onClick={()=>setView('dre')}>DRE</button><button className={view==='orcado'?'active':''} onClick={()=>setView('orcado')}>Orçado × Realizado</button><button className={view==='comparativo'?'active':''} onClick={()=>setView('comparativo')}>Análise Comparativa</button></div>
  <div className="cards"><Card title="Receita Líquida" value={selected.revenue} sub={label}/><Card title="Lucro Bruto" value={selected.gross} sub={`Margem ${pct(selected.revenue?selected.gross/selected.revenue*100:0)}`}/><Card title="EBITDA" value={selected.ebitda} sub={`Margem ${pct(selected.revenue?selected.ebitda/selected.revenue*100:0)}`}/><Card title="Lucro Líquido" value={selected.net} sub={`Margem ${pct(selected.revenue?selected.net/selected.revenue*100:0)}`}/></div>
  {view==='dre'&&<DreTable selected={selected} label={label} months={months} data={data} period={period}/>} 
  {view==='orcado'&&<BudgetView selected={selected} label={label}/>} 
  {view==='comparativo'&&<CompareView selected={selected} prior={prior} label={label} period={period} change={change}/>} 
 </main>
}

function DreTable({selected,label,months,data,period}:{selected:M;label:string;months:number[];data:Map<string,M>;period:ReportPeriod}){const rows:[string,keyof M,boolean][]=[['Receita Líquida','revenue',false],['(-) Custos','costs',false],['= Lucro Bruto','gross',true],['(-) Despesas Operacionais','opex',false],['= EBITDA','ebitda',true],['(-) Depreciação','depreciation',false],['= Resultado Operacional','op',true],['Resultado Financeiro','fin',false],['(-) Impostos sobre o Resultado','taxes',false],['= Lucro Líquido','net',true]];return <section className="panel wide"><div className="panel-title"><div><h2>DRE — visão {period.view}</h2><span>Competência selecionada: {label}/{period.year}</span></div><span>Financial Core</span></div><div className="table-wrap" style={{overflowX:'auto'}}><table className="dre-table" style={{minWidth:760}}><thead><tr><th style={{textAlign:'left'}}>Linha</th>{months.map(m=><th key={m}>{REPORT_MONTHS[m-1]}</th>)}<th>Total</th></tr></thead><tbody>{rows.map(([name,key,total])=><tr className={total?'total':''} key={key}><td><b>{name}</b></td>{months.map(m=><td className="amount" key={m}>{brl(Number(data.get(competence(period.year,m))?.[key]||0)*(key==='costs'||key==='opex'||key==='depreciation'||key==='taxes'?-1:1))}</td>)}<td className="amount"><b>{brl(Number(selected[key])*(key==='costs'||key==='opex'||key==='depreciation'||key==='taxes'?-1:1))}</b></td></tr>)}</tbody></table></div><div className="note" style={{marginTop:14}}>Mensal = mês selecionado. Acumulado = janeiro até o mês selecionado.</div></section>}
function BudgetView({selected,label}:{selected:M;label:string}){const budget=selected.revenue*.98;const variance=selected.revenue-budget;return <section className="panel wide"><div className="panel-title"><div><h2>Orçado × Realizado</h2><span>{label}</span></div><span>Orçamento demonstrativo</span></div><div className="table-wrap"><table><thead><tr><th style={{textAlign:'left'}}>Indicador</th><th>Orçado</th><th>Realizado</th><th>Var. R$</th><th>Var. %</th></tr></thead><tbody><BudgetRow label="Receita Líquida" budget={budget} actual={selected.revenue}/><BudgetRow label="Resultado Operacional" budget={budget-selected.costs-selected.opex-selected.depreciation} actual={selected.op}/></tbody></table></div><div className="note" style={{marginTop:14}}>O orçamento desta etapa permanece demonstrativo até a integração da base orçamentária oficial por conta, centro de custo e mês.</div><span style={{display:'none'}}>{variance}</span></section>}
function BudgetRow({label,budget,actual}:{label:string;budget:number;actual:number}){const v=actual-budget;return <tr><td><strong>{label}</strong></td><td className="amount">{brl(budget)}</td><td className="amount">{brl(actual)}</td><td className="amount">{brl(v)}</td><td className="amount">{pct(budget?v/budget*100:0)}</td></tr>}
function CompareView({selected,prior,label,period,change}:{selected:M;prior:M|null;label:string;period:ReportPeriod;change:(a:number,b:number)=>number}){const previousLabel=period.month===1?`Dez/${period.year-1}`:`${REPORT_MONTHS[period.month-2]}/${period.year}`;return <section className="panel wide"><div className="panel-title"><div><h2>Análise Comparativa</h2><span>{label} × {previousLabel}</span></div><span>{prior?'Comparativo gerencial':'Sem período anterior disponível'}</span></div><div className="table-wrap"><table><thead><tr><th style={{textAlign:'left'}}>Indicador</th><th>Atual</th><th>Anterior</th><th>Var. %</th></tr></thead><tbody>{([['Receita Líquida','revenue'],['Lucro Bruto','gross'],['EBITDA','ebitda'],['Resultado Operacional','op'],['Lucro Líquido','net']] as [string,keyof M][]).map(([name,key])=><tr key={key}><td><strong>{name}</strong></td><td className="amount">{brl(selected[key])}</td><td className="amount">{prior?brl(prior[key]):'—'}</td><td className="amount">{prior?pct(change(selected[key],prior[key])):'—'}</td></tr>)}</tbody></table></div><div className="note" style={{marginTop:14}}>O comparativo utiliza o mês imediatamente anterior; em janeiro, considera dezembro do ano anterior quando houver base disponível.</div></section>}
function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}

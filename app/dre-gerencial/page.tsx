'use client'

import { useEffect, useMemo, useState } from 'react'
import { statementEngine } from '@/lib/statement-engine'
import { financialEntriesToJournal } from '@/lib/financial-accounting-integration'
import { readFinancialSource } from '@/lib/financial-source'
import { initialEntries, type FinancialEntry } from '@/lib/lancamentos-data'
import { chartOfAccounts, type JournalEntry } from '@/lib/accounting-core'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${n.toFixed(1).replace('.',',')}%`
const MONTHS=Array.from({length:12},(_,i)=>`2026-${String(i+1).padStart(2,'0')}`)
const MONTH_LABELS=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

type Row={code:string;name:string;value:number;level:number;children?:Row[]}
type Monthly={revenue:number;costs:number;opex:number;fin:number;gross:number;op:number;net:number}
type ViewMode='mensal'|'orcado'|'comparativo'

export default function DREGerencial(){
 const[entries,setEntries]=useState<FinancialEntry[]>(initialEntries)
 const[sourceErrors,setSourceErrors]=useState<string[]>([])
 const[expanded,setExpanded]=useState<Set<string>>(new Set())
 const[selectedMonth,setSelectedMonth]=useState('2026-02')
 const[view,setView]=useState<ViewMode>('mensal')
 useEffect(()=>{const source=readFinancialSource();setEntries(source.entries);setSourceErrors(source.errors)},[])
 const integration=useMemo(()=>financialEntriesToJournal(entries),[entries])
 const journal=integration.entries
 const monthlyData=useMemo(()=>buildMonthlyData(journal),[journal])
 const selected=monthlyData.get(selectedMonth)||emptyMonthly()
 const selectedJournal=journal.filter(e=>e.competence===selectedMonth)
 const selectedStatement=useMemo(()=>statementEngine(selectedJournal),[selectedJournal])
 const accountBalances=useMemo(()=>new Map(selectedStatement.dre.map(r=>[r.code,r.balance])),[selectedStatement])
 const dreGroups=useMemo(()=>buildDreHierarchy(accountBalances),[accountBalances])
 const toggle=(code:string)=>setExpanded(prev=>{const next=new Set(prev);next.has(code)?next.delete(code):next.add(code);return next})
 const expandAll=()=>setExpanded(new Set(dreGroups.flatMap(r=>[r.code,...(r.children||[]).map(c=>c.code)])))
 const collapseAll=()=>setExpanded(new Set())
 const monthIndex=Number(selectedMonth.slice(5))-1
 const budgetRows=useMemo(()=>MONTHS.map((m,i)=>{const actual=monthlyData.get(m)||emptyMonthly();return{month:m,label:MONTH_LABELS[i],...actual,budgetRevenue=actual.revenue*0.98,budgetGross=actual.gross*0.96,budgetOp=actual.op*1.04,budgetNet=actual.net*1.04}}),[monthlyData])
 const annualActual=MONTHS.map(m=>monthlyData.get(m)||emptyMonthly()).reduce((a,m)=>sumMonthly(a,m),emptyMonthly())
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>DRE Gerencial</h1><p>Demonstração mensal • Orçado × Realizado • Regime de competência</p></div><div style={{display:'grid',gap:6,justifyItems:'end'}}><span style={{fontSize:10,color:'#718098'}}>MÊS EM ANÁLISE</span><select value={selectedMonth} onChange={e=>{setSelectedMonth(e.target.value);setExpanded(new Set())}} style={selectStyle}>{MONTHS.map((m,i)=><option key={m} value={m}>{MONTH_LABELS[i]}/2026</option>)}</select></div></header>

  <div className="bp-tabs" style={{marginBottom:18}}>
   <button className={view==='mensal'?'active':''} onClick={()=>setView('mensal')}>DRE Mensal</button>
   <button className={view==='orcado'?'active':''} onClick={()=>setView('orcado')}>Orçado × Realizado</button>
   <button className={view==='comparativo'?'active':''} onClick={()=>setView('comparativo')}>Análise Comparativa</button>
  </div>

  <div className="cards"><Card title="Receita Líquida" value={selected.revenue} sub={`${MONTH_LABELS[monthIndex]}/2026`}/><Card title="Lucro Bruto" value={selected.gross} sub={`Margem ${pct(selected.revenue?selected.gross/selected.revenue*100:0)}`}/><Card title="Resultado Operacional" value={selected.op} sub={`Margem ${pct(selected.revenue?selected.op/selected.revenue*100:0)}`}/><Card title="Lucro Líquido" value={selected.net} sub={`Margem ${pct(selected.revenue?selected.net/selected.revenue*100:0)}`}/></div>

  {view==='mensal'&&<section className="panel wide">
   <div className="panel-title"><div><h2>DRE mensal — visão hierárquica</h2><span>Selecione o mês para investigar o detalhe • + expande • − recolhe</span></div><span>Origem: Base financeira → Diário → Razão → Mapeamento Contábil</span></div>
   <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}><button type="button" onClick={expandAll} style={buttonStyle}>Expandir contas</button><button type="button" onClick={collapseAll} style={buttonStyle}>Recolher</button><span style={{fontSize:12,color:'#667085'}}>Conta → subconta → lançamentos do mês selecionado</span></div>
   <div className="table-wrap" style={{overflowX:'auto'}}><table className="dre-table" style={{minWidth:1050}}><thead><tr><th style={{textAlign:'left',minWidth:230}}>Conta</th>{MONTH_LABELS.map(m=><th key={m}>{m}</th>)}<th>Total</th></tr></thead><tbody>
    <MonthlySection label="Receita Líquida" values={MONTHS.map(m=>monthlyData.get(m)?.revenue||0)}/>
    {dreGroups.filter(r=>r.code.startsWith('4')).map(r=><MonthlyDrillRow key={r.code} row={r} journal={journal} selectedMonth={selectedMonth} negative={false} expanded={expanded} toggle={toggle}/>)}
    <MonthlySubtotal label="Lucro Bruto" values={MONTHS.map(m=>monthlyData.get(m)?.gross||0)}/>
    <MonthlySection label="(-) Custos" values={MONTHS.map(m=>-(monthlyData.get(m)?.costs||0))}/>
    {dreGroups.filter(r=>r.code.startsWith('5')).map(r=><MonthlyDrillRow key={r.code} row={r} journal={journal} selectedMonth={selectedMonth} negative expanded={expanded} toggle={toggle}/>)}
    <MonthlySection label="(-) Despesas Operacionais" values={MONTHS.map(m=>-(monthlyData.get(m)?.opex||0))}/>
    {dreGroups.filter(r=>r.code.startsWith('6.1')).map(r=><MonthlyDrillRow key={r.code} row={r} journal={journal} selectedMonth={selectedMonth} negative expanded={expanded} toggle={toggle}/>)}
    <MonthlySubtotal label="Resultado Operacional" values={MONTHS.map(m=>monthlyData.get(m)?.op||0)}/>
    <MonthlySection label="Resultado Financeiro" values={MONTHS.map(m=>-(monthlyData.get(m)?.fin||0))}/>
    {dreGroups.filter(r=>r.code.startsWith('6.2')).map(r=><MonthlyDrillRow key={r.code} row={r} journal={journal} selectedMonth={selectedMonth} negative expanded={expanded} toggle={toggle}/>)}
    <MonthlySubtotal label="Lucro Líquido" values={MONTHS.map(m=>monthlyData.get(m)?.net||0)}/>
   </tbody></table></div>
   <div className="note" style={{marginTop:14}}>A coluna <strong>Total</strong> soma o exercício. O drill-down respeita o mês selecionado: ao abrir uma conta, o sistema mostra as subcontas e, em seguida, os lançamentos daquele mês.</div>
  </section>}

  {view==='orcado'&&<section className="panel wide">
   <div className="panel-title"><div><h2>Orçado × Realizado — visão mensal</h2><span>Comparação por mês e acumulado do exercício</span></div><span>Orçamento demonstrativo • substituir pela base orçamentária oficial</span></div>
   <div className="table-wrap" style={{overflowX:'auto'}}><table className="dre-table" style={{minWidth:900}}><thead><tr><th style={{textAlign:'left'}}>Mês</th><th>Receita Orçada</th><th>Receita Realizada</th><th>Var. R$</th><th>Var. %</th><th>EBITDA Realizado</th></tr></thead><tbody>
    {budgetRows.map(r=><BudgetMonthlyRow key={r.month} label={r.label} budget={r.budgetRevenue} actual={r.revenue} ebitda={r.op}/>)}
    <BudgetMonthlyRow label="TOTAL 2026" budget={budgetRows.reduce((s,r)=>s+r.budgetRevenue,0)} actual={annualActual.revenue} ebitda={annualActual.op} total/>
   </tbody></table></div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,marginTop:16}}>
    <BudgetMetric label="Receita" actual={annualActual.revenue} budget={budgetRows.reduce((s,r)=>s+r.budgetRevenue,0)}/>
    <BudgetMetric label="Resultado Operacional" actual={annualActual.op} budget={budgetRows.reduce((s,r)=>s+r.budgetOp,0)}/>
    <BudgetMetric label="Lucro Líquido" actual={annualActual.net} budget={budgetRows.reduce((s,r)=>s+r.budgetNet,0)}/>
   </div>
   <div className="note" style={{marginTop:14}}>O orçamento exibido nesta etapa é <strong>demonstrativo</strong>, calculado sobre o realizado para validar a experiência. Na próxima integração, ele deverá vir de uma tabela orçamentária própria, por conta, centro de custo e mês.</div>
  </section>}

  {view==='comparativo'&&<section className="panel wide">
   <div className="panel-title"><div><h2>Análise Comparativa</h2><span>Leitura gerencial das variações mensais</span></div><span>Base histórica anterior ainda não cadastrada</span></div>
   <div className="table-wrap" style={{overflowX:'auto'}}><table className="dre-table" style={{minWidth:900}}><thead><tr><th style={{textAlign:'left'}}>Mês</th><th>Receita</th><th>Margem Bruta</th><th>Margem Operacional</th><th>Margem Líquida</th><th>Resultado Operacional</th></tr></thead><tbody>
    {MONTHS.map((m,i)=>{const d=monthlyData.get(m)||emptyMonthly();return <tr key={m}><td><strong>{MONTH_LABELS[i]}/2026</strong></td><td className="amount">{brl(d.revenue)}</td><td className="amount">{pct(d.revenue?d.gross/d.revenue*100:0)}</td><td className="amount">{pct(d.revenue?d.op/d.revenue*100:0)}</td><td className="amount">{pct(d.revenue?d.net/d.revenue*100:0)}</td><td className="amount">{brl(d.op)}</td></tr>})}
    <tr className="total"><td>TOTAL / MÉDIA</td><td className="amount">{brl(annualActual.revenue)}</td><td className="amount">{pct(annualActual.revenue?annualActual.gross/annualActual.revenue*100:0)}</td><td className="amount">{pct(annualActual.revenue?annualActual.op/annualActual.revenue*100:0)}</td><td className="amount">{pct(annualActual.revenue?annualActual.net/annualActual.revenue*100:0)}</td><td className="amount">{brl(annualActual.op)}</td></tr>
   </tbody></table></div>
   <div className="note" style={{marginTop:14}}>A comparação com <strong>2025</strong> ficará disponível assim que a base histórica for carregada. Não estou criando números históricos fictícios para não distorcer os indicadores.</div>
  </section>}

  {(sourceErrors.length>0||integration.errors.length>0)&&<div className="note" style={{marginTop:10,borderLeft:'4px solid #d92d20'}}><strong>Atenção:</strong> {[...sourceErrors,...integration.errors].join(' ')}</div>}
 </main>
}

function emptyMonthly():Monthly{return{revenue:0,costs:0,opex:0,fin:0,gross:0,op:0,net:0}}
function sumMonthly(a:Monthly,b:Monthly):Monthly{return{revenue:a.revenue+b.revenue,costs:a.costs+b.costs,opex:a.opex+b.opex,fin:a.fin+b.fin,gross:a.gross+b.gross,op:a.op+b.op,net:a.net+b.net}}
function buildMonthlyData(journal:JournalEntry[]):Map<string,Monthly>{const result=new Map<string,Monthly>();for(const month of MONTHS){const statement=statementEngine(journal.filter(e=>e.competence===month));const revenue=statement.totals.receitas;const costs=statement.totals.custos;const opex=statement.dre.filter(r=>r.class==='despesa'&&r.code.startsWith('6.1')).reduce((s,r)=>s+r.balance,0);const fin=statement.dre.filter(r=>r.class==='despesa'&&r.code.startsWith('6.2')).reduce((s,r)=>s+r.balance,0);const gross=revenue-costs;const op=gross-opex;const net=op-fin;result.set(month,{revenue,costs,opex,fin,gross,op,net})}return result}
function buildDreHierarchy(balances:Map<string,number>):Row[]{return chartOfAccounts.filter(a=>a.level===2&&['4','5','6'].includes(a.parentCode||'')).map(account=>{const children=chartOfAccounts.filter(a=>a.parentCode===account.code&&a.level===3).map(child=>({code:child.code,name:child.name,value:balances.get(child.code)??0,level:3}));return{code:account.code,name:account.name,value:balances.get(account.code)??0,level:2,children}})}
function monthlyAccountValue(journal:JournalEntry[],month:string,code:string,negative:boolean){const statement=statementEngine(journal.filter(e=>e.competence===month));const row=statement.dre.find(r=>r.code===code);const value=row?.balance??0;return negative?-Math.abs(value):Math.abs(value)}
function ExpandIcon({open,onClick,label}:{open:boolean;onClick:()=>void;label:string}){return <button type="button" className="expand-btn" aria-label={open?`Recolher ${label}`:`Expandir ${label}`} onClick={e=>{e.stopPropagation();onClick()}}>{open?'−':'+'}</button>}
function MonthlyDrillRow({row,journal,selectedMonth,negative=false,expanded,toggle}:{row:Row;journal:JournalEntry[];selectedMonth:string;negative?:boolean;expanded:Set<string>;toggle:(code:string)=>void}){const open=expanded.has(row.code);const values=MONTHS.map(m=>monthlyAccountValue(journal,m,row.code,negative));const total=values.reduce((s,v)=>s+v,0);const children=row.children||[];const movements=journal.filter(e=>e.competence===selectedMonth&&e.lines.some(l=>l.account===row.code));return <><tr className="group-row" onClick={()=>toggle(row.code)} style={{cursor:'pointer'}}><td><ExpandIcon open={open} onClick={()=>toggle(row.code)} label={`${row.code} — ${row.name}`}/><strong>{row.code} — {row.name}</strong></td>{values.map((v,i)=><td key={MONTHS[i]} className="amount">{brl(v)}</td>)}<td className="amount"><strong>{brl(total)}</strong></td></tr>{open&&children.map(child=><MonthlyChild key={child.code} row={child} journal={journal} selectedMonth={selectedMonth} negative={negative} expanded={expanded} toggle={toggle}/>)}{open&&children.length===0&&movements.map(entry=><JournalMovement key={`${row.code}-${entry.id}`} entry={entry} accountCode={row.code} negative={negative}/>)}</>}
function MonthlyChild({row,journal,selectedMonth,negative,expanded,toggle}:{row:Row;journal:JournalEntry[];selectedMonth:string;negative:boolean;expanded:Set<string>;toggle:(code:string)=>void}){const open=expanded.has(row.code);const values=MONTHS.map(m=>monthlyAccountValue(journal,m,row.code,negative));const total=values.reduce((s,v)=>s+v,0);const movements=journal.filter(e=>e.competence===selectedMonth&&e.lines.some(l=>l.account===row.code));return <><tr className="item-row" onClick={()=>toggle(row.code)} style={{cursor:'pointer',background:'#fafbfc'}}><td style={{paddingLeft:30}}><ExpandIcon open={open} onClick={()=>toggle(row.code)} label={`${row.code} — ${row.name}`}/>↳ {row.code} — {row.name}</td>{values.map((v,i)=><td key={MONTHS[i]} className="amount">{brl(v)}</td>)}<td className="amount">{brl(total)}</td></tr>{open&&movements.map(entry=><JournalMovement key={`${row.code}-${entry.id}`} entry={entry} accountCode={row.code} negative={negative}/>)}</>}
function JournalMovement({entry,accountCode,negative}:{entry:JournalEntry;accountCode:string;negative:boolean}){const line=entry.lines.find(l=>l.account===accountCode);if(!line)return null;const raw=line.debit-line.credit;const value=negative?-Math.abs(raw):-raw;return <tr style={{background:'#f6f8fb',fontSize:12}}><td style={{paddingLeft:70,color:'#475467'}}>↳ {entry.date} • {entry.description}{entry.document?` • Doc. ${entry.document}`:''}{entry.costCenter?` • CC ${entry.costCenter}`:''}</td>{MONTHS.map(m=><td key={m} className="amount">{m===entry.competence?brl(value):'—'}</td>)}<td className="amount">{brl(value)}</td></tr>}
function MonthlySection({label,values}:{label:string;values:number[]}){return <tr><td><b>{label}</b></td>{values.map((v,i)=><td key={MONTHS[i]} className="amount"><b>{brl(v)}</b></td>)}<td className="amount"><b>{brl(values.reduce((s,v)=>s+v,0))}</b></td></tr>}
function MonthlySubtotal({label,values}:{label:string;values:number[]}){return <tr className="total"><td>= {label}</td>{values.map((v,i)=><td key={MONTHS[i]} className="amount">{brl(v)}</td>)}<td className="amount">{brl(values.reduce((s,v)=>s+v,0))}</td></tr>}
function BudgetMonthlyRow({label,budget,actual,ebitda,total=false}:{label:string;budget:number;actual:number;ebitda:number;total?:boolean}){const variance=actual-budget;const variancePct=budget?variance/Math.abs(budget):0;return <tr className={total?'total':''}><td><strong>{label}</strong></td><td className="amount">{brl(budget)}</td><td className="amount">{brl(actual)}</td><td className="amount">{brl(variance)}</td><td className="amount">{pct(variancePct*100)}</td><td className="amount">{brl(ebitda)}</td></tr>}
function BudgetMetric({label,actual,budget}:{label:string;actual:number;budget:number}){const variance=actual-budget;const p=budget?variance/Math.abs(budget):0;return <div className="card"><span>{label}</span><strong>{brl(actual)}</strong><small>Orçado {brl(budget)} • Var. {pct(p*100)}</small></div>}
function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}
const buttonStyle:React.CSSProperties={border:'1px solid #d0d5dd',background:'#fff',borderRadius:7,padding:'7px 10px',fontSize:12,color:'#344054',cursor:'pointer'}
const selectStyle:React.CSSProperties={border:'1px solid #dbe1e8',background:'#fff',borderRadius:8,padding:'8px 10px',color:'#172033',fontSize:12,minWidth:120}

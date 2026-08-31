'use client'

import { useEffect, useMemo, useState } from 'react'
import { statementEngine } from '@/lib/statement-engine'
import { financialEntriesToJournal } from '@/lib/financial-accounting-integration'
import { readFinancialSource } from '@/lib/financial-source'
import { initialEntries, type FinancialEntry } from '@/lib/lancamentos-data'
import { chartOfAccounts, type JournalEntry } from '@/lib/accounting-core'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct = (n:number) => `${n.toFixed(1).replace('.',',')}%`

type Row = { code:string; name:string; value:number; level:number; children?:Row[] }

export default function DREGerencial() {
  const [entries, setEntries] = useState<FinancialEntry[]>(initialEntries)
  const [sourceErrors, setSourceErrors] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    const source = readFinancialSource()
    setEntries(source.entries)
    setSourceErrors(source.errors)
  }, [])

  const integration = useMemo(() => financialEntriesToJournal(entries), [entries])
  const journal = integration.entries
  const { dre, totals } = useMemo(() => statementEngine(journal), [journal])

  const accountBalances = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of dre) map.set(row.code, row.balance)
    return map
  }, [dre])

  const receita = totals.receitas
  const custos = totals.custos
  const despesasOp = dre.filter(r => r.class === 'despesa' && r.code.startsWith('6.1')).reduce((s,r)=>s+r.balance,0)
  const despesasFin = dre.filter(r => r.class === 'despesa' && r.code.startsWith('6.2')).reduce((s,r)=>s+r.balance,0)
  const lucroBruto = receita - custos
  const resultadoOperacional = lucroBruto - despesasOp
  const resultadoFinanceiro = -despesasFin
  const lucroLiquido = resultadoOperacional + resultadoFinanceiro
  const margemBruta = receita ? lucroBruto / receita : 0
  const margemOp = receita ? resultadoOperacional / receita : 0
  const margemLiq = receita ? lucroLiquido / receita : 0

  const toggle = (code:string) => setExpanded(prev => {
    const next = new Set(prev)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    return next
  })

  const dreGroups = useMemo(() => buildDreHierarchy(accountBalances), [accountBalances])

  return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
    <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>DRE Gerencial</h1><p>Demonstração detalhada • Orçado × Realizado • Regime de competência</p></div><div className="period">Jan–Dez 2026</div></header>
    <div className="cards">
      <Card title="Receita Líquida" value={receita} sub="Realizado" />
      <Card title="Lucro Bruto" value={lucroBruto} sub={`Margem ${pct(margemBruta*100)}`} />
      <Card title="Resultado Operacional" value={resultadoOperacional} sub={`Margem ${pct(margemOp*100)}`} />
      <Card title="Lucro Líquido" value={lucroLiquido} sub={`Margem ${pct(margemLiq*100)}`} />
    </div>

    <section className="panel wide">
      <div className="panel-title">
        <div><h2>DRE detalhada — visão hierárquica</h2><span>Clique nas contas para fazer o drill-down</span></div>
        <span>Origem: Base financeira → Diário → Razão → Mapeamento Contábil</span>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <span style={{fontSize:12,color:'#667085'}}>Padrão de navegação: <strong>+</strong> expandir • <strong>−</strong> recolher</span>
      </div>

      <table><thead><tr><th style={{textAlign:'left'}}>Conta</th><th>Realizado</th><th>% Receita</th></tr></thead><tbody>
        <Section label="Receita Líquida" value={receita} pct={1}/>
        {dreGroups.filter(r=>r.code.startsWith('4')).map(r=><DrillRow key={r.code} row={r} base={receita} journal={journal} expanded={expanded} toggle={toggle}/>) }
        <Subtotal label="Lucro Bruto" value={lucroBruto} pct={margemBruta}/>
        <Section label="(-) Custos" value={-custos} pct={receita ? -custos/receita : 0}/>
        {dreGroups.filter(r=>r.code.startsWith('5')).map(r=><DrillRow key={r.code} row={r} base={receita} negative journal={journal} expanded={expanded} toggle={toggle}/>) }
        <Section label="(-) Despesas Operacionais" value={-despesasOp} pct={receita ? -despesasOp/receita : 0}/>
        {dreGroups.filter(r=>r.code.startsWith('6.1')).map(r=><DrillRow key={r.code} row={r} base={receita} negative journal={journal} expanded={expanded} toggle={toggle}/>) }
        <Subtotal label="Resultado Operacional" value={resultadoOperacional} pct={margemOp}/>
        <Section label="Resultado Financeiro" value={resultadoFinanceiro} pct={receita ? resultadoFinanceiro/receita : 0}/>
        {dreGroups.filter(r=>r.code.startsWith('6.2')).map(r=><DrillRow key={r.code} row={r} base={receita} negative journal={journal} expanded={expanded} toggle={toggle}/>) }
        <Subtotal label="Lucro Líquido" value={lucroLiquido} pct={margemLiq}/>
      </tbody></table>
      <div className="note" style={{marginTop:14}}>O drill-down parte da conta sintética, abre a conta analítica e, em seguida, mostra os lançamentos que formam aquele saldo. Alterações nos lançamentos continuam refletindo nesta demonstração através do motor integrado.</div>
      {(sourceErrors.length > 0 || integration.errors.length > 0) && <div className="note" style={{marginTop:10,borderLeft:'4px solid #d92d20'}}><strong>Atenção:</strong> {[...sourceErrors, ...integration.errors].join(' ')}</div>}
    </section>

    <section className="panel"><div className="panel-title"><h2>Orçado × Realizado</h2><span>Visão gerencial</span></div>
      <table><thead><tr><th style={{textAlign:'left'}}>Indicador</th><th>Orçado</th><th>Realizado</th><th>Var. R$</th><th>Var. %</th></tr></thead><tbody>
        <BudgetRow name="Receita Líquida" actual={receita} budget={receita*0.9998}/>
        <BudgetRow name="Lucro Bruto" actual={lucroBruto} budget={lucroBruto*0.98}/>
        <BudgetRow name="Resultado Operacional" actual={resultadoOperacional} budget={resultadoOperacional*1.02}/>
        <BudgetRow name="Lucro Líquido" actual={lucroLiquido} budget={lucroLiquido*1.02}/>
      </tbody></table>
    </section>
  </main>
}

function buildDreHierarchy(balances:Map<string,number>):Row[] {
  return chartOfAccounts
    .filter(a => a.level === 2 && ['4','5','6'].includes(a.parentCode || ''))
    .map(account => {
      const children = chartOfAccounts
        .filter(a => a.parentCode === account.code && a.level === 3)
        .map(child => ({code:child.code,name:child.name,value:balances.get(child.code) ?? 0,level:3}))
      return {code:account.code,name:account.name,value:balances.get(account.code) ?? 0,level:2,children}
    })
}

function ExpandIcon({open, onClick, label}:{open:boolean;onClick:()=>void;label:string}) {
  return <button
    type="button"
    className="expand-btn"
    aria-label={open ? `Recolher ${label}` : `Expandir ${label}`}
    onClick={(event)=>{event.stopPropagation();onClick()}}
  >{open ? '−' : '+'}</button>
}

function DrillRow({row,base,negative=false,journal,expanded,toggle}:{row:Row;base:number;negative?:boolean;journal:JournalEntry[];expanded:Set<string>;toggle:(code:string)=>void}) {
  const open = expanded.has(row.code)
  const value = statementValue(row.value, negative)
  return <>
    <tr className="group-row" onClick={() => toggle(row.code)} style={{cursor:'pointer'}}>
      <td style={{fontWeight:700}}><ExpandIcon open={open} onClick={()=>toggle(row.code)} label={`${row.code} — ${row.name}`}/>{row.code} — {row.name}</td>
      <td style={{fontWeight:700}}>{brl(value)}</td>
      <td style={{fontWeight:700}}>{base ? Math.abs(value/base).toLocaleString('pt-BR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1}) : '—'}</td>
    </tr>
    {open && (row.children || []).map(child => <DrillChild key={child.code} row={child} base={base} negative={negative} journal={journal} expanded={expanded} toggle={toggle}/>) }
  </>
}

function DrillChild({row,base,negative,journal,expanded,toggle}:{row:Row;base:number;negative:boolean;journal:JournalEntry[];expanded:Set<string>;toggle:(code:string)=>void}) {
  const open = expanded.has(row.code)
  const value = statementValue(row.value, negative)
  const movements = journal.filter(entry => entry.lines.some(line => line.account === row.code))
  return <>
    <tr className="item-row" onClick={() => toggle(row.code)} style={{cursor:'pointer',background:'#fafbfc'}}>
      <td style={{paddingLeft:36}}><ExpandIcon open={open} onClick={()=>toggle(row.code)} label={`${row.code} — ${row.name}`}/>{row.code} — {row.name}</td>
      <td>{brl(value)}</td>
      <td>{base ? Math.abs(value/base).toLocaleString('pt-BR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1}) : '—'}</td>
    </tr>
    {open && movements.map(entry => <JournalMovement key={`${row.code}-${entry.id}`} entry={entry} accountCode={row.code} negative={negative}/>) }
  </>
}

function JournalMovement({entry,accountCode,negative}:{entry:JournalEntry;accountCode:string;negative:boolean}) {
  const line = entry.lines.find(l => l.account === accountCode)
  if (!line) return null
  const raw = line.debit - line.credit
  const value = negative ? -Math.abs(raw) : -raw
  return <tr style={{background:'#f6f8fb',fontSize:12}}>
    <td style={{paddingLeft:70,color:'#475467'}}>↳ {entry.date} • {entry.description}{entry.document ? ` • Doc. ${entry.document}` : ''}{entry.costCenter ? ` • CC ${entry.costCenter}` : ''}</td>
    <td>{brl(value)}</td>
    <td style={{color:'#667085'}}>{entry.competence || '—'}</td>
  </tr>
}

function statementValue(value:number,negative:boolean){ return negative ? -Math.abs(value) : Math.abs(value) }
function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}
function Section({label,value,pct}:{label:string;value:number;pct:number}){return <tr><td><b>{label}</b></td><td><b>{brl(value)}</b></td><td><b>{pct*100===0?'—':pct.toLocaleString('pt-BR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1})}</b></td></tr>}
function Subtotal({label,value,pct}:{label:string;value:number;pct:number}){return <tr style={{fontWeight:700,background:'#f5f7fa'}}><td>= {label}</td><td>{brl(value)}</td><td>{pct.toLocaleString('pt-BR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1})}</td></tr>}
function BudgetRow({name,actual,budget}:{name:string;actual:number;budget:number}){const v=actual-budget;const p=budget?Math.abs(v/budget):0;return <tr><td>{name}</td><td>{brl(budget)}</td><td>{brl(actual)}</td><td>{brl(v)}</td><td>{p.toLocaleString('pt-BR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1})}</td></tr>}
const buttonStyle:React.CSSProperties={border:'1px solid #d0d5dd',background:'#fff',borderRadius:7,padding:'7px 10px',fontSize:12,color:'#344054',cursor:'pointer'}

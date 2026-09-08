'use client'

import { useEffect, useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import type { FinancialEntry } from '@/lib/lancamentos-data'
import { initialBudget, type BudgetPlan } from '@/lib/budget-plan-data'
import { readBudgetPlan, writeBudgetPlan } from '@/lib/budget-realizado-store'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct = (n:number) => `${(n*100).toFixed(1).replace('.',',')}%`
const months = initialBudget.map(r=>r.month)

type Actual = { revenue:number; cost:number; opex:number; capex:number }
type Row = BudgetPlan & Actual & { ebitdaBudget:number; ebitdaActual:number }

function actualFor(entries:FinancialEntry[], monthIndex:number):Actual {
  const competence = `2026-${String(monthIndex+1).padStart(2,'0')}`
  const current = entries.filter(e=>e.competence===competence)
  const revenue = current.filter(e=>e.type==='Receita').reduce((s,e)=>s+Math.abs(e.value),0)
  const capex = current.filter(e=>e.type==='CAPEX').reduce((s,e)=>s+Math.abs(e.value),0)
  const expenses = current.filter(e=>e.type==='Despesa')
  const cost = expenses.filter(e=>/(cmv|custo|produção|producao|mercadoria|serviço direto|servico direto)/i.test(`${e.category} ${e.description}`)).reduce((s,e)=>s+Math.abs(e.value),0)
  const opex = expenses.reduce((s,e)=>s+Math.abs(e.value),0)-cost
  return {revenue,cost,opex,capex}
}

export default function BudgetRealizado(){
  const [budget,setBudget]=useState<BudgetPlan[]>(initialBudget)
  const [entries,setEntries]=useState<FinancialEntry[]>([])
  const [start,setStart]=useState(0)
  const [end,setEnd]=useState(11)
  const [editing,setEditing]=useState(false)
  const [saved,setSaved]=useState(false)

  useEffect(()=>{ setBudget(readBudgetPlan()); setEntries(readFinancialSource().entries) },[])
  useEffect(()=>{ if (saved) writeBudgetPlan(budget) },[budget,saved])

  const rows=useMemo<Row[]>(()=>budget.map((b,i)=>{const a=actualFor(entries,i);return {...b,...a,ebitdaBudget:b.revenue-b.cost-b.opex,ebitdaActual:a.revenue-a.cost-a.opex}}),[budget,entries])
  const visible=rows.slice(start,end+1)
  const total=(field:keyof Row)=>visible.reduce((s,r)=>s+Number(r[field]||0),0)
  const revenueVar=total('revenueActual')-total('revenue')
  const costVar=total('costActual')-total('cost')
  const opexVar=total('opexActual')-total('opex')
  const ebitdaVar=total('ebitdaActual')-total('ebitdaBudget')
  const favorable=(kind:'revenue'|'expense'|'ebitda',v:number)=>kind==='expense'?v<=0:v>=0

  function updateBudget(index:number,field:'revenue'|'cost'|'opex'|'capex',value:string){
    const numeric=Number(value.replace(',','.'))
    setBudget(prev=>prev.map((r,i)=>i===index?{...r,[field]:Number.isFinite(numeric)?numeric:0}:r))
    setSaved(true)
  }

  return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
    <header><div><small>PLANEJAMENTO E CONTROLADORIA</small><h1>Orçamento × Realizado</h1><p>Planejamento • execução • desvios • projeção gerencial</p></div><div className="period-controls"><label>Período de análise</label><div><select value={start} onChange={e=>setStart(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i}>Início: {m}/2026</option>)}</select><select value={end} onChange={e=>setEnd(Math.max(start,Number(e.target.value)))}>{months.map((m,i)=><option key={m} value={i}>Fim: {m}/2026</option>)}</select></div></div></header>

    <div className="cards"><Card title="Receita Realizada" value={total('revenueActual')} sub={`Orçamento ${brl(total('revenue'))}`}/><Card title="EBITDA Realizado" value={total('ebitdaActual')} sub={`Desvio ${brl(ebitdaVar)}`}/><Card title="Desvio Receita" value={revenueVar} sub={`${favorable('revenue',revenueVar)?'Favorável':'Desfavorável'} • R − O`}/><Card title="Desvio OPEX" value={opexVar} sub={`${favorable('expense',opexVar)?'Favorável':'Desfavorável'} • R − O`}/></div>

    <section className="panel wide"><div className="panel-title"><h2>Visão mensal</h2><span>Orçamento × realizado • fonte: lançamentos</span></div><div className="table-wrap"><table><thead><tr><th>Indicador</th>{visible.map(r=><th key={r.month}>{r.month}</th>)}<th>Total</th></tr></thead><tbody>
      <Line label="Receita • Orçamento" rows={visible} field="revenue" total={total('revenue')}/><Line label="Receita • Realizado" rows={visible} field="revenueActual" total={total('revenueActual')}/>
      <Line label="Custos • Orçamento" rows={visible} field="cost" total={total('cost')}/><Line label="Custos • Realizado" rows={visible} field="costActual" total={total('costActual')}/>
      <Line label="OPEX • Orçamento" rows={visible} field="opex" total={total('opex')}/><Line label="OPEX • Realizado" rows={visible} field="opexActual" total={total('opexActual')}/>
      <Line label="CAPEX • Orçamento" rows={visible} field="capex" total={total('capex')}/><Line label="CAPEX • Realizado" rows={visible} field="capexActual" total={total('capexActual')}/>
      <Line label="EBITDA • Orçamento" rows={visible} field="ebitdaBudget" total={total('ebitdaBudget')}/><Line label="EBITDA • Realizado" rows={visible} field="ebitdaActual" total={total('ebitdaActual')}/>
    </tbody></table></div></section>

    <div className="grid"><section className="panel"><div className="panel-title"><h2>Principais desvios</h2><span>Realizado − Orçamento</span></div><div className="rows"><Deviation label="Receita" value={revenueVar} favorable={favorable('revenue',revenueVar)}/><Deviation label="Custos" value={costVar} favorable={favorable('expense',costVar)}/><Deviation label="OPEX" value={opexVar} favorable={favorable('expense',opexVar)}/><Deviation label="EBITDA" value={ebitdaVar} favorable={favorable('ebitda',ebitdaVar)}/></div></section><section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Controladoria</span></div><div className="note"><strong>{ebitdaVar>=0?'EBITDA acima do orçamento':'EBITDA abaixo do orçamento'}</strong><p>Receita positiva acima do orçamento é favorável. Para custos e OPEX, desvio negativo é favorável. O objetivo é transformar o desvio em ação de gestão.</p></div></section></div>

    <section className="panel wide"><div className="panel-title"><h2>Orçamento por mês</h2><span>{editing?'Edição habilitada':'Somente consulta'}</span><button className="primary-btn" onClick={()=>setEditing(v=>!v)}>{editing?'Concluir edição':'Editar orçamento'}</button></div><div className="table-wrap"><table><thead><tr><th>Mês</th><th>Receita</th><th>Custos</th><th>OPEX</th><th>CAPEX</th><th>EBITDA</th></tr></thead><tbody>{budget.map((r,i)=><tr key={r.month}><td><b>{r.month}/2026</b></td>{(['revenue','cost','opex','capex'] as const).map(field=><td key={field}>{editing?<input inputMode="decimal" value={r[field]} onChange={e=>updateBudget(i,field,e.target.value)} style={{width:120}}/>:brl(r[field])}</td>)}<td><b>{brl(r.revenue-r.cost-r.opex)}</b></td></tr>)}</tbody></table></div>{saved&&<div className="note">Orçamento salvo localmente no navegador. Na próxima evolução, essa base será migrada para persistência por empresa/usuário.</div>}</section>

    <section className="panel wide"><div className="panel-title"><h2>Regra de análise</h2><span>Governança gerencial</span></div><div className="note"><strong>Realizado − Orçamento</strong> é a regra central. O sistema classifica automaticamente o desvio conforme a natureza da conta e preserva separadamente Receita, Custos, OPEX e CAPEX. Os realizados vêm da base única de lançamentos, enquanto o orçamento possui uma base própria e editável.</div></section>
  </main>
}
function Line({label,rows,field,total}:{label:string;rows:Row[];field:keyof Row;total:number}){return <tr><td><b>{label}</b></td>{rows.map(r=><td key={r.month}>{brl(Number(r[field]||0))}</td>)}<td><b>{brl(total)}</b></td></tr>}
function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}
function Deviation({label,value,favorable}:{label:string;value:number;favorable:boolean}){return <div className="row"><span>{label}</span><b className={favorable?'positive':'negative'}>{brl(value)} • {favorable?'Favorável':'Desfavorável'}</b></div>}

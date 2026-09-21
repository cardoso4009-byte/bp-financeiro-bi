'use client'

import { useEffect, useMemo, useState } from 'react'
import ReportPeriodFilter, { type ReportPeriod } from '@/components/report-period-filter'
import { DEFAULT_REPORT_PERIOD, competence, monthLabel } from '@/lib/report-period'
import { readV2BrowserStore } from '@/lib/v2-browser-storage'
import { readV2CostCenters } from '@/lib/v2-cost-center-storage'
import { buildV2FinancialBase } from '@/lib/v2-financial-base'
import { buildV2BudgetReport, type V2BudgetEntry } from '@/lib/v2-budget'
import { readV2BudgetEntries, writeV2BudgetEntries } from '@/lib/v2-budget-storage'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number|undefined)=>n===undefined?'—':`${(n*100).toFixed(1).replace('.',',')}%`

export default function BudgetRealizadoV2(){
 const [period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,month:12})
 const [entries,setEntries]=useState<ReturnType<typeof readV2BrowserStore>['entries']>([])
 const [budget,setBudget]=useState<V2BudgetEntry[]>([])
 const [editing,setEditing]=useState(false)
 const [saved,setSaved]=useState(false)

 useEffect(()=>{setEntries(readV2BrowserStore().entries);setBudget(readV2BudgetEntries())},[])

 const selected=competence(period.year,period.month)
 const base=useMemo(()=>buildV2FinancialBase(entries),[entries])
 const centers=useMemo(()=>readV2CostCenters(),[])
 const report=useMemo(()=>buildV2BudgetReport(base,budget,centers,selected),[base,budget,centers,selected])
 const months=useMemo(()=>Array.from({length:period.view==='acumulado'?period.month:1},(_,i)=>i+1),[period])
 const monthReports=useMemo(()=>months.map(month=>buildV2BudgetReport(base,budget,centers,competence(period.year,month))),[base,budget,centers,months,period.year])
 const line=(movementClass:V2BudgetEntry['movementClass'])=>report.lines.filter(x=>x.movementClass===movementClass).reduce((s,x)=>s+x.budget,0)
 const actual=(movementClass:V2BudgetEntry['movementClass'])=>report.lines.filter(x=>x.movementClass===movementClass).reduce((s,x)=>s+x.actual,0)

 function update(month:number,movementClass:V2BudgetEntry['movementClass'],raw:string){
  const value=Number(raw.replace(',','.'))||0
  const periodKey=competence(period.year,month)
  setBudget(prev=>prev.map(item=>item.period===periodKey&&item.movementClass===movementClass?{...item,amount:movementClass==='receita'||movementClass==='capex'?value:-Math.abs(value)}:item))
  setSaved(true)
 }
 function save(){writeV2BudgetEntries(budget);setSaved(true);setEditing(false)}

 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA GERENCIAL · V2</small><h1>Orçamento × Realizado</h1><p>Planejamento, execução e desvios sobre a Base Financeira V2</p></div><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/></header>
  <div className="cards">
   <div className="card"><span>Orçamento</span><strong>{brl(report.budgetTotal)}</strong><small>{selected}</small></div>
   <div className="card"><span>Realizado</span><strong>{brl(report.actualTotal)}</strong><small>{report.actualEntries} lançamento(s)</small></div>
   <div className="card"><span>Variação</span><strong>{brl(report.varianceTotal)}</strong><small>Realizado − Orçado</small></div>
   <div className="card"><span>Linhas orçamentárias</span><strong>{report.budgetEntries}</strong><small>{report.unassignedBudgetEntries} sem centro</small></div>
  </div>
  <section className="panel">
   <div className="panel-title"><div><h2>Resumo gerencial</h2><span>Competência {selected}</span></div><span>Fonte: Base Financeira V2</span></div>
   <div className="rows">
    {(['receita','custo','opex','capex'] as const).map(kind=><div className="row" key={kind}><span>{kind.toUpperCase()}</span><b>{brl(actual(kind)-line(kind))} <small style={{fontWeight:400}}>({pct(report.lines.find(x=>x.movementClass===kind)?.variancePercent)})</small></b></div>)}
   </div>
   <div className="note" style={{marginTop:12}}>A variação é calculada como <strong>Realizado − Orçado</strong>. Receita e CAPEX usam sinal positivo; Custos e OPEX usam sinal gerencial negativo. Nenhuma diferença altera os lançamentos V2.</div>
  </section>
  <section className="panel">
   <div className="panel-title"><h2>Orçado × Realizado por competência</h2><span>{period.view==='acumulado'?'Acumulado':'Mês selecionado'}</span></div>
   <div className="table-wrap" style={{overflowX:'auto'}}><table><thead><tr><th>Período</th><th>Receita Orç.</th><th>Receita Real.</th><th>OPEX Orç.</th><th>OPEX Real.</th><th>EBITDA Orç.</th><th>EBITDA Real.</th><th>Var. EBITDA</th></tr></thead><tbody>{monthReports.map((r,i)=>{const b=k=>r.lines.filter(x=>x.movementClass===k).reduce((s,x)=>s+x.budget,0);const a=k=>r.lines.filter(x=>x.movementClass===k).reduce((s,x)=>s+x.actual,0);const eb=b('receita')+b('custo')+b('opex');const ea=a('receita')+a('custo')+a('opex');return <tr key={r.period}><td><strong>{monthLabel(i+1)}/{period.year}</strong></td><td>{brl(b('receita'))}</td><td>{brl(a('receita'))}</td><td>{brl(b('opex'))}</td><td>{brl(a('opex'))}</td><td>{brl(eb)}</td><td>{brl(ea)}</td><td><strong>{brl(ea-eb)}</strong></td></tr>})}</tbody></table></div>
  </section>
  <section className="panel">
   <div className="panel-title"><div><h2>Orçamento por competência</h2><span>{editing?'Edição habilitada':'Consulta'}</span></div><button className="primary-btn" onClick={()=>editing?save():setEditing(true)}>{editing?'Salvar orçamento':'Editar orçamento'}</button></div>
   <div className="table-wrap" style={{overflowX:'auto'}}><table><thead><tr><th>Competência</th><th>Receita</th><th>Custos</th><th>OPEX</th><th>CAPEX</th><th>EBITDA</th></tr></thead><tbody>{budget.filter(x=>x.period.startsWith(String(period.year))).filter(x=>x.movementClass==='receita').map(revenue=>{const m=Number(revenue.period.slice(5));const get=k=>budget.find(x=>x.period===revenue.period&&x.movementClass===k);const cost=get('custo');const opex=get('opex');const capex=get('capex');const ebitda=revenue.amount+(cost?.amount??0)+(opex?.amount??0);return <tr key={revenue.period}><td><strong>{monthLabel(m)}/{period.year}</strong></td>{[['receita',revenue],['custo',cost],['opex',opex],['capex',capex]].map(([kind,item]:any)=><td key={kind}>{editing?<input inputMode="decimal" value={Math.abs(item?.amount??0)} onChange={e=>update(m,kind,e.target.value)} style={{width:120}}/>:brl(item?.amount??0)}</td>)}<td><strong>{brl(ebitda)}</strong></td></tr>})}</tbody></table></div>
   {saved&&<div className="note" style={{marginTop:12}}>Orçamento persistido localmente. A próxima evolução pode migrar esta mesma estrutura para persistência por empresa/usuário sem alterar o motor de comparação.</div>}
  </section>
  <section className="panel">
   <div className="panel-title"><h2>Governança</h2><span>Sem rateio</span></div>
   <div className="note"><strong>Orçamento e realizado são bases distintas.</strong> O realizado vem exclusivamente dos lançamentos V2 persistidos. O orçamento é explícito, pode existir sem realizado e vice-versa. Centros de resultado sem classificação permanecem como SEM-CC; nenhuma diferença é fechada artificialmente.</div>
  </section>
 </main>
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import type { FinancialEntry } from '@/lib/lancamentos-data'
import { initialBudget, type BudgetPlan } from '@/lib/budget-plan-data'
import { readBudgetPlan, writeBudgetPlan } from '@/lib/budget-realizado-store'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct = (n:number) => `${(n*100).toFixed(1).replace('.',',')}%`
const months = initialBudget.map(r=>r.month)
const thresholds = { warning: 0.03, critical: 0.05 }

type Actual = { revenueActual:number; costActual:number; opexActual:number; capexActual:number }
type Row = BudgetPlan & Actual & { ebitdaBudget:number; ebitdaActual:number }
type DeviationKind = 'revenue'|'expense'|'ebitda'
type Severity = 'normal'|'attention'|'critical'
type Analytic = { name:string; value:number; share:number }

function actualFor(entries:FinancialEntry[], monthIndex:number):Actual {
  const competence = `2026-${String(monthIndex+1).padStart(2,'0')}`
  const current = entries.filter(e=>e.competence===competence)
  const revenueActual = current.filter(e=>e.type==='Receita').reduce((s,e)=>s+Math.abs(e.value),0)
  const capexActual = current.filter(e=>e.type==='CAPEX').reduce((s,e)=>s+Math.abs(e.value),0)
  const expenses = current.filter(e=>e.type==='Despesa')
  const costActual = expenses.filter(e=>/(cmv|custo|produção|producao|mercadoria|serviço direto|servico direto)/i.test(`${e.category} ${e.description}`)).reduce((s,e)=>s+Math.abs(e.value),0)
  const opexActual = expenses.reduce((s,e)=>s+Math.abs(e.value),0)-costActual
  return { revenueActual,costActual,opexActual,capexActual }
}

function deviationPercent(actual:number,budget:number){ return budget===0 ? (actual===0?0:1) : (actual-budget)/Math.abs(budget) }
function severity(kind:DeviationKind, deviation:number):Severity { const rate=Math.abs(deviation); if(rate>=thresholds.critical)return 'critical'; if(rate>=thresholds.warning)return 'attention'; return 'normal' }
function isFavorable(kind:DeviationKind,value:number){ return kind==='expense' ? value<=0 : value>=0 }
function statusDot(s:Severity){ return s==='critical'?'🔴':s==='attention'?'🟡':'🟢' }
function classify(label:string){
  const normalized=label.toLowerCase()
  if(/salário|salario|folha|pessoal|rh/.test(normalized)) return 'Pessoal'
  if(/marketing|publicidade|propaganda|comercial|vendas/.test(normalized)) return 'Comercial & Marketing'
  if(/aluguel|condomínio|condominio|energia|água|agua|telefone|internet|administr/.test(normalized)) return 'Administrativo'
  if(/tecnologia|software|sistema|ti|cloud/.test(normalized)) return 'Tecnologia'
  return 'Outros'
}

function groupEntries(entries:FinancialEntry[],competences:Set<string>,type:'opex'|'capex'):Analytic[]{
  const map=new Map<string,number>()
  entries.filter(e=>competences.has(e.competence)).forEach(e=>{
    const isCapex=e.type==='CAPEX'
    const isExpense=e.type==='Despesa'
    const isCost=isExpense && /(cmv|custo|produção|producao|mercadoria|serviço direto|servico direto)/i.test(`${e.category} ${e.description}`)
    if((type==='capex'&&isCapex)||(type==='opex'&&isExpense&&!isCost)){
      const key=type==='capex' ? (e.category?.trim()||'Sem categoria') : classify(`${e.category} ${e.description}`)
      map.set(key,(map.get(key)||0)+Math.abs(e.value))
    }
  })
  const total=[...map.values()].reduce((s,v)=>s+v,0)
  return [...map.entries()].map(([name,value])=>({name,value,share:total?value/total:0})).sort((a,b)=>b.value-a.value).slice(0,8)
}

export default function BudgetRealizado(){
  const [budget,setBudget]=useState<BudgetPlan[]>(initialBudget)
  const [entries,setEntries]=useState<FinancialEntry[]>([])
  const [start,setStart]=useState(0)
  const [end,setEnd]=useState(11)
  const [editing,setEditing]=useState(false)
  const [saved,setSaved]=useState(false)

  useEffect(()=>{ setBudget(readBudgetPlan()); setEntries(readFinancialSource().entries) },[])
  useEffect(()=>{ if(saved) writeBudgetPlan(budget) },[budget,saved])

  const rows=useMemo<Row[]>(()=>budget.map((b,i)=>{const a=actualFor(entries,i);return {...b,...a,ebitdaBudget:b.revenue-b.cost-b.opex,ebitdaActual:a.revenueActual-a.costActual-a.opexActual}}),[budget,entries])
  const visible=rows.slice(start,end+1)
  const total=(field:keyof Row)=>visible.reduce((s,r)=>s+Number(r[field]||0),0)
  const revenueVar=total('revenueActual')-total('revenue')
  const costVar=total('costActual')-total('cost')
  const opexVar=total('opexActual')-total('opex')
  const ebitdaVar=total('ebitdaActual')-total('ebitdaBudget')
  const revenuePct=deviationPercent(total('revenueActual'),total('revenue'))
  const costPct=deviationPercent(total('costActual'),total('cost'))
  const opexPct=deviationPercent(total('opexActual'),total('opex'))
  const ebitdaPct=deviationPercent(total('ebitdaActual'),total('ebitdaBudget'))
  const monthlyAlerts=visible.map(r=>({month:r.month,revenue:deviationPercent(r.revenueActual,r.revenue),cost:deviationPercent(r.costActual,r.cost),opex:deviationPercent(r.opexActual,r.opex),ebitda:deviationPercent(r.ebitdaActual,r.ebitdaBudget)}))
  const criticalMonths=monthlyAlerts.filter(m=>[severity('revenue',m.revenue),severity('expense',m.cost),severity('expense',m.opex),severity('ebitda',m.ebitda)].includes('critical'))
  const competences=new Set(visible.map((_,i)=>`2026-${String(start+i+1).padStart(2,'0')}`))
  const opexAnalytics=useMemo(()=>groupEntries(entries,competences,'opex'),[entries,visible,start])
  const capexAnalytics=useMemo(()=>groupEntries(entries,competences,'capex'),[entries,visible,start])
  const capexBudget=total('capex'), capexActual=total('capexActual'), capexVar=capexActual-capexBudget

  function updateBudget(index:number,field:'revenue'|'cost'|'opex'|'capex',value:string){ const numeric=Number(value.replace(',','.')); setBudget(prev=>prev.map((r,i)=>i===index?{...r,[field]:Number.isFinite(numeric)?numeric:0}:r)); setSaved(true) }

  return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
    <header><div><small>PLANEJAMENTO E CONTROLADORIA</small><h1>Orçamento × Realizado</h1><p>Planejamento • execução • desvios • análise gerencial</p></div><div className="period-controls"><label>Período de análise</label><div><select value={start} onChange={e=>setStart(Math.min(Number(e.target.value),end))}>{months.map((m,i)=><option key={m} value={i}>Início: {m}/2026</option>)}</select><select value={end} onChange={e=>setEnd(Math.max(start,Number(e.target.value)))}>{months.map((m,i)=><option key={m} value={i}>Fim: {m}/2026</option>)}</select></div></div></header>

    <div className="cards"><Card title="Receita Realizada" value={total('revenueActual')} sub={`Desvio ${brl(revenueVar)} • ${pct(revenuePct)}`}/><Card title="EBITDA Realizado" value={total('ebitdaActual')} sub={`Desvio ${brl(ebitdaVar)} • ${pct(ebitdaPct)}`}/><Card title="Desvio Receita" value={revenueVar} sub={`${isFavorable('revenue',revenueVar)?'Favorável':'Desfavorável'} • ${pct(revenuePct)}`}/><Card title="Desvio OPEX" value={opexVar} sub={`${isFavorable('expense',opexVar)?'Favorável':'Desfavorável'} • ${pct(opexPct)}`}/></div>

    <section className="panel wide"><div className="panel-title"><h2>Visão mensal</h2><span>Orçamento × realizado • fonte: lançamentos</span></div><div className="table-wrap"><table><thead><tr><th>Indicador</th>{visible.map(r=><th key={r.month}>{r.month}</th>)}<th>Total</th></tr></thead><tbody>
      <Line label="Receita • Orçamento" rows={visible} field="revenue" total={total('revenue')}/><Line label="Receita • Realizado" rows={visible} field="revenueActual" total={total('revenueActual')}/><Line label="Custos • Orçamento" rows={visible} field="cost" total={total('cost')}/><Line label="Custos • Realizado" rows={visible} field="costActual" total={total('costActual')}/><Line label="OPEX • Orçamento" rows={visible} field="opex" total={total('opex')}/><Line label="OPEX • Realizado" rows={visible} field="opexActual" total={total('opexActual')}/><Line label="CAPEX • Orçamento" rows={visible} field="capex" total={total('capex')}/><Line label="CAPEX • Realizado" rows={visible} field="capexActual" total={total('capexActual')}/><Line label="EBITDA • Orçamento" rows={visible} field="ebitdaBudget" total={total('ebitdaBudget')}/><Line label="EBITDA • Realizado" rows={visible} field="ebitdaActual" total={total('ebitdaActual')}/>
    </tbody></table></div></section>

    <div className="grid"><section className="panel"><div className="panel-title"><h2>Principais desvios</h2><span>Realizado − Orçamento</span></div><div className="rows"><Deviation label="Receita" value={revenueVar} budget={total('revenue')} kind="revenue"/><Deviation label="Custos" value={costVar} budget={total('cost')} kind="expense"/><Deviation label="OPEX" value={opexVar} budget={total('opex')} kind="expense"/><Deviation label="EBITDA" value={ebitdaVar} budget={total('ebitdaBudget')} kind="ebitda"/></div></section><section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Controladoria</span></div><div className="note"><strong>{ebitdaVar>=0?'EBITDA acima do orçamento':'EBITDA abaixo do orçamento'}</strong><p>Receita positiva acima do orçamento é favorável. Para custos e OPEX, desvio negativo é favorável. O semáforo usa 3% para atenção e 5% para crítico.</p>{criticalMonths.length>0&&<p><strong>🔴 {criticalMonths.length} mês(es) com desvio crítico.</strong> Priorize a investigação antes do fechamento gerencial.</p>}</div></section></div>

    <section className="panel wide"><div className="panel-title"><h2>Semáforo mensal</h2><span>Desvio percentual por indicador</span></div><div className="table-wrap"><table><thead><tr><th>Mês</th><th>Receita</th><th>Custos</th><th>OPEX</th><th>EBITDA</th></tr></thead><tbody>{monthlyAlerts.map(m=><tr key={m.month}><td><b>{m.month}</b></td><td>{statusDot(severity('revenue',m.revenue))} {pct(m.revenue)}</td><td>{statusDot(severity('expense',m.cost))} {pct(m.cost)}</td><td>{statusDot(severity('expense',m.opex))} {pct(m.opex)}</td><td>{statusDot(severity('ebitda',m.ebitda))} {pct(m.ebitda)}</td></tr>)}</tbody></table></div><div className="note">🟢 até 3% • 🟡 de 3% a 5% • 🔴 acima de 5%. Para Receita e EBITDA, o sinal positivo tende a ser favorável; para Custos e OPEX, o aumento do realizado tende a ser desfavorável.</div></section>

    <section className="panel wide"><div className="panel-title"><h2>OPEX analítico</h2><span>Categoria • participação no realizado</span></div>{opexAnalytics.length===0?<div className="note">Não há despesas classificadas em OPEX no período selecionado.</div>:<div className="table-wrap"><table><thead><tr><th>Categoria</th><th>Realizado</th><th>Participação</th><th>Leitura</th></tr></thead><tbody>{opexAnalytics.map(r=><tr key={r.name}><td><b>{r.name}</b></td><td>{brl(r.value)}</td><td>{pct(r.share)}</td><td>{r.share>=0.3?'Principal concentração':r.share>=0.15?'Relevante':'Secundária'}</td></tr>)}</tbody></table></div>}<div className="note"><strong>Próxima camada:</strong> o orçamento atual é mensal e ainda não possui abertura por categoria. Por isso, não inventamos um orçamento por área. O sistema mostra o realizado por categoria e preserva o orçamento total para, na próxima etapa, permitir orçamento por conta e centro de custo.</div></section>

    <section className="panel wide"><div className="panel-title"><h2>CAPEX analítico</h2><span>Investimento planejado × realizado</span></div><div className="grid"><div className="note"><strong>Orçamento</strong><p>{brl(capexBudget)}</p></div><div className="note"><strong>Realizado</strong><p>{brl(capexActual)}</p></div><div className="note"><strong>Desvio</strong><p>{brl(capexVar)} • {pct(capexBudget?capexVar/capexBudget:0)}</p></div></div>{capexAnalytics.length>0&&<div className="table-wrap"><table><thead><tr><th>Categoria / projeto</th><th>Realizado</th><th>Participação</th></tr></thead><tbody>{capexAnalytics.map(r=><tr key={r.name}><td><b>{r.name}</b></td><td>{brl(r.value)}</td><td>{pct(r.share)}</td></tr>)}</tbody></table></div>}<div className="note"><strong>Governança:</strong> CAPEX permanece separado do OPEX. O próximo passo será cadastrar orçamento por projeto, acompanhar desembolso acumulado e conectar cada investimento ao impacto no fluxo de caixa projetado.</div></section>

    <section className="panel wide"><div className="panel-title"><h2>Orçamento por mês</h2><span>{editing?'Edição habilitada':'Somente consulta'} <button className="primary-btn" onClick={()=>setEditing(v=>!v)}>{editing?'Concluir edição':'Editar orçamento'}</button></span></div><div className="table-wrap"><table><thead><tr><th>Mês</th><th>Receita</th><th>Custos</th><th>OPEX</th><th>CAPEX</th><th>EBITDA</th></tr></thead><tbody>{budget.map((r,i)=><tr key={r.month}><td><b>{r.month}/2026</b></td>{(['revenue','cost','opex','capex'] as const).map(field=><td key={field}>{editing?<input inputMode="decimal" value={r[field]} onChange={e=>updateBudget(i,field,e.target.value)} style={{width:120}}/>:brl(r[field])}</td>)}<td><b>{brl(r.revenue-r.cost-r.opex)}</b></td></tr>)}</tbody></table></div>{saved&&<div className="note">Orçamento salvo localmente no navegador. Na próxima evolução, essa base será migrada para persistência por empresa/usuário.</div>}</section>

    <section className="panel wide"><div className="panel-title"><h2>Regra de análise</h2><span>Governança gerencial</span></div><div className="note"><strong>Realizado − Orçamento</strong> é a regra central. O sistema classifica automaticamente o desvio conforme a natureza da conta, mostra percentual e semáforo mensal e preserva separadamente Receita, Custos, OPEX e CAPEX. Os realizados vêm da base única de lançamentos, enquanto o orçamento possui uma base própria e editável.</div></section>
  </main>
}
function Line({label,rows,field,total}:{label:string;rows:Row[];field:keyof Row;total:number}){return <tr><td><b>{label}</b></td>{rows.map(r=><td key={r.month}>{brl(Number(r[field]||0))}</td>)}<td><b>{brl(total)}</b></td></tr>}
function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}
function Deviation({label,value,budget,kind}:{label:string;value:number;budget:number;kind:DeviationKind}){const p=deviationPercent(value+budget,budget);const fav=isFavorable(kind,value);const sev=severity(kind,p);return <div className="row"><span>{statusDot(sev)} {label}</span><b className={fav?'positive':'negative'}>{brl(value)} • {pct(p)} • {fav?'Favorável':'Desfavorável'}</b></div>}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildCapexReport, capexCategoryLabel, capexStatusLabel, type CapexCategory, type CapexProject, type CapexStatus } from '@/lib/capex'
import { readCapexProjects, writeCapexProjects } from '@/lib/capex-storage'
import { readV2CostCenters } from '@/lib/v2-cost-center-storage'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`

export default function CapexGerencial(){
 const [projects,setProjects]=useState<CapexProject[]>([])
 const [editing,setEditing]=useState(false)
 const [selected,setSelected]=useState<string|null>(null)
 const centers=useMemo(()=>readV2CostCenters(),[])
 useEffect(()=>setProjects(readCapexProjects()),[])
 const report=useMemo(()=>buildCapexReport(projects),[projects])
 const save=(next:CapexProject[])=>{setProjects(next);writeCapexProjects(next)}
 const update=(id:string,key:keyof CapexProject,value:string)=>{
   save(projects.map(p=>p.id===id?{...p,[key]:['approvedBudget','contractedAmount','realizedAmount','forecastAmount'].includes(key)?Number(value):value}:p))
 }
 return <main className="bp-view bp-container">
  <header className="bp-header"><div><small>GESTÃO FINANCEIRA • INVESTIMENTOS</small><h1>CAPEX Gerencial</h1><p>Planejado → aprovado → contratado → realizado → projetado → desvio → ação</p></div><button className="secondary-btn" onClick={()=>setEditing(v=>!v)}>{editing?'Concluir edição':'Editar projetos'}</button></header>
  <section className="cards">
   <Metric label="CAPEX Orçado" value={report.approvedBudget}/><Metric label="CAPEX Contratado" value={report.contractedAmount}/><Metric label="CAPEX Realizado" value={report.realizedAmount}/><Metric label="Saldo a Realizar" value={report.balanceToRealize}/><Metric label="Forecast CAPEX" value={report.forecastAmount}/><Metric label="Desvio Forecast × Orçamento" value={report.forecastVariance}/>
  </section>
  <section className="bp-card"><div className="bp-card-title"><div><small>EXECUÇÃO DOS INVESTIMENTOS</small><h2>Projetos CAPEX</h2><p className="bp-muted">A visão por projeto preserva orçamento, compromisso, desembolso e forecast.</p></div><span>{report.projectCount} projeto(s)</span></div>
   <div className="table-wrap"><table><thead><tr><th>Projeto</th><th>Categoria</th><th>Orçamento</th><th>Contratado</th><th>Realizado</th><th>Forecast</th><th>Desvio</th><th>Status</th></tr></thead><tbody>
    {projects.map(p=><tr key={p.id}><td><b>{p.code}</b><br/><span className="bp-muted">{p.name}</span></td><td>{capexCategoryLabel(p.category)}</td><td>{editing?<input className="compact-field" value={p.approvedBudget} onChange={e=>update(p.id,'approvedBudget',e.target.value)}/>:brl(p.approvedBudget)}</td><td>{editing?<input className="compact-field" value={p.contractedAmount} onChange={e=>update(p.id,'contractedAmount',e.target.value)}/>:brl(p.contractedAmount)}</td><td>{editing?<input className="compact-field" value={p.realizedAmount} onChange={e=>update(p.id,'realizedAmount',e.target.value)}/>:brl(p.realizedAmount)}</td><td>{editing?<input className="compact-field" value={p.forecastAmount} onChange={e=>update(p.id,'forecastAmount',e.target.value)}/>:brl(p.forecastAmount)}</td><td className={p.forecastAmount>p.approvedBudget?'negative':'positive'}>{brl(p.forecastAmount-p.approvedBudget)}<br/><small>{pct(p.approvedBudget?((p.forecastAmount-p.approvedBudget)/p.approvedBudget):0)}</small></td><td><span className="entry-tag">{capexStatusLabel(p.status)}</span></td></tr>)}
   </tbody></table></div>
  </section>
  <section className="bp-card"><div className="bp-card-title"><div><h2>Desvios e ações por projeto</h2><p className="bp-muted">A causa e a ação são registradas pelo gestor, sem inferência automática.</p></div><span>{projects.filter(p=>p.forecastAmount!==p.approvedBudget).length} projeto(s) com desvio</span></div>
   <div className="table-wrap"><table><thead><tr><th>Projeto</th><th>Desvio Forecast</th><th>Causa</th><th>Ação corretiva</th><th>Responsável</th><th>Prazo</th><th>Status</th></tr></thead><tbody>{projects.filter(p=>p.forecastAmount!==p.approvedBudget).map(p=><tr key={p.id} onClick={()=>setSelected(p.id)} style={{cursor:'pointer'}}><td><b>{p.code}</b><br/><span className="bp-muted">{p.name}</span></td><td className={p.forecastAmount>p.approvedBudget?'negative':'positive'}>{brl(p.forecastAmount-p.approvedBudget)}</td><td>{editing?<input className="compact-field" value={p.deviationCause??''} onChange={e=>update(p.id,'deviationCause',e.target.value)} placeholder="Causa"/>:(p.deviationCause||'Sem causa')}</td><td>{editing?<input className="compact-field" value={p.correctiveAction??''} onChange={e=>update(p.id,'correctiveAction',e.target.value)} placeholder="Ação"/>:(p.correctiveAction||'Sem ação')}</td><td>{editing?<input className="compact-field" value={p.actionOwner??''} onChange={e=>update(p.id,'actionOwner',e.target.value)} placeholder="Responsável"/>:(p.actionOwner||'—')}</td><td>{editing?<input className="compact-field" type="date" value={p.actionDueDate??''} onChange={e=>update(p.id,'actionDueDate',e.target.value)}/>:p.actionDueDate||'—'}</td><td>{editing?<select className="compact-field" value={p.actionStatus??'aberta'} onChange={e=>update(p.id,'actionStatus',e.target.value)}><option value="aberta">Aberta</option><option value="em_andamento">Em andamento</option><option value="concluida">Concluída</option></select>:p.actionStatus==='concluida'?'Concluída':p.actionStatus==='em_andamento'?'Em andamento':'Aberta'}</td></tr>)}</tbody></table></div>
   <div className="note" style={{marginTop:12}}>Leitura: o sistema identifica o desvio entre Forecast e orçamento. O gestor define a causa, a ação, o responsável e o prazo. Esses dados permanecem vinculados ao projeto CAPEX.</div>
  </section>
  <section className="grid"><section className="bp-card"><div className="bp-card-title"><h2>Governança CAPEX</h2></div><div className="rows"><div className="row"><span>Projetos com desvio de forecast</span><b>{projects.filter(p=>p.forecastAmount>p.approvedBudget).length}</b></div><div className="row"><span>Projetos sem causa registrada</span><b>{projects.filter(p=>p.forecastAmount!==p.approvedBudget&&!p.deviationCause).length}</b></div><div className="row"><span>Projetos sem ação registrada</span><b>{projects.filter(p=>p.forecastAmount!==p.approvedBudget&&!p.correctiveAction).length}</b></div><div className="note">O sistema identifica o desvio. A causa e a ação corretiva permanecem sob responsabilidade do gestor; não há inferência automática.</div></div></section><section className="bp-card"><div className="bp-card-title"><h2>Centros de resultado</h2></div>{centers.length===0?<div className="note">Nenhum centro de resultado cadastrado.</div>:<div className="rows">{centers.slice(0,8).map(c=><div className="row" key={c.id}><span>{c.code} • {c.name}</span><b>{projects.filter(p=>p.costCenterId===c.id).length}</b></div>)}</div>}</section></section>
  <section className="bp-card"><div className="bp-card-title"><h2>Integração gerencial</h2></div><div className="note"><b>CAPEX → Fluxo de Caixa → Forecast → Cenários → Capital de Giro → Resultado/Balanço</b><p>O módulo começa como controle por projeto. A próxima integração pode vincular desembolsos CAPEX ao fluxo de caixa projetado e ao forecast, sem alterar o Forecast oficial automaticamente.</p></div></section>
 </main>
}
function Metric({label,value}:{label:string;value:number}){return <div className="card"><span>{label}</span><strong>{brl(value)}</strong></div>}

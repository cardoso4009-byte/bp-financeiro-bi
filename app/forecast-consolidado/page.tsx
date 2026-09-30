'use client'

import { useMemo, useState } from 'react'
import { ReportPeriodFilter, DEFAULT_REPORT_PERIOD } from '@/components/report-period-filter'
import { competence } from '@/lib/report-period'
import { buildV2FinancialBase } from '@/lib/v2-financial-base'
import { buildV2ForecastReport } from '@/lib/v2-forecast'
import { readV2BrowserStore } from '@/lib/v2-browser-storage'
import { readV2BudgetEntries } from '@/lib/v2-budget-storage'
import { readV2CostCenters } from '@/lib/v2-cost-center-storage'
import { readV2ForecastEntries } from '@/lib/v2-forecast-storage'
import { buildForecastConsolidado } from '@/lib/forecast-consolidado'

const periods = Array.from({length:12}, (_, i) => `2026-${String(i+1).padStart(2,'0')}`)
const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function ForecastConsolidadoPage() {
 const [period,setPeriod] = useState({...DEFAULT_REPORT_PERIOD,month:12})
 const cutoff = competence(period.year,period.month)
 const base = useMemo(() => buildV2FinancialBase(readV2BrowserStore().entries),[])
 const budget = useMemo(() => readV2BudgetEntries(),[])
 const centers = useMemo(() => readV2CostCenters(),[])
 const forecast = useMemo(() => readV2ForecastEntries(),[])
 const report = useMemo(() => buildV2ForecastReport(base,budget,forecast,centers,cutoff,periods),[base,budget,forecast,centers,cutoff])
 const consolidated = useMemo(() => buildForecastConsolidado(report),[report])
 const [mode,setMode] = useState<'annual'|'monthly'>('annual')
 const cards = consolidated.total
 return <main className="page">
  <style>{`.page{max-width:1250px;margin:auto;padding:28px;font-family:Arial,sans-serif;color:#10243b;background:#f4f7fb;min-height:100vh}.head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:20px}.eyebrow{font-size:11px;color:#6c8298;font-weight:800;letter-spacing:.1em}.head h1{margin:6px 0;font-size:30px}.head p{margin:0;color:#6c8298}.filter{background:#fff;border:1px solid #dce6f0;border-radius:12px;padding:10px 14px}.tabs{display:flex;gap:8px;margin-bottom:14px}.tab{border:1px solid #d4e0eb;background:#fff;border-radius:9px;padding:10px 16px;font-weight:800;cursor:pointer}.tab.active{background:#17304a;color:#fff}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:14px}.card,.panel{background:#fff;border:1px solid #dce6f0;border-radius:14px}.card{padding:17px}.card span{display:block;color:#70869c;font-size:12px}.card strong{display:block;font-size:21px;margin-top:7px}.panel{padding:20px;margin-bottom:14px}.title{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.title h2{margin:0;font-size:17px}.title span{font-size:11px;color:#7b8fa4}.note{padding:13px;border-radius:10px;background:#f7f9fc;border:1px solid #e4ebf2;color:#536b80;font-size:12px;line-height:1.5}.table{width:100%;border-collapse:collapse;font-size:12px}.table th,.table td{padding:10px;border-bottom:1px solid #edf1f5;text-align:right}.table th:first-child,.table td:first-child{text-align:left}.positive{font-weight:800}@media(max-width:900px){.cards{grid-template-columns:1fr 1fr}.head{flex-direction:column}}@media(max-width:520px){.cards{grid-template-columns:1fr}}`}</style>
  <header className="head"><div><div className="eyebrow">CONTROLADORIA GERENCIAL</div><h1>Forecast Consolidado</h1><p>Visão única do realizado + projetado, sem alterar as bases de origem.</p></div><div className="filter"><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/></div></header>
  <section className="cards"><Metric label="Receita" value={cards.revenue}/><Metric label="Custos + OPEX + Impostos" value={cards.operatingCosts}/><Metric label="Resultado financeiro" value={cards.financialResult}/><Metric label="CAPEX" value={cards.capex}/><Metric label="Resultado consolidado" value={cards.result}/></section>
  <section className="panel"><div className="title"><h2>Composição do Forecast</h2><span>Cutoff {cutoff}</span></div><div className="note">O consolidado combina as linhas do Forecast V2 em uma visão gerencial. Até o cutoff, a linha representa realizado; após o cutoff, representa projetado. O Forecast oficial permanece a fonte de dados e não é sobrescrito por cenários.</div></section>
  <section className="panel"><div className="tabs"><button className={`tab ${mode==='annual'?'active':''}`} onClick={()=>setMode('annual')}>Visão anual</button><button className={`tab ${mode==='monthly'?'active':''}`} onClick={()=>setMode('monthly')}>Visão mensal</button></div>
   {mode==='annual' ? <table className="table"><thead><tr><th>Bloco</th><th>Realizado</th><th>Projetado</th><th>Total</th></tr></thead><tbody>
    {([['Receita','revenue'],['Custos + OPEX + Impostos','operatingCosts'],['Resultado financeiro','financialResult'],['CAPEX','capex'],['Resultado consolidado','result']] as const).map(([label,key])=><tr key={key}><td><b>{label}</b></td><td>{brl(consolidated.realized[key])}</td><td>{brl(consolidated.projected[key])}</td><td className="positive">{brl(consolidated.total[key])}</td></tr>)}
   </tbody></table> : <table className="table"><thead><tr><th>Competência</th><th>Status</th><th>Receita</th><th>Custos/OPEX</th><th>Financ.</th><th>CAPEX</th><th>Resultado</th></tr></thead><tbody>{consolidated.rows.map(row=><tr key={row.period}><td><b>{row.period}</b></td><td>{row.status}</td><td>{brl(row.revenue)}</td><td>{brl(row.operatingCosts)}</td><td>{brl(row.financialResult)}</td><td>{brl(row.capex)}</td><td className="positive">{brl(row.result)}</td></tr>)}</tbody></table>}
  </section>
  <section className="panel"><div className="title"><h2>Governança</h2><span>Camada consolidada</span></div><div className="note">Esta visão é somente leitura e consolidação. Cenários, CAPEX auxiliar e impacto de Capital de Giro continuam separados das linhas oficiais do Forecast.</div></section>
 </main>
}
function Metric({label,value}:{label:string;value:number}){return <div className="card"><span>{label}</span><strong>{brl(value)}</strong></div>}

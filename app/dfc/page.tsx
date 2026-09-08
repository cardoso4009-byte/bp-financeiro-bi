'use client'
import {useMemo,useState} from 'react'
import {cashFlowEngine} from '@/lib/dfc-engine'
import {periodFromMonths} from '@/lib/period-engine'
import ReportPeriodFilter from '@/components/report-period-filter'
import {DEFAULT_REPORT_PERIOD} from '@/lib/report-period'
import type {ReportPeriod} from '@/lib/report-period'
const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
export default function DFCPage(){
 const [period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,month:12})
 const analysis=useMemo(()=>periodFromMonths(period.view==='mensal'?period.month:1,period.month,period.year),[period])
 const base=useMemo(()=>cashFlowEngine(undefined,analysis),[analysis]); const bridge=base.operatingBridge
 const flowRows=[['Fluxo de Caixa Operacional',base.operational],['Fluxo de Caixa de Investimentos',base.investment],['Fluxo de Caixa de Financiamentos',base.financing],['Variação Líquida de Caixa',base.variation]] as const
 const bridgeRows=[['Lucro Líquido',bridge.netIncome],['(+) Depreciação',bridge.depreciation],['(-) Aumento de Contas a Receber',-bridge.deltaReceivables],['(-) Aumento de Estoques',-bridge.deltaInventory],['(+) Aumento de Fornecedores',bridge.deltaSuppliers],['(+) Aumento de Obrigações',bridge.deltaObligations],['= Fluxo de Caixa Operacional',base.operational]] as const
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1500,margin:'0 auto'}}><header><div><small>CONTROLADORIA FINANCEIRA</small><h1>DFC Gerencial</h1><p>Demonstração dos Fluxos de Caixa • Método indireto</p></div><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]}/></header>
 <section className="panel wide"><div className="panel-title"><h2>DFC — visão gerencial</h2><span>{months[period.month-1]}/{period.year}{period.view==='acumulado'?' • acumulado':''}</span></div>
 <div className="cards"><Card title="Operacional" value={base.operational}/><Card title="Investimentos" value={base.investment}/><Card title="Financiamentos" value={base.financing}/><Card title="Variação Líquida" value={base.variation}/></div>
 <div className="grid"><section className="panel"><div className="panel-title"><h2>Reconciliação do fluxo operacional</h2><span>Método indireto</span></div><div className="rows">{bridgeRows.map(([label,value])=><div key={label}><span>{label}</span><strong>{brl(value)}</strong></div>)}</div></section><section className="panel"><div className="panel-title"><h2>Geração de caixa</h2><span>Fluxos</span></div><div className="rows">{flowRows.map(([label,value])=><div key={label}><span>{label}</span><strong>{brl(value)}</strong></div>)}</div></section></div>
 <div className="table-wrap"><table><thead><tr><th>Fluxo de caixa</th><th>Realizado</th><th>Participação</th></tr></thead><tbody>{flowRows.map(([label,value])=><tr key={label}><td>{label}</td><td>{brl(value)}</td><td>{base.variation?`${(value/Math.abs(base.variation)*100).toFixed(1).replace('.',',')}%`:'—'}</td></tr>)}</tbody></table></div>
 <div className="grid"><section className="panel"><div className="panel-title"><h2>Conciliação</h2><span>{base.status}</span></div><div className="rows"><div><span>Caixa final da DFC</span><strong>{brl(base.finalCash)}</strong></div><div><span>Caixa no Razão</span><strong>{brl(base.balanceCash)}</strong></div><div><span>Diferença</span><strong>{brl(base.reconciliation)}</strong></div></div></section><section className="panel"><div className="panel-title"><h2>Posição de caixa</h2><span>Competência</span></div><div className="rows"><div><span>Caixa Inicial</span><strong>{brl(base.initialCash)}</strong></div><div><span>Variação Líquida</span><strong>{brl(base.variation)}</strong></div><div><span>Caixa Final</span><strong>{brl(base.finalCash)}</strong></div></div></section></div>
 <div className="note">Fonte: Financial Core → DRE/BP → Motor DFC • {base.status==='OK'?'✓ Caixa conciliado':'⚠ Revisar conciliação'}</div></section></main>
}
function Card({title,value}:{title:string;value:number}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>motor DFC indireto</small></div>}

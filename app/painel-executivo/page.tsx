'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ReportPeriodFilter, DEFAULT_REPORT_PERIOD } from '@/components/report-period-filter'
import { competence } from '@/lib/report-period'
import { buildV2FinancialBase } from '@/lib/v2-financial-base'
import { buildV2ForecastReport } from '@/lib/v2-forecast'
import { readV2BrowserStore } from '@/lib/v2-browser-storage'
import { readV2BudgetEntries } from '@/lib/v2-budget-storage'
import { readV2CostCenters } from '@/lib/v2-cost-center-storage'
import { readV2ForecastEntries } from '@/lib/v2-forecast-storage'
import { buildForecastConsolidado } from '@/lib/forecast-consolidado'
import { FORECAST_SCENARIOS, buildForecastScenario, type ForecastScenario } from '@/lib/v2-forecast-scenarios'
import { workingCapitalData } from '@/lib/capital-giro-engine'
import { buildWorkingCapitalForecast } from '@/lib/capital-giro-forecast'

const periods = Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, '0')}`)
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const pct = (n: number) => `${(n * 100).toFixed(1).replace('.', ',')}%`

export default function PainelExecutivoPage() {
  const [period, setPeriod] = useState({ ...DEFAULT_REPORT_PERIOD, month: 12 })
  const [scenario, setScenario] = useState<ForecastScenario>('base')
  const cutoff = competence(period.year, period.month)

  const base = useMemo(() => buildV2FinancialBase(readV2BrowserStore().entries), [])
  const budget = useMemo(() => readV2BudgetEntries(), [])
  const centers = useMemo(() => readV2CostCenters(), [])
  const forecast = useMemo(() => readV2ForecastEntries(), [])

  const report = useMemo(
    () => buildV2ForecastReport(base, budget, forecast, centers, cutoff, periods),
    [base, budget, forecast, centers, cutoff],
  )
  const consolidated = useMemo(() => buildForecastConsolidado(report), [report])

  const selected = consolidated.rows.find(row => row.period === cutoff) ?? consolidated.rows.at(-1)
  const projected = consolidated.projected
  const realized = consolidated.realized

  const workingCapitalBase =
    workingCapitalData.find(row => row.month === cutoff) ??
    workingCapitalData[workingCapitalData.length - 1]

  const wcInput = useMemo(
    () => ({
      pmrDias: workingCapitalBase?.diasReceber ?? 30,
      pmeDias: workingCapitalBase?.diasEstoque ?? 30,
      pmpDias: workingCapitalBase?.diasFornecedores ?? 30,
      receitaMensal: workingCapitalBase
        ? (workingCapitalBase.contasReceber / Math.max(workingCapitalBase.diasReceber, 1)) * 30
        : 63000,
      custoMensal: workingCapitalBase
        ? (workingCapitalBase.estoques / Math.max(workingCapitalBase.diasEstoque, 1)) * 30
        : 31500,
    }),
    [workingCapitalBase],
  )

  const scenarioResult = useMemo(
    () => buildForecastScenario(report.lines, scenario, wcInput),
    [report.lines, scenario, wcInput],
  )

  const futurePeriods = periods.filter(p => p > cutoff)
  const workingCapital = useMemo(
    () =>
      buildWorkingCapitalForecast(
        report.lines,
        futurePeriods,
        {
          pmrDias: wcInput.pmrDias,
          pmeDias: wcInput.pmeDias,
          pmpDias: wcInput.pmpDias,
        },
        workingCapitalBase?.necessidadeCapitalGiro ?? 0,
      ),
    [report.lines, futurePeriods, wcInput, workingCapitalBase],
  )

  const baseScenario = useMemo(
    () => buildForecastScenario(report.lines, 'base', wcInput),
    [report.lines, wcInput],
  )

  const scenarioDelta = scenarioResult.result - baseScenario.result
  const dataQuality = report.unassignedForecastEntries === 0 ? 'OK' : 'Atenção'

  return (
    <main className="page">
      <style>{`
        .page{max-width:1400px;margin:auto;padding:28px;font-family:Arial,sans-serif;color:#10243b;background:#f4f7fb;min-height:100vh}
        .head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px}
        .eyebrow{font-size:11px;color:#6c8298;font-weight:800;letter-spacing:.1em}.head h1{margin:6px 0;font-size:30px}.head p{margin:0;color:#6c8298}
        .filter{background:#fff;border:1px solid #dce6f0;border-radius:12px;padding:10px 14px}
        .cards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:14px}.card,.panel{background:#fff;border:1px solid #dce6f0;border-radius:14px}
        .card{padding:17px}.card span{display:block;color:#70869c;font-size:12px}.card strong{display:block;font-size:21px;margin-top:7px}.card small{display:block;margin-top:5px;color:#8094a8}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.panel{padding:20px;margin-bottom:14px}.wide{grid-column:1/-1}
        .title{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.title h2{margin:0;font-size:17px}.title span{font-size:11px;color:#7b8fa4}
        .table{width:100%;border-collapse:collapse;font-size:12px}.table th,.table td{padding:10px;border-bottom:1px solid #edf1f5;text-align:right}.table th:first-child,.table td:first-child{text-align:left}
        .kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.mini{padding:13px;border-radius:10px;background:#f7f9fc;border:1px solid #e4ebf2}.mini span{display:block;font-size:11px;color:#70869c}.mini b{display:block;margin-top:5px;font-size:18px}
        .tabs{display:flex;gap:8px;margin-bottom:14px}.tab{border:1px solid #d4e0eb;background:#fff;border-radius:9px;padding:9px 14px;font-weight:800;cursor:pointer}.tab.active{background:#17304a;color:#fff}
        .note{padding:13px;border-radius:10px;background:#f7f9fc;border:1px solid #e4ebf2;color:#536b80;font-size:12px;line-height:1.5}
        .links{display:flex;gap:10px;flex-wrap:wrap}.link{padding:9px 12px;border:1px solid #dce6f0;border-radius:9px;background:#fff;text-decoration:none;color:#17304a;font-size:12px;font-weight:800}
        @media(max-width:1050px){.cards{grid-template-columns:repeat(3,1fr)}}@media(max-width:800px){.grid{grid-template-columns:1fr}.wide{grid-column:auto}.kpi{grid-template-columns:1fr 1fr}.head{flex-direction:column}}@media(max-width:520px){.cards{grid-template-columns:1fr 1fr}.kpi{grid-template-columns:1fr}.cards .card strong{font-size:18px}}
      `}</style>

      <header className="head">
        <div>
          <div className="eyebrow">CONTROLADORIA GERENCIAL • V2</div>
          <h1>Painel Executivo</h1>
          <p>Visão consolidada para decisão: realizado, Forecast, caixa, CAPEX e capital de giro.</p>
        </div>
        <div className="filter"><ReportPeriodFilter value={period} onChange={setPeriod} years={[2026]} /></div>
      </header>

      <section className="cards">
        <Metric title="Receita consolidada" value={consolidated.total.revenue} />
        <Metric title="Resultado consolidado" value={consolidated.total.result} />
        <Metric title="Resultado realizado" value={realized.result} />
        <Metric title="Resultado projetado" value={projected.result} />
        <Metric title="CAPEX consolidado" value={consolidated.total.capex} />
      </section>

      <section className="panel">
        <div className="title"><h2>Leitura executiva</h2><span>Cutoff {cutoff}</span></div>
        <div className="kpi">
          <Mini label="Margem consolidada" value={pct(consolidated.total.revenue ? consolidated.total.result / consolidated.total.revenue : 0)} />
          <Mini label="Ciclo financeiro" value={`${wcInput.pmrDias + wcInput.pmeDias - wcInput.pmpDias} dias`} />
          <Mini label="Impacto futuro da NCG" value={brl(workingCapital.totalCashImpact)} />
          <Mini label="Qualidade do Forecast" value={dataQuality} />
        </div>
      </section>

      <div className="grid">
        <section className="panel">
          <div className="title"><h2>Realizado × Projetado</h2><span>Visão anual</span></div>
          <table className="table">
            <thead><tr><th>Bloco</th><th>Realizado</th><th>Projetado</th><th>Total</th></tr></thead>
            <tbody>
              <SummaryRow label="Receita" realized={realized.revenue} projected={projected.revenue} total={consolidated.total.revenue} />
              <SummaryRow label="Custos + OPEX + Impostos" realized={realized.operatingCosts} projected={projected.operatingCosts} total={consolidated.total.operatingCosts} />
              <SummaryRow label="Resultado financeiro" realized={realized.financialResult} projected={projected.financialResult} total={consolidated.total.financialResult} />
              <SummaryRow label="CAPEX" realized={realized.capex} projected={projected.capex} total={consolidated.total.capex} />
              <SummaryRow label="Resultado" realized={realized.result} projected={projected.result} total={consolidated.total.result} />
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="title"><h2>Forecast por competência</h2><span>Cutoff {cutoff}</span></div>
          <table className="table">
            <thead><tr><th>Período</th><th>Receita</th><th>Resultado</th><th>Status</th></tr></thead>
            <tbody>
              {consolidated.rows.slice(0, 12).map(row => (
                <tr key={row.period}><td>{row.period}</td><td>{brl(row.revenue)}</td><td>{brl(row.result)}</td><td>{row.status}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="panel">
        <div className="title"><h2>Cenário de decisão</h2><span>Simulação auxiliar</span></div>
        <div className="tabs">{FORECAST_SCENARIOS.map(item => <button key={item.id} className={`tab ${scenario === item.id ? 'active' : ''}`} onClick={() => setScenario(item.id)}>{item.label}</button>)}</div>
        <div className="kpi">
          <Mini label="Receita do cenário" value={brl(scenarioResult.revenue)} />
          <Mini label="Resultado do cenário" value={brl(scenarioResult.result)} />
          <Mini label="Δ vs Base" value={brl(scenarioDelta)} />
          <Mini label="Impacto NCG no caixa" value={brl(scenarioResult.workingCapitalCashImpact)} />
        </div>
        <div className="note" style={{marginTop:12}}>O cenário é auxiliar e não altera o Forecast oficial, o realizado ou o fluxo de caixa. Use-o para avaliar sensibilidade antes da decisão.</div>
      </section>

      <div className="grid">
        <section className="panel">
          <div className="title"><h2>Capital de Giro</h2><span>Projeção futura</span></div>
          <div className="kpi">
            <Mini label="PMR" value={`${wcInput.pmrDias} dias`} />
            <Mini label="PME" value={`${wcInput.pmeDias} dias`} />
            <Mini label="PMP" value={`${wcInput.pmpDias} dias`} />
            <Mini label="NCG final" value={brl(workingCapital.lines.at(-1)?.workingCapitalNeed ?? workingCapitalBase?.necessidadeCapitalGiro ?? 0)} />
          </div>
        </section>

        <section className="panel">
          <div className="title"><h2>Governança</h2><span>Integridade da base</span></div>
          <div className="kpi">
            <Mini label="Lançamentos realizados" value={report.actualEntries.toLocaleString('pt-BR')} />
            <Mini label="Forecasts" value={report.forecastEntries.toLocaleString('pt-BR')} />
            <Mini label="Forecast sem centro" value={report.unassignedForecastEntries.toLocaleString('pt-BR')} />
            <Mini label="Centros cadastrados" value={centers.length.toLocaleString('pt-BR')} />
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="title"><h2>Acesso rápido</h2><span>Camadas oficiais e auxiliares</span></div>
        <div className="links">
          <Link className="link" href="/forecast-consolidado">Forecast Consolidado</Link>
          <Link className="link" href="/cenarios-forecast-v2">Cenários de Forecast</Link>
          <Link className="link" href="/fluxo-caixa">Fluxo de Caixa</Link>
          <Link className="link" href="/capital-giro">Capital de Giro</Link>
          <Link className="link" href="/controladoria-gerencial-v2">Controladoria V2</Link>
        </div>
      </section>

      <section className="panel">
        <div className="note"><b>Governança:</b> este painel é uma camada de leitura executiva. Não altera as bases oficiais, não grava cenários como realizado e mantém CAPEX e Capital de Giro como dimensões gerenciais auxiliares.</div>
      </section>
    </main>
  )
}

function Metric({ title, value }: { title: string; value: number }) {
  return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>visão consolidada</small></div>
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="mini"><span>{label}</span><b>{value}</b></div>
}

function SummaryRow({ label, realized, projected, total }: { label:string; realized:number; projected:number; total:number }) {
  return <tr><td><b>{label}</b></td><td>{brl(realized)}</td><td>{brl(projected)}</td><td><b>{brl(total)}</b></td></tr>
}

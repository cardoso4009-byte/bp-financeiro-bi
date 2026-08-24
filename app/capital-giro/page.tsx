'use client'

import { workingCapitalData, workingCapitalTotals as t } from '@/lib/capital-giro-data'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const pct = (n: number) => `${(n * 100).toFixed(1).replace('.', ',')}%`
const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length

export default function CapitalGiro() {
  const maxNcg = Math.max(...workingCapitalData.map(m => m.ncg))
  const minNcg = Math.min(...workingCapitalData.map(m => m.ncg))
  const averageNcg = t.ncg
  const cashShare = averageNcg / t.receitaLiquida

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
    <header>
      <div><small>CONTROLADORIA FINANCEIRA</small><h1>Capital de Giro</h1><p>Necessidade de capital de giro • Ciclo financeiro • Impacto no caixa</p></div>
      <div className="period">Jan–Dez 2026</div>
    </header>

    <div className="cards">
      <Card title="NCG Média" value={averageNcg} sub={`${pct(cashShare)} da receita anualizada`} />
      <Card title="Contas a Receber" value={t.contasReceber} sub={`PMR ${t.dso} dias`} />
      <Card title="Estoques" value={t.estoques} sub={`PME ${t.dio} dias`} />
      <Card title="Fornecedores" value={t.fornecedores} sub={`PMP ${t.dpo} dias`} />
    </div>

    <div className="grid">
      <section className="panel"><div className="panel-title"><h2>Composição da NCG</h2><span>Média</span></div>
        <Bar label="Contas a Receber" value={t.contasReceber} max={t.contasReceber} />
        <Bar label="Estoques" value={t.estoques} max={t.contasReceber} />
        <Bar label="(-) Fornecedores" value={t.fornecedores} max={t.contasReceber} />
        <div className="row" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e8e8e8' }}><span>Necessidade de Capital de Giro</span><b>{brl(averageNcg)}</b></div>
      </section>
      <section className="panel"><div className="panel-title"><h2>Ciclo financeiro</h2><span>Indicadores</span></div>
        <div className="rows">
          <div className="row"><span>Prazo Médio de Recebimento (PMR)</span><b>{t.dso} dias</b></div>
          <div className="row"><span>Prazo Médio de Estoque (PME)</span><b>{t.dio} dias</b></div>
          <div className="row"><span>Prazo Médio de Pagamento (PMP)</span><b>{t.dpo} dias</b></div>
          <div className="row"><span>Ciclo Financeiro</span><b>{t.cicloFinanceiro} dias</b></div>
        </div>
        <div className="note" style={{ marginTop: 16 }}>A empresa financia, em média, <strong>{t.cicloFinanceiro} dias</strong> da operação antes de recuperar o caixa por meio dos recebimentos.</div>
      </section>
    </div>

    <section className="panel wide"><div className="panel-title"><h2>Evolução mensal da NCG</h2><span>2026</span></div>
      <div className="monthly-chart">{workingCapitalData.map(m => <div className="month-col" key={m.month}>
        <div className="month-value">{brl(m.ncg)}</div>
        <div className="month-bar"><i style={{ height: `${m.ncg / maxNcg * 100}%` }} /></div>
        <span>{m.month}</span>
      </div>)}</div>
      <div className="rows" style={{ marginTop: 20 }}>
        <div className="row"><span>Menor NCG mensal</span><b>{brl(minNcg)}</b></div>
        <div className="row"><span>Maior NCG mensal</span><b>{brl(maxNcg)}</b></div>
        <div className="row"><span>Amplitude de capital comprometido</span><b>{brl(maxNcg - minNcg)}</b></div>
      </div>
    </section>

    <div className="grid">
      <section className="panel"><div className="panel-title"><h2>Leitura gerencial</h2><span>Diagnóstico</span></div>
        <Diagnosis good={t.cicloFinanceiro <= 45} title="Ciclo financeiro" text={`${t.cicloFinanceiro} dias. Quanto menor, menor a necessidade de financiar a operação.`} />
        <Diagnosis good={t.dpo >= t.dso} title="Prazo de recebimento" text={`A empresa recebe em ${t.dso} dias e paga fornecedores em ${t.dpo} dias.`} />
        <Diagnosis good={averageNcg < t.receitaLiquida * 0.20} title="Peso da NCG" text={`${pct(cashShare)} da receita média está comprometida na operação.`} />
      </section>
      <section className="panel"><div className="panel-title"><h2>Alavancas de caixa</h2><span>Prioridades</span></div>
        <div className="rows">
          <div className="row"><span>01 • Reduzir prazo de recebimento</span><b>↑ Caixa</b></div>
          <div className="row"><span>02 • Reduzir estoque parado</span><b>↑ Caixa</b></div>
          <div className="row"><span>03 • Negociar prazo com fornecedores</span><b>↑ Caixa</b></div>
          <div className="row"><span>04 • Monitorar NCG mensal</span><b>Governança</b></div>
        </div>
      </section>
    </div>

    <section className="panel"><div className="panel-title"><h2>Próximo passo</h2><span>Roadmap</span></div>
      <div className="note">O próximo módulo conecta Capital de Giro ao <strong>Fluxo de Caixa Projetado</strong>, permitindo transformar uma variação de PMR, PME ou PMP em impacto estimado no caixa e criar alertas gerenciais.</div>
    </section>
  </main>
}

function Card({ title, value, sub }: { title: string, value: number, sub: string }) { return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div> }
function Bar({ label, value, max }: { label: string, value: number, max: number }) { return <div className="bar"><div><span>{label}</span><b>{brl(value)}</b></div><div className="track"><i style={{ width: `${value / max * 100}%` }} /></div></div> }
function Diagnosis({ good, title, text }: { good: boolean, title: string, text: string }) { return <div className="check"><i className={good ? 'ok' : 'bad'}>{good ? '✓' : '!'}</i><div><b>{title}</b><small>{text}</small></div></div> }

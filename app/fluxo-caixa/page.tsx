'use client'

import { cashFlowAlerts, cashFlowData, cashFlowTotals as t } from '@/lib/fluxo-caixa-data'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function FluxoCaixa() {
  const maxCash = Math.max(...cashFlowData.map(m => Math.max(m.final, m.projectedFinal)))
  const minCash = Math.min(...cashFlowData.map(m => m.projectedFinal))

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
    <header>
      <div><small>CONTROLADORIA FINANCEIRA</small><h1>Fluxo de Caixa Projetado</h1><p>Visão mensal • Cenário base • Alertas de liquidez • Modelo demonstrativo</p></div>
      <div className="period">Jan–Dez 2026</div>
    </header>

    <div className="cards">
      <Card title="Caixa Inicial" value={t.initial} sub="Saldo de partida" />
      <Card title="Geração Operacional" value={t.operational} sub="Entradas e saídas operacionais" />
      <Card title="Investimentos" value={t.investments} sub="CAPEX / aplicações" />
      <Card title="Caixa Final" value={t.final} sub={`Mínimo projetado ${brl(t.lowestProjected)}`} />
    </div>

    <section className="panel wide"><div className="panel-title"><h2>Projeção mensal de caixa</h2><span>Base 2026</span></div>
      <div className="monthly-chart">{cashFlowData.map(m => <div className="month-col" key={m.month}>
        <div className="month-value">{brl(m.projectedFinal)}</div>
        <div className="month-bar"><i style={{ height: `${Math.max(m.projectedFinal, 0) / maxCash * 100}%` }} /></div>
        <span>{m.month}</span>
      </div>)}</div>
      <div className="note">A projeção considera o fluxo operacional, investimentos e financiamentos já modelados, além de um ajuste de cenário para testar pressão ou folga de liquidez.</div>
    </section>

    <div className="grid">
      <section className="panel"><div className="panel-title"><h2>Movimentação anual</h2><span>DFC projetada</span></div>
        <div className="rows">
          <div className="row"><span>Caixa inicial</span><b>{brl(t.initial)}</b></div>
          <div className="row"><span>Fluxo operacional</span><b>{brl(t.operational)}</b></div>
          <div className="row"><span>Investimentos / CAPEX</span><b>{brl(t.investments)}</b></div>
          <div className="row"><span>Financiamentos</span><b>{brl(t.financing)}</b></div>
          <div className="row"><span>Variação líquida</span><b>{brl(t.net)}</b></div>
          <div className="row"><span>Caixa final</span><b>{brl(t.final)}</b></div>
        </div>
      </section>

      <section className="panel"><div className="panel-title"><h2>Liquidez e alertas</h2><span>Motor V1</span></div>
        <Diagnosis good={minCash >= t.initial * 0.75} title="Reserva mínima" text={`Menor caixa projetado: ${brl(minCash)}. Piso gerencial: ${brl(cashFlowData[0].minimum)}.`} />
        <Diagnosis good={cashFlowAlerts.length === 0} title="Alertas de liquidez" text={cashFlowAlerts.length === 0 ? 'Nenhum mês abaixo do piso gerencial.' : `${cashFlowAlerts.length} mês(es) exigem atenção no cenário projetado.`} />
        <Diagnosis good={t.operational > 0} title="Geração operacional" text={`${brl(t.operational)} acumulados no ano.`} />
      </section>
    </div>

    <section className="panel wide"><div className="panel-title"><h2>Mapa de decisão mensal</h2><span>Caixa final × cenário</span></div>
      <table><thead><tr><td>Mês</td><td>Caixa Inicial</td><td>Operacional</td><td>Investimentos</td><td>Financiamento</td><td>Caixa Final</td><td>Projetado</td><td>Status</td></tr></thead><tbody>
        {cashFlowData.map(m => <tr key={m.month}><td>{m.month}</td><td>{brl(m.initial)}</td><td>{brl(m.operational)}</td><td>{brl(m.investments)}</td><td>{brl(m.financing)}</td><td>{brl(m.final)}</td><td>{brl(m.projectedFinal)}</td><td><span style={{fontWeight:700,color:m.status==='OK'?'#1d8a58':m.status==='ATENÇÃO'?'#b57600':'#c33'}}>{m.status}</span></td></tr>)}
      </tbody></table>
    </section>

    <div className="grid">
      <section className="panel"><div className="panel-title"><h2>Alavancas para proteger o caixa</h2><span>Prioridades</span></div>
        <div className="rows">
          <div className="row"><span>01 • Antecipar recebíveis críticos</span><b>Liquidez</b></div>
          <div className="row"><span>02 • Reprogramar CAPEX não essencial</span><b>Preservar caixa</b></div>
          <div className="row"><span>03 • Renegociar prazos com fornecedores</span><b>Capital de giro</b></div>
          <div className="row"><span>04 • Controlar financiamentos e juros</span><b>Custo financeiro</b></div>
        </div>
      </section>
      <section className="panel"><div className="panel-title"><h2>Próxima evolução</h2><span>Roadmap</span></div>
        <div className="note">O próximo passo será criar a <strong>Base de Lançamentos Financeiros</strong>. Cada lançamento passará a alimentar DRE, Balanço, DFC, Capital de Giro e Fluxo de Caixa, reduzindo dependência de dados demonstrativos.</div>
        <div className="check"><i className="ok">✓</i><div><b>Modelo integrado</b><small>DRE • BP • DFC • DMPL • Capital de Giro • Caixa</small></div></div>
      </section>
    </div>
  </main>
}

function Card({ title, value, sub }: { title: string, value: number, sub: string }) { return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div> }
function Diagnosis({ good, title, text }: { good: boolean, title: string, text: string }) { return <div className="check"><i className={good ? 'ok' : 'bad'}>{good ? '✓' : '!'}</i><div><b>{title}</b><small>{text}</small></div></div> }

import { closingEngine } from '@/lib/closing-engine'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function FechamentoContabil(){
 const c=closingEngine()
 const overall=c.checks.overall
 const gate=c.gate
 const statusLabel=overall?'PRONTO PARA FECHAMENTO':'PENDÊNCIAS'
 const statusClass=overall?'ok':'bad'
 const checkRows=[
  ['1. Livro Diário',c.checks.journal,'Partidas dobradas: cada lançamento deve ter Débito = Crédito.'],
  ['2. Razão e Balancete',c.checks.trial,'Consistência dos lançamentos antes da emissão das demonstrações.'],
  ['3. Balanço Contábil',c.checks.bp,`Diferença Ativo − (Passivo + PL): ${brl(c.bpDifference)}`],
  ['4. Balanço Gerencial — mês atual',c.checks.bpManagement,`Base gerencial ${c.managementBpMonth}: diferença Ativo − (Passivo + PL): ${brl(c.managementBpDifference)}`],
  ['5. Balanço Gerencial — série mensal',c.checks.bpManagementSeries,c.firstMonthlyIssue?`Primeira inconsistência em ${c.firstMonthlyIssue.month}: ${brl(c.firstMonthlyIssue.bpDifference)}.`:'Jan–Dez conciliado.'],
  ['6. DFC × Caixa',c.checks.cash,`Diferença entre Caixa Final calculado e saldo conciliado: ${brl(c.cashDifference)}`],
  ['7. DRE — Resultado',c.checks.result,`Resultado do período apurado: ${brl(c.result)}`],
  ['8. DMPL — Ponte do PL',c.checks.dmpl,`Diferença entre PL apresentado e PL esperado: ${brl(c.dmplDifference)}`],
 ] as const
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1400,margin:'0 auto'}}>
  <header>
   <div><small>CONTROLADORIA • FECHAMENTO</small><h1>Central de Fechamento Contábil</h1><p>Governança da competência: Diário, Razão, Balancete, DRE, BP, DFC e DMPL</p></div>
   <div className="period">{statusLabel}</div>
  </header>

  <div className="cards">
   <div className="card"><span>Resultado do período</span><strong>{brl(c.result)}</strong><small>DRE → PL</small></div>
   <div className="card"><span>Zero Difference Gate</span><strong>{gate.summary.ok}/{gate.summary.total}</strong><small>{gate.summary.pending===0?'0 pendências':'Revisar pendências'}</small></div>
   <div className="card"><span>Conciliação de caixa</span><strong>{c.checks.cash?'✓ OK':'! REVISAR'}</strong><small>DFC × Razão</small></div>
   <div className="card"><span>Prontidão do fechamento</span><strong>{overall?'✓ OK':'! REVISAR'}</strong><small>{overall?'Pode avançar para pré-fechamento':'Fechamento bloqueado'}</small></div>
  </div>

  <section className="panel wide">
   <div className="panel-title"><h2>Checklist de fechamento</h2><span>{overall?'Todos os controles críticos estão OK':'Existem pendências para investigação'}</span></div>
   {checkRows.map(([title,ok,detail])=><div className="check" key={title}><i className={ok?'ok':'bad'}>{ok?'✓':'!'}</i><div><b>{title}</b><small>{detail}</small></div></div>)}
  </section>

  <section className="panel">
   <div className="panel-title"><h2>Zero Difference Gate</h2><span className={statusClass}>{gate.overall?'RECONCILIADO':'PENDÊNCIAS'}</span></div>
   <div className="rows">
    <div className="row"><span>Verificações aprovadas</span><b>{gate.summary.ok} / {gate.summary.total}</b></div>
    <div className="row"><span>Pendências</span><b>{gate.summary.pending}</b></div>
    <div className="row"><span>Tolerância</span><b>&lt; R$ 0,01</b></div>
    <div className="row"><span>Status</span><b>{gate.overall?'✓ Zero Difference':'! Revisar diferenças'}</b></div>
   </div>
  </section>

  <section className="panel">
   <div className="panel-title"><h2>Diagnóstico executivo</h2><span>{overall?'LIBERADO':'BLOQUEADO'}</span></div>
   <div className="note">{overall?'A competência está reconciliada nas demonstrações e no Zero Difference Gate. O próximo estágio é o pré-fechamento, antes do fechamento definitivo.':'O fechamento não deve ser considerado concluído enquanto houver divergências. O BI evidencia a diferença e preserva a rastreabilidade, sem criar lançamentos artificiais para “fechar” os números.'}</div>
  </section>

  <section className="panel">
   <div className="panel-title"><h2>Ponte do Patrimônio Líquido</h2><span>DMPL</span></div>
   <div className="rows"><div className="row"><span>PL registrado antes do resultado</span><b>{brl(c.dmplExpected-c.result)}</b></div><div className="row"><span>(+) Resultado do período</span><b>{brl(c.result)}</b></div><div className="row"><span>= PL esperado</span><b>{brl(c.dmplExpected)}</b></div><div className="row"><span>Diferença de reconciliação</span><b>{brl(c.dmplDifference)}</b></div></div>
  </section>
 </main>
}

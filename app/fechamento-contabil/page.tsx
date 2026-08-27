import { closingEngine } from '@/lib/closing-engine'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function FechamentoContabil(){
 const c=closingEngine()
 const status=(ok:boolean)=>ok?'✓ OK':'! REVISAR'
 const overall=c.checks.overall
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1400,margin:'0 auto'}}>
  <header>
   <div><small>CONTROLADORIA • FECHAMENTO</small><h1>Central de Fechamento Contábil</h1><p>Validação cruzada entre Diário, Razão, Balancete, DRE, BP, DFC e DMPL</p></div>
   <div className="period">{overall?'✓ FECHAMENTO OK':'! PENDÊNCIAS'}</div>
  </header>

  <div className="cards">
   <div className="card"><span>Resultado do período</span><strong>{brl(c.result)}</strong><small>DRE → PL</small></div>
   <div className="card"><span>Equação patrimonial</span><strong>{status(c.checks.bp)}</strong><small>Ativo = Passivo + PL</small></div>
   <div className="card"><span>Conciliação de caixa</span><strong>{status(c.checks.cash)}</strong><small>DFC × Razão</small></div>
   <div className="card"><span>Fechamento geral</span><strong>{status(overall)}</strong><small>Controles críticos</small></div>
  </div>

  <section className="panel wide">
   <div className="panel-title"><h2>Checklist de fechamento</h2><span>{overall?'Todos os controles críticos estão OK':'Existem pendências para investigação'}</span></div>
   <div className="check"><i className={c.checks.journal?'ok':'bad'}>{c.checks.journal?'✓':'!'}</i><div><b>1. Livro Diário</b><small>Partidas dobradas: cada lançamento deve ter Débito = Crédito.</small></div></div>
   <div className="check"><i className={c.checks.trial?'ok':'bad'}>{c.checks.trial?'✓':'!'}</i><div><b>2. Razão e Balancete</b><small>Consistência dos lançamentos antes da emissão das demonstrações.</small></div></div>
   <div className="check"><i className={c.checks.bp?'ok':'bad'}>{c.checks.bp?'✓':'!'}</i><div><b>3. Balanço Patrimonial</b><small>Diferença Ativo − (Passivo + PL): {brl(c.bpDifference)}</small></div></div>
   <div className="check"><i className={c.checks.cash?'ok':'bad'}>{c.checks.cash?'✓':'!'}</i><div><b>4. DFC × Caixa</b><small>Diferença entre Caixa Final calculado e saldo conciliado: {brl(c.cashDifference)}</small></div></div>
   <div className="check"><i className={c.checks.result?'ok':'bad'}>{c.checks.result?'✓':'!'}</i><div><b>5. DRE — Resultado</b><small>Receitas − Custos − Despesas = {brl(c.result)}</small></div></div>
   <div className="check"><i className={c.checks.dmpl?'ok':'bad'}>{c.checks.dmpl?'✓':'!'}</i><div><b>6. DMPL — Ponte do PL</b><small>Diferença entre PL apresentado e PL esperado: {brl(c.dmplDifference)}</small></div></div>
  </section>

  <section className="panel">
   <div className="panel-title"><h2>Diagnóstico executivo</h2><span>{overall?'LIBERADO':'BLOQUEADO'}</span></div>
   <div className="note">{overall?'As principais integrações contábeis estão reconciliadas. O fechamento pode seguir para análise gerencial.':'O fechamento não deve ser considerado concluído enquanto houver divergências. O BI evidencia a diferença e preserva a rastreabilidade, sem criar lançamentos artificiais para “fechar” os números.'}</div>
  </section>

  <section className="panel">
   <div className="panel-title"><h2>Ponte do Patrimônio Líquido</h2><span>DMPL</span></div>
   <div className="rows"><div className="row"><span>PL registrado antes do resultado</span><b>{brl(c.dmplExpected-c.result)}</b></div><div className="row"><span>(+) Resultado do período</span><b>{brl(c.result)}</b></div><div className="row"><span>= PL esperado</span><b>{brl(c.dmplExpected)}</b></div><div className="row"><span>Diferença de reconciliação</span><b>{brl(c.dmplDifference)}</b></div></div>
  </section>
 </main>
}

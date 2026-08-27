import { auditEngine } from '@/lib/audit-engine'
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const severityLabel=(s:string)=>s==='critical'?'CRÍTICA':s==='warning'?'ATENÇÃO':'INFORMATIVA'

export default function AuditoriaContabil(){
 const a=auditEngine()
 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1400,margin:'0 auto'}}>
  <header>
   <div><small>CONTROLADORIA • AUDITORIA</small><h1>Auditoria Contábil</h1><p>Validação do motor: Diário → Razão → Balancete → Demonstrações</p></div>
   <div className="period">{a.overall?'✓ MOTOR OK':'! PENDÊNCIAS'}</div>
  </header>

  <div className="cards">
   <div className="card"><span>Checks executados</span><strong>{a.checks.length}</strong><small>Controles estruturais</small></div>
   <div className="card"><span>Pendências</span><strong>{a.pending.length}</strong><small>{a.summary.critical} crítica(s)</small></div>
   <div className="card"><span>Resultado</span><strong>{brl(a.result)}</strong><small>DRE</small></div>
   <div className="card"><span>Diferença Caixa</span><strong>{brl(a.cashDiff)}</strong><small>DFC − Razão</small></div>
  </div>

  <section className="panel wide">
   <div className="panel-title"><h2>Checklist de auditoria</h2><span>{a.overall?'Todos os controles OK':`${a.pending.length} pendência(s)`}</span></div>
   {a.checks.map(c=><div className="check" key={c.id}>
    <i className={c.ok?'ok':'bad'}>{c.ok?'✓':'!'}</i>
    <div><b>{c.label}</b><small>{c.detail}{!c.ok&&<> · <strong>{severityLabel(c.severity)}</strong> · {c.action}</>}</small></div>
   </div>)}
  </section>

  <section className="panel wide">
   <div className="panel-title">
    <div><h2>Rastreabilidade e evidências</h2><span>Origem dos números usados nos controles</span></div>
    <span>{a.checks.reduce((sum,c)=>sum+c.evidence.length,0)} evidências</span>
   </div>
   {a.checks.map(c=><div className="audit-evidence-block" key={`evidence-${c.id}`}>
    <div className="audit-evidence-head"><b>{c.label}</b><span className={c.ok?'audit-status-ok':'audit-status-bad'}>{c.ok?'OK':'REVISAR'}</span></div>
    <div className="audit-evidence-grid">
     {c.evidence.map((e,i)=><div className="audit-evidence-item" key={`${c.id}-${i}`}><small>{e.source}</small><strong>{e.value}</strong><span>{e.detail}</span></div>)}
    </div>
   </div>)}
  </section>

  {!a.overall&&<section className="panel wide">
   <div className="panel-title"><h2>Central de pendências</h2><span>Priorize a correção antes do fechamento</span></div>
   {a.pending.map(p=><div className="check" key={`pending-${p.id}`}><i className="bad">!</i><div><b>{p.label}</b><small><strong>{severityLabel(p.severity)}</strong> · {p.detail}</small><small>Ação recomendada: {p.action}</small></div></div>)}
  </section>}

  <section className="panel">
   <div className="panel-title"><h2>Regra de ouro</h2></div>
   <div className="note">O BI não deve “forçar” o fechamento das demonstrações. Primeiro validamos os lançamentos, depois o Razão e o Balancete, e somente então construímos BP, DRE, DFC e DMPL. Qualquer diferença deve aparecer como pendência para investigação.</div>
  </section>
 </main>
}

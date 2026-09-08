'use client'

import { useEffect, useMemo, useState } from 'react'
import { closingEngine } from '@/lib/closing-engine'
import { getClosingState, writeClosingState, canMoveToClosingStatus } from '@/lib/closing-state'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const months = monthNames.map((name,index)=>({ value:`2026-${String(index+1).padStart(2,'0')}`, name }))

export default function FechamentoContabil(){
 const [month,setMonth]=useState('2026-02')
 const [status,setStatus]=useState<'ABERTO'|'PRE_FECHAMENTO'|'FECHADO'>('ABERTO')
 const c=useMemo(()=>closingEngine(),[])
 const overall=c.checks.overall
 const gate=c.gate
 const state=getClosingState(month)
 const currentStatus=status

 useEffect(()=>{ setStatus(getClosingState(month).status) },[month])

 function advance(target:'PRE_FECHAMENTO'|'FECHADO'){
  if(!canMoveToClosingStatus(currentStatus,target,overall)) return
  const next=writeClosingState(month,target)
  setStatus(next.status)
 }

 const statusLabel=currentStatus==='ABERTO'
  ? (overall?'LIBERADO PARA PRÉ-FECHAMENTO':'PENDÊNCIAS')
  : currentStatus
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

  <section className="panel wide">
   <div className="panel-title"><h2>Competência e status</h2><span>Persistência local</span></div>
   <div style={{display:'grid',gridTemplateColumns:'minmax(220px,1fr) minmax(220px,1fr)',gap:12,alignItems:'end'}}>
    <label className="field"><span>Competência</span><select value={month} onChange={e=>setMonth(e.target.value)}>{months.map(m=><option key={m.value} value={m.value}>{m.name} / 2026</option>)}</select></label>
    <div className="note" style={{margin:0}}><strong>Status: {currentStatus}</strong><br/>A competência selecionada é persistida no navegador. Última atualização: {state.updatedAt===new Date(0).toISOString()?'ainda não registrada':new Date(state.updatedAt).toLocaleString('pt-BR')}.</div>
   </div>
   <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:14}}>
    <button className="primary-btn" disabled={currentStatus!=='ABERTO'||!overall} onClick={()=>advance('PRE_FECHAMENTO')}>Liberar pré-fechamento</button>
    <button className="primary-btn" disabled={currentStatus!=='PRE_FECHAMENTO'||!overall} onClick={()=>advance('FECHADO')}>Concluir fechamento</button>
    {!overall && <span className="note" style={{margin:0}}>Ações bloqueadas até o Zero Difference Gate e os controles obrigatórios estarem OK.</span>}
   </div>
  </section>

  <div className="cards">
   <div className="card"><span>Resultado do período</span><strong>{brl(c.result)}</strong><small>DRE → PL</small></div>
   <div className="card"><span>Zero Difference Gate</span><strong>{gate.summary.ok}/{gate.summary.total}</strong><small>{gate.summary.pending===0?'0 pendências':'Revisar pendências'}</small></div>
   <div className="card"><span>Conciliação de caixa</span><strong>{c.checks.cash?'✓ OK':'! REVISAR'}</strong><small>DFC × Razão</small></div>
   <div className="card"><span>Status da competência</span><strong>{currentStatus}</strong><small>{currentStatus==='FECHADO'?'Lançamentos bloqueados':'Período disponível para processamento'}</small></div>
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
   <div className="panel-title"><h2>Governança do fechamento</h2><span className={currentStatus==='FECHADO'?'ok':currentStatus==='PRE_FECHAMENTO'?'ok':'bad'}>{currentStatus==='FECHADO'?'FECHAMENTO CONCLUÍDO':currentStatus==='PRE_FECHAMENTO'?'PRÉ-FECHAMENTO':'ABERTO'}</span></div>
   <div className="rows">
    <div className="row"><span>Status atual</span><b>{currentStatus}</b></div>
    <div className="row"><span>Próximo estágio</span><b>{currentStatus==='ABERTO'?'PRE_FECHAMENTO':currentStatus==='PRE_FECHAMENTO'?'FECHADO':'Encerrado'}</b></div>
    <div className="row"><span>Regra de transição</span><b>{overall?'Validações aprovadas':'Existem pendências nas validações obrigatórias'}</b></div>
   </div>
  </section>

  <section className="panel">
   <div className="panel-title"><h2>Diagnóstico executivo</h2><span>{overall?'LIBERADO':'BLOQUEADO'}</span></div>
   <div className="note">{overall?'A competência está reconciliada nas demonstrações e no Zero Difference Gate. O status do fechamento agora é persistido por competência, permitindo controlar a transição de ABERTO → PRÉ-FECHAMENTO → FECHADO.':'O fechamento não deve ser considerado concluído enquanto houver divergências. O BI evidencia a diferença e preserva a rastreabilidade, sem criar lançamentos artificiais para “fechar” os números.'}</div>
  </section>

  <section className="panel">
   <div className="panel-title"><h2>Ponte do Patrimônio Líquido</h2><span>DMPL</span></div>
   <div className="rows"><div className="row"><span>PL registrado antes do resultado</span><b>{brl(c.dmplExpected-c.result)}</b></div><div className="row"><span>(+) Resultado do período</span><b>{brl(c.result)}</b></div><div className="row"><span>= PL esperado</span><b>{brl(c.dmplExpected)}</b></div><div className="row"><span>Diferença de reconciliação</span><b>{brl(c.dmplDifference)}</b></div></div>
  </section>
 </main>
}

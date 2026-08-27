import { buildLedger, buildTrialBalance } from './razao-balancete'
import { statementEngine } from './statement-engine'
import { cashFlowEngine } from './dfc-engine'
import { journalIsBalanced, sampleJournal } from './contabil-model'

export type AuditSeverity = 'critical' | 'warning' | 'info'

export function auditEngine(){
  const ledger=buildLedger(); const trial=buildTrialBalance(); const s=statementEngine(); const c=cashFlowEngine()
  const result=s.totals.receitas-s.totals.custos-s.totals.despesas
  const bpDiff=s.totals.ativo-(s.totals.passivo+s.totals.patrimonio)

  const checks=[
    {
      id:'journal',
      label:'Livro Diário: partidas dobradas',
      ok:journalIsBalanced(sampleJournal),
      severity:'critical' as AuditSeverity,
      detail:'Cada lançamento deve ter Débito = Crédito.',
      action:'Revisar os lançamentos desequilibrados antes do fechamento.'
    },
    {
      id:'trial',
      label:'Balancete: consistência dos lançamentos',
      ok:trial.balanced,
      severity:'critical' as AuditSeverity,
      detail:'Todos os lançamentos do diário devem estar balanceados.',
      action:'Identificar e corrigir partidas com diferença entre débito e crédito.'
    },
    {
      id:'bp',
      label:'Balanço: Ativo = Passivo + PL',
      ok:Math.abs(bpDiff)<0.01,
      severity:'critical' as AuditSeverity,
      detail:`Diferença: ${bpDiff.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`,
      action:'Investigar contas patrimoniais, saldos de abertura e encerramento do resultado.'
    },
    {
      id:'cash',
      label:'DFC: Caixa final conciliado',
      ok:Math.abs(c.reconciliation)<0.01,
      severity:'critical' as AuditSeverity,
      detail:`Diferença: ${c.reconciliation.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`,
      action:'Conciliar movimentações da DFC com Caixa e Bancos no Razão.'
    },
    {
      id:'result',
      label:'DRE: resultado calculado',
      ok:Number.isFinite(result),
      severity:'info' as AuditSeverity,
      detail:`Receitas - Custos - Despesas = ${result.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`,
      action:'Validar classificação de receitas, custos e despesas antes do encerramento.'
    },
  ]

  const pending=checks.filter(x=>!x.ok)
  return {
    checks,
    pending,
    result,
    bpDiff,
    cashDiff:c.reconciliation,
    overall:pending.length===0,
    summary:{
      critical:pending.filter(x=>x.severity==='critical').length,
      warning:pending.filter(x=>x.severity==='warning').length,
      info:pending.filter(x=>x.severity==='info').length,
    },
  }
}

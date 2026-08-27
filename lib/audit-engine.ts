import { buildLedger, buildTrialBalance } from './razao-balancete'
import { statementEngine } from './statement-engine'
import { cashFlowEngine } from './dfc-engine'
import { chartOfAccounts, journalIsBalanced, sampleJournal } from './contabil-model'

export type AuditSeverity = 'critical' | 'warning' | 'info'
type Evidence = { source:string; value:string; detail:string }
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})

export function auditEngine(){
  const ledger=buildLedger(); const trial=buildTrialBalance(); const s=statementEngine(); const c=cashFlowEngine()
  const result=s.totals.receitas-s.totals.custos-s.totals.despesas
  const bpDiff=s.totals.ativo-(s.totals.passivo+s.totals.patrimonio)
  const unbalancedEntries=sampleJournal.filter(entry=>{
    const debit=entry.lines.reduce((sum,line)=>sum+line.debit,0)
    const credit=entry.lines.reduce((sum,line)=>sum+line.credit,0)
    return Math.abs(debit-credit)>=0.01
  })
  const cashAccount=chartOfAccounts.find(a=>a.code==='1.1.01')
  const cashRow=ledger.find(row=>row.code==='1.1.01')

  const checks=[
    {id:'journal',label:'Livro Diário: partidas dobradas',ok:journalIsBalanced(sampleJournal),severity:'critical' as AuditSeverity,
      detail:unbalancedEntries.length===0?`${sampleJournal.length} lançamentos validados sem diferença.`:`${unbalancedEntries.length} lançamento(s) com diferença.`,
      action:'Revisar os lançamentos desequilibrados antes do fechamento.',
      evidence:[{source:'Livro Diário',value:`${sampleJournal.length} lançamentos`,detail:'Cada lançamento possui Débito = Crédito.'},{source:'Exceções',value:`${unbalancedEntries.length}`,detail:unbalancedEntries.length===0?'Nenhum lançamento desequilibrado.':'Há lançamentos que exigem correção.'}] as Evidence[]},
    {id:'trial',label:'Balancete: consistência dos lançamentos',ok:trial.balanced,severity:'critical' as AuditSeverity,
      detail:`Débitos e créditos de natureza totalizam ${brl(trial.totalDebit)}.`,action:'Identificar e corrigir partidas com diferença entre débito e crédito.',
      evidence:[{source:'Balancete',value:`D ${brl(trial.totalDebit)} / C ${brl(trial.totalCredit)}`,detail:'Saldos devedores e credores conciliados.'},{source:'Razão',value:`${trial.rows.length} contas movimentadas`,detail:'Saldos originados dos lançamentos do Diário.'}] as Evidence[]},
    {id:'bp',label:'Balanço: Ativo = Passivo + PL',ok:Math.abs(bpDiff)<0.01,severity:'critical' as AuditSeverity,
      detail:`Ativo ${brl(s.totals.ativo)} − Passivo + PL ${brl(s.totals.passivo+s.totals.patrimonio)} = ${brl(bpDiff)}`,
      action:'Investigar contas patrimoniais, saldos de abertura e encerramento do resultado.',
      evidence:[{source:'Ativo',value:brl(s.totals.ativo),detail:'Soma das contas patrimoniais classificadas no BP.'},{source:'Passivo',value:brl(s.totals.passivo),detail:'Soma das obrigações classificadas no BP.'},{source:'Patrimônio Líquido',value:brl(s.totals.patrimonio),detail:`Capital registrado + resultado do período (${brl(s.totals.resultadoPeriodo)}).`}] as Evidence[]},
    {id:'cash',label:'DFC: Caixa final conciliado',ok:Math.abs(c.reconciliation)<0.01,severity:'critical' as AuditSeverity,
      detail:`Caixa final ${brl(c.finalCash)} − Razão ${brl(cashRow?.balance ?? 0)} = ${brl(c.reconciliation)}`,
      action:'Conciliar movimentações da DFC com Caixa e Bancos no Razão.',
      evidence:[{source:'DFC',value:brl(c.finalCash),detail:'Caixa final calculado pelas movimentações de caixa.'},{source:`Razão ${cashAccount?.name ?? 'Caixa e Bancos'}`,value:brl(cashRow?.balance ?? 0),detail:'Saldo da conta de Caixa e Bancos no Razão.'}] as Evidence[]},
    {id:'result',label:'DRE: resultado calculado',ok:Number.isFinite(result),severity:'info' as AuditSeverity,
      detail:`Receitas ${brl(s.totals.receitas)} − Custos ${brl(s.totals.custos)} − Despesas ${brl(s.totals.despesas)} = ${brl(result)}`,
      action:'Validar classificação de receitas, custos e despesas antes do encerramento.',
      evidence:[{source:'Receitas',value:brl(s.totals.receitas),detail:'Contas classificadas como Receita na DRE.'},{source:'Custos',value:brl(s.totals.custos),detail:'Contas classificadas como Custo na DRE.'},{source:'Despesas',value:brl(s.totals.despesas),detail:'Contas classificadas como Despesa na DRE.'}] as Evidence[]},
  ]
  const pending=checks.filter(x=>!x.ok)
  return {checks,pending,result,bpDiff,cashDiff:c.reconciliation,overall:pending.length===0,
    summary:{critical:pending.filter(x=>x.severity==='critical').length,warning:pending.filter(x=>x.severity==='warning').length,info:pending.filter(x=>x.severity==='info').length}}
}

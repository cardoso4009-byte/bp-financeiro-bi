import { buildLedger, buildTrialBalance } from './razao-balancete'
import { statementEngine } from './statement-engine'
import { cashFlowEngine } from './dfc-engine'
import { chartOfAccounts, journalIsBalanced, sampleJournal } from './contabil-model'
import { reconcileManagementBalance } from './balance-reconciliation'
import { auditMonthlyBalance, firstBalanceIssue } from './bp-audit'
import { financialReconciliation } from './financial-reconciliation'

export type AuditSeverity = 'critical' | 'warning' | 'info'
type Evidence = { source:string; value:string; detail:string }
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})

export function auditEngine(){
  const ledger=buildLedger(sampleJournal); const trial=buildTrialBalance(sampleJournal); const s=statementEngine(sampleJournal); const c=cashFlowEngine(sampleJournal)
  const result=s.totals.receitas-s.totals.custos-s.totals.despesas
  const bpDiff=s.totals.ativo-(s.totals.passivo+s.totals.patrimonio)
  const managementBp=reconcileManagementBalance()
  const monthlyBp=auditMonthlyBalance()
  const firstMonthlyIssue=firstBalanceIssue(monthlyBp)
  const financialGate=financialReconciliation()
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
    {id:'bp',label:'Balanço contábil: Ativo = Passivo + PL',ok:Math.abs(bpDiff)<0.01,severity:'critical' as AuditSeverity,
      detail:`Ativo ${brl(s.totals.ativo)} − Passivo + PL ${brl(s.totals.passivo+s.totals.patrimonio)} = ${brl(bpDiff)}`,
      action:'Investigar contas patrimoniais, saldos de abertura e encerramento do resultado.',
      evidence:[{source:'Ativo',value:brl(s.totals.ativo),detail:'Soma das contas patrimoniais classificadas no BP contábil.'},{source:'Passivo',value:brl(s.totals.passivo),detail:'Soma das obrigações classificadas no BP contábil.'},{source:'Patrimônio Líquido',value:brl(s.totals.patrimonio),detail:`Capital registrado + resultado do período (${brl(s.totals.resultadoPeriodo)}).`}] as Evidence[]},
    {id:'bp-management',label:`Balanço gerencial ${managementBp.month}: Ativo = Passivo + PL`,ok:managementBp.balanced,severity:'critical' as AuditSeverity,
      detail:`Ativo ${brl(managementBp.ativo)} − Passivo + PL ${brl(managementBp.passivo+managementBp.patrimonio)} = ${brl(managementBp.difference)}`,
      action:'Corrigir a base patrimonial gerencial antes de considerar o fechamento concluído.',
      evidence:[{source:'Ativo Total',value:brl(managementBp.ativo),detail:`Base gerencial ${managementBp.month}.`},{source:'Passivo Total',value:brl(managementBp.passivo),detail:`Base gerencial ${managementBp.month}.`},{source:'Patrimônio Líquido',value:brl(managementBp.patrimonio),detail:`Base gerencial ${managementBp.month}.`}] as Evidence[]},
    {id:'bp-management-series',label:'Balanço gerencial: auditoria mensal',ok:!firstMonthlyIssue,severity:'critical' as AuditSeverity,
      detail:firstMonthlyIssue?`Primeira inconsistência em ${firstMonthlyIssue.month}: diferença patrimonial ${brl(firstMonthlyIssue.bpDifference)}; composição AC ${brl(firstMonthlyIssue.acCompositionDifference)}; composição ANC ${brl(firstMonthlyIssue.ancCompositionDifference)}.`:'Todos os meses estão conciliados.',
      action:'Localizar o primeiro mês inconsistente e corrigir a origem da série antes do fechamento.',
      evidence:[{source:'Série gerencial',value:`${monthlyBp.length} meses`,detail:'Teste mês a mês da equação patrimonial e das composições do Ativo.'},{source:'Primeira exceção',value:firstMonthlyIssue?.month ?? 'Nenhuma',detail:firstMonthlyIssue?'O erro é rastreável ao primeiro período inconsistente.':'Não foram encontradas divergências.'}] as Evidence[]},
    {id:'cash',label:'DFC: Caixa final conciliado',ok:Math.abs(c.reconciliation)<0.01,severity:'critical' as AuditSeverity,
      detail:`Caixa final ${brl(c.finalCash)} − Razão ${brl(cashRow?.balance ?? 0)} = ${brl(c.reconciliation)}`,
      action:'Conciliar movimentações da DFC com Caixa e Bancos no Razão.',
      evidence:[{source:'DFC',value:brl(c.finalCash),detail:'Caixa final calculado pelas movimentações de caixa.'},{source:`Razão ${cashAccount?.name ?? 'Caixa e Bancos'}`,value:brl(cashRow?.balance ?? 0),detail:'Saldo da conta de Caixa e Bancos no Razão.'}] as Evidence[]},
    {id:'zero-difference-gate',label:'Zero Difference Gate: Core × DRE × DFC × BP',ok:financialGate.overall,severity:'critical' as AuditSeverity,
      detail:financialGate.overall?`Todas as ${financialGate.summary.total} conciliações estão em R$ 0,00.`:`${financialGate.summary.pending} de ${financialGate.summary.total} conciliações ainda apresentam diferença.`,
      action:'Corrigir cada divergência da cadeia financeira antes de liberar o fechamento ou adicionar novos módulos.',
      evidence:[{source:'Conciliação central',value:`${financialGate.summary.ok}/${financialGate.summary.total} OK`,detail:'Comparação estruturada entre Financial Core, DRE, DFC e Balanço gerencial.'},{source:'Pendências',value:`${financialGate.summary.pending}`,detail:'Somente diferenças abaixo de R$ 0,01 são consideradas conciliadas.'}] as Evidence[]},
    {id:'result',label:'DRE: resultado calculado',ok:Number.isFinite(result),severity:'info' as AuditSeverity,
      detail:`Receitas ${brl(s.totals.receitas)} − Custos ${brl(s.totals.custos)} − Despesas ${brl(s.totals.despesas)} = ${brl(result)}`,
      action:'Validar classificação de receitas, custos e despesas antes do encerramento.',
      evidence:[{source:'Receitas',value:brl(s.totals.receitas),detail:'Contas classificadas como Receita na DRE.'},{source:'Custos',value:brl(s.totals.custos),detail:'Contas classificadas como Custo na DRE.'},{source:'Despesas',value:brl(s.totals.despesas),detail:'Contas classificadas como Despesa na DRE.'}] as Evidence[]},
  ]
  const pending=checks.filter(x=>!x.ok)
  return {checks,pending,result,bpDiff,managementBpDifference:managementBp.difference,monthlyBp,firstMonthlyIssue,cashDiff:c.reconciliation,financialGate,overall:pending.length===0,
    summary:{critical:pending.filter(x=>x.severity==='critical').length,warning:pending.filter(x=>x.severity==='warning').length,info:pending.filter(x=>x.severity==='info').length}}
}

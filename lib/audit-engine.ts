import { buildLedger, buildTrialBalance } from './razao-balancete'
import { statementEngine } from './statement-engine'
import { cashFlowEngine } from './dfc-engine'
import { journalIsBalanced, sampleJournal } from './contabil-model'
import { financialData } from './financial-data'
import { reconcileFinancialStatements } from './reconciliation-engine'

export function auditEngine(){
  const ledger=buildLedger(); const trial=buildTrialBalance(); const s=statementEngine(); const c=cashFlowEngine()
  const reconciliation=reconcileFinancialStatements(financialData)
  const result=s.totals.receitas-s.totals.custos-s.totals.despesas
  const bpDiff=s.totals.ativo-(s.totals.passivo+s.totals.patrimonio)
  const checks=[
    {id:'journal',label:'Livro Diário: partidas dobradas',ok:journalIsBalanced(sampleJournal),detail:'Cada lançamento deve ter Débito = Crédito.'},
    {id:'trial',label:'Balancete: consistência dos lançamentos',ok:trial.balanced,detail:'Todos os lançamentos do diário estão balanceados.'},
    {id:'bp',label:'Balanço: Ativo = Passivo + PL',ok:Math.abs(bpDiff)<0.01,detail:`Diferença: ${bpDiff.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`},
    {id:'cash',label:'DFC: Caixa final conciliado',ok:Math.abs(c.reconciliation)<0.01,detail:`Diferença: ${c.reconciliation.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`},
    {id:'result',label:'DRE: resultado calculado',ok:Number.isFinite(result),detail:`Receitas - Custos - Despesas = ${result.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`},
    {id:'reconciliation-dmpl',label:'DMPL: ponte do patrimônio líquido',ok:reconciliation.dmpl.status==='OK',detail:`PL Inicial + Lucro Líquido + Distribuições − PL Final = ${reconciliation.dmpl.difference.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`},
    {id:'reconciliation-bp',label:'Reconciliação central: Balanço',ok:reconciliation.patrimonial.status==='OK',detail:`Ativo − Passivo − PL = ${reconciliation.patrimonial.difference.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`},
    {id:'reconciliation-cash',label:'Reconciliação central: Caixa',ok:reconciliation.caixa.status==='OK',detail:`Caixa Final − (Inicial + Operacional + Investimentos + Financiamentos) = ${reconciliation.caixa.difference.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`},
  ]
  return {checks, result, bpDiff, cashDiff:c.reconciliation, dmplDiff:reconciliation.dmpl.difference, overall:checks.every(x=>x.ok)}
}

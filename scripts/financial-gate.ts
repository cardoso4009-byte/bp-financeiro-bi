import {financialReconciliation} from '../lib/financial-reconciliation'

const result=financialReconciliation()

if(!result.overall){
  console.error('ZERO DIFFERENCE GATE: FALHOU')
  for(const check of result.pending){
    console.error(`- ${check.id} | ${check.month ?? ''} | ${check.metric} | diferença: R$ ${check.difference.toFixed(2)}`)
  }
  process.exit(1)
}

console.log(`ZERO DIFFERENCE GATE: OK — ${result.summary.ok}/${result.summary.total} verificações aprovadas; 0 pendências.`)

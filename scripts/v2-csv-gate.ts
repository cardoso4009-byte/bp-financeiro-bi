import { parseV2Csv, stageV2Csv } from '../lib/v2-csv-import'

const csv = `company_id,account_id,description,date,competence,amount,nature,cash_basis,movement_class,external_id
empresa-1,conta-101,"Recebimento, cliente",2026-09-14,2026-09,"1.250,50",credit,caixa,receita,nf-1001
empresa-1,conta-101,Duplicado,2026-09-15,2026-09,500,credit,caixa,receita,nf-1001
empresa-1,conta-101,Competencia invalida,2026-09-15,2026-13,500,credit,caixa,receita,nf-1003`

const parsed = parseV2Csv(csv)
if (parsed.length !== 3) throw new Error('CSV gate: quantidade de linhas inesperada.')
if (parsed[0].values.description !== 'Recebimento, cliente') throw new Error('CSV gate: aspas não foram preservadas corretamente.')

const result = stageV2Csv(csv)
if (result.rowsReceived !== 3) throw new Error('CSV gate: rowsReceived incorreto.')
if (result.rowsAccepted !== 1 || result.rowsRejected !== 2) throw new Error('CSV gate: staging não separou aprovados e rejeitados.')
if (result.rows[1].issues.some((issue) => issue.code === 'duplicate_external_id') === false) throw new Error('CSV gate: duplicidade não detectada.')
if (result.rows[2].issues.some((issue) => issue.code === 'invalid_competence') === false) throw new Error('CSV gate: competência inválida não detectada.')
if (result.rows[0].entry.amount !== 1250.5) throw new Error('CSV gate: valor monetário brasileiro não normalizado.')

console.log('V2 CSV Gate OK: leitura, normalização, staging, aprovação e rejeição validados.')

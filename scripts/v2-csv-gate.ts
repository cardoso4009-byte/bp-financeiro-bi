import { parseV2Csv, stageV2Csv } from '../lib/v2-csv-import'

const csv = `company_id,account_id,description,date,competence,amount,nature,cash_basis,movement_class,external_id,due_date
empresa-1,conta-101,"Recebimento, cliente",2026-09-14,2026-09,"1.250,50",credit,caixa,receita,nf-1001,2026-09-20
empresa-1,conta-101,Valor decimal,2026-09-15,2026-09,500.75,credit,caixa,receita,nf-1002,
empresa-1,conta-101,Duplicado,2026-09-15,2026-09,500,credit,caixa,receita,nf-1001,
empresa-1,conta-101,Competencia invalida,2026-09-15,2026-13,500,credit,caixa,receita,nf-1003,
empresa-1,conta-101,Vencimento invalido,2026-09-15,2026-09,500,credit,caixa,receita,nf-1004,2026-02-30`

const parsed = parseV2Csv(csv)
if (parsed.length !== 5) throw new Error('CSV gate: quantidade de linhas inesperada.')
if (parsed[0].values.description !== 'Recebimento, cliente') throw new Error('CSV gate: aspas não foram preservadas corretamente.')

const result = stageV2Csv(csv)
if (result.rowsReceived !== 5) throw new Error('CSV gate: rowsReceived incorreto.')
if (result.rowsAccepted !== 2 || result.rowsRejected !== 3) throw new Error('CSV gate: staging não separou aprovados e rejeitados.')
if (!result.rows[2].issues.some((issue) => issue.code === 'duplicate_external_id')) throw new Error('CSV gate: duplicidade não detectada.')
if (!result.rows[3].issues.some((issue) => issue.code === 'invalid_competence')) throw new Error('CSV gate: competência inválida não detectada.')
if (!result.rows[4].issues.some((issue) => issue.code === 'invalid_date')) throw new Error('CSV gate: data opcional inválida não detectada.')
if (result.rows[0].entry.amount !== 1250.5) throw new Error('CSV gate: valor monetário brasileiro não normalizado.')
if (result.rows[1].entry.amount !== 500.75) throw new Error('CSV gate: valor decimal com ponto foi alterado indevidamente.')

const semicolonCsv = `company_id;account_id;description;date;competence;amount;nature;cash_basis;movement_class;external_id
empresa-1;conta-101;Venda;2026-09-16;2026-09;2.000,00;credit;caixa;receita;nf-2001`
const semicolon = stageV2Csv(semicolonCsv, ';')
if (semicolon.rowsAccepted !== 1 || semicolon.rows[0].entry.amount !== 2000) throw new Error('CSV gate: delimitador ponto e vírgula não suportado corretamente.')

console.log('V2 CSV Gate OK: leitura, normalização monetária, delimitadores, staging e rejeições validados.')

import { validateFinancialEntries } from '../lib/v2-data-validation'

const validEntry = {
  companyId: 'empresa-1',
  accountId: 'conta-101',
  description: 'Recebimento de cliente',
  date: '2026-09-14',
  competence: '2026-09',
  amount: 1250.5,
  nature: 'credit' as const,
  cashBasis: 'caixa' as const,
  movementClass: 'receita' as const,
  source: 'csv' as const,
  externalId: 'nf-1001',
}

const results = validateFinancialEntries([
  validEntry,
  { ...validEntry, externalId: 'nf-1002', competence: '2026-13' },
  { ...validEntry, externalId: 'nf-1003', companyId: '' },
  { ...validEntry, externalId: 'nf-1004', amount: Number.NaN },
  { ...validEntry, externalId: 'nf-1005', nature: 'invalid' as never },
  { ...validEntry, externalId: 'nf-1001' },
])

const [valid, invalidCompetence, missingCompany, invalidAmount, invalidNature, duplicate] = results

if (!valid.valid) throw new Error('V2 gate: lançamento válido foi rejeitado.')
if (invalidCompetence.valid || !invalidCompetence.issues.some((issue) => issue.code === 'invalid_competence')) {
  throw new Error('V2 gate: competência inválida não foi detectada.')
}
if (missingCompany.valid || !missingCompany.issues.some((issue) => issue.code === 'required')) {
  throw new Error('V2 gate: campo obrigatório não foi detectado.')
}
if (invalidAmount.valid || !invalidAmount.issues.some((issue) => issue.code === 'invalid_amount')) {
  throw new Error('V2 gate: valor inválido não foi detectado.')
}
if (invalidNature.valid || !invalidNature.issues.some((issue) => issue.code === 'invalid_nature')) {
  throw new Error('V2 gate: natureza inválida não foi detectada.')
}
if (duplicate.valid || !duplicate.issues.some((issue) => issue.code === 'duplicate_external_id')) {
  throw new Error('V2 gate: duplicidade não foi detectada.')
}

console.log('V2 Data Gate OK: obrigatoriedade, competência, valor, enumerações e duplicidade validados.')

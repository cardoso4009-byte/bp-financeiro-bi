import { buildLedger } from './razao-balancete'
import { mappingFor } from './account-mapping'

export function statementEngine() {
  const ledger = buildLedger()
  const mapped = ledger.map(row => ({ ...row, mapping: mappingFor(row.code) }))
  const bp = mapped.filter(r => r.mapping?.statements.includes('BP'))
  const dre = mapped.filter(r => r.mapping?.statements.includes('DRE'))
  const dmpl = mapped.filter(r => r.mapping?.statements.includes('DMPL'))
  return {
    bp,
    dre,
    dmpl,
    totals: {
      ativo: bp.filter(r => r.class === 'ativo').reduce((s,r) => s + r.balance, 0),
      passivo: bp.filter(r => r.class === 'passivo').reduce((s,r) => s + r.balance, 0),
      patrimonio: bp.filter(r => r.class === 'patrimonio').reduce((s,r) => s + r.balance, 0),
      receitas: dre.filter(r => r.class === 'receita').reduce((s,r) => s + r.balance, 0),
      custos: dre.filter(r => r.class === 'custo').reduce((s,r) => s + r.balance, 0),
      despesas: dre.filter(r => r.class === 'despesa').reduce((s,r) => s + r.balance, 0),
    },
  }
}

import { buildLedger } from './razao-balancete'
import { mappingFor } from './account-mapping'

export function statementEngine() {
  const ledger = buildLedger()
  const mapped = ledger.map(row => ({ ...row, mapping: mappingFor(row.code) }))
  const bp = mapped.filter(r => r.mapping?.statements.includes('BP'))
  const dre = mapped.filter(r => r.mapping?.statements.includes('DRE'))
  const dmpl = mapped.filter(r => r.mapping?.statements.includes('DMPL'))

  const ativo = bp.filter(r => r.class === 'ativo').reduce((s, r) => s + r.balance, 0)
  const passivo = bp.filter(r => r.class === 'passivo').reduce((s, r) => s + r.balance, 0)
  const patrimonioRegistrado = bp.filter(r => r.class === 'patrimonio').reduce((s, r) => s + r.balance, 0)
  const receitas = dre.filter(r => r.class === 'receita').reduce((s, r) => s + r.balance, 0)
  const custos = dre.filter(r => r.class === 'custo').reduce((s, r) => s + r.balance, 0)
  const despesas = dre.filter(r => r.class === 'despesa').reduce((s, r) => s + r.balance, 0)

  // Enquanto o exercício estiver aberto, o resultado ainda não foi encerrado
  // para Lucros/Prejuízos Acumulados no Razão. No BP, porém, ele compõe o PL.
  // Portanto o motor integra o resultado do período ao patrimônio apresentado.
  const resultadoPeriodo = receitas - custos - despesas
  const patrimonio = patrimonioRegistrado + resultadoPeriodo

  return {
    bp,
    dre,
    dmpl,
    totals: {
      ativo,
      passivo,
      patrimonioRegistrado,
      resultadoPeriodo,
      patrimonio,
      receitas,
      custos,
      despesas,
    },
  }
}

import { chartOfAccounts, entryTotals, type JournalEntry } from './accounting-core'
import type { FinancialEntry } from './lancamentos-data'
import { FINANCIAL_STORAGE_KEY, readFinancialSource } from './financial-source'

export type IntegrationResult = {
  entries: JournalEntry[]
  errors: string[]
}

const accountExists = (code: string) => chartOfAccounts.some(account => account.code === code)

function line(account: string, debit: number, credit: number) {
  return { account, debit: Math.max(0, debit), credit: Math.max(0, credit) }
}

/**
 * Converte a base financeira gerencial em partidas dobradas.
 * A classificação é determinística e usa o tipo/status do lançamento.
 */
export function financialEntryToJournal(entry: FinancialEntry): JournalEntry {
  const amount = Math.abs(Number(entry.value || 0))
  const paid = entry.status === 'Pago'

  let debitAccount = '1.1.01'
  let creditAccount = '4.1'

  if (entry.type === 'Receita') {
    debitAccount = paid ? '1.1.01' : '1.1.02'
    creditAccount = '4.1'
  } else if (entry.type === 'Despesa') {
    debitAccount = '6.1'
    creditAccount = paid ? '1.1.01' : '2.1.01'
  } else if (entry.type === 'CAPEX') {
    debitAccount = '1.2.01'
    creditAccount = paid ? '1.1.01' : '2.1.01'
  } else if (entry.type === 'Financiamento') {
    if (entry.value >= 0) {
      debitAccount = '1.1.01'
      creditAccount = '2.2.01'
    } else {
      debitAccount = '2.2.01'
      creditAccount = '1.1.01'
    }
  }

  return {
    id: `FIN-${entry.id}`,
    date: entry.date,
    competence: entry.competence,
    description: entry.description,
    document: undefined,
    costCenter: entry.costCenter,
    source: 'INTEGRACAO',
    lines: [line(debitAccount, amount, 0), line(creditAccount, 0, amount)],
  }
}

export function financialEntriesToJournal(entries: FinancialEntry[]): IntegrationResult {
  const errors: string[] = []
  const journal: JournalEntry[] = []

  for (const entry of entries) {
    const amount = Math.abs(Number(entry.value || 0))
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push(`${entry.id}: valor inválido para contabilização.`)
      continue
    }

    const generated = financialEntryToJournal(entry)
    for (const journalLine of generated.lines) {
      if (!accountExists(journalLine.account)) errors.push(`${entry.id}: conta contábil inexistente ${journalLine.account}.`)
    }

    if (!entryTotals(generated).balanced) errors.push(`${entry.id}: lançamento integrado não está balanceado.`)
    else journal.push(generated)
  }

  return { entries: journal, errors }
}

/**
 * Ponto único de integração entre a base financeira e o Diário.
 * O parâmetro é mantido apenas por compatibilidade; a chave oficial agora
 * pertence ao módulo financial-source.
 */
export function journalFromLocalStorage(storageKey = FINANCIAL_STORAGE_KEY): IntegrationResult {
  if (typeof window === 'undefined') return { entries: [], errors: [] }

  const source = readFinancialSource()
  const result = financialEntriesToJournal(source.entries)
  return {
    entries: result.entries,
    errors: [...source.errors, ...result.errors],
  }
}

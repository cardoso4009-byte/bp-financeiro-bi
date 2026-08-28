import { initialEntries, type FinancialEntry } from './lancamentos-data'

/** Chave única da base financeira persistida no navegador. */
export const FINANCIAL_STORAGE_KEY = 'bp-financeiro-lancamentos'

export type FinancialSource = {
  entries: FinancialEntry[]
  origin: 'LOCAL_STORAGE' | 'INITIAL_DATA'
  errors: string[]
}

function isFinancialEntry(value: unknown): value is FinancialEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<FinancialEntry>
  return (
    typeof entry.id === 'number' &&
    typeof entry.date === 'string' &&
    (entry.type === 'Receita' || entry.type === 'Despesa' || entry.type === 'CAPEX' || entry.type === 'Financiamento') &&
    typeof entry.category === 'string' &&
    typeof entry.costCenter === 'string' &&
    typeof entry.description === 'string' &&
    typeof entry.competence === 'string' &&
    typeof entry.dueDate === 'string' &&
    typeof entry.paymentDate === 'string' &&
    (entry.status === 'Pago' || entry.status === 'Em aberto') &&
    typeof entry.value === 'number' &&
    Number.isFinite(entry.value)
  )
}

/**
 * Único ponto de leitura da base financeira no front-end.
 * Se não houver dados salvos, usa a carga demonstrativa inicial.
 */
export function readFinancialSource(): FinancialSource {
  if (typeof window === 'undefined') {
    return { entries: initialEntries, origin: 'INITIAL_DATA', errors: [] }
  }

  try {
    const raw = window.localStorage.getItem(FINANCIAL_STORAGE_KEY)
    if (!raw) return { entries: initialEntries, origin: 'INITIAL_DATA', errors: [] }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return { entries: initialEntries, origin: 'INITIAL_DATA', errors: ['Base financeira inválida: formato não é uma lista.'] }
    }

    const invalid = parsed.filter(item => !isFinancialEntry(item)).length
    const entries = parsed.filter(isFinancialEntry)
    if (invalid > 0) {
      return { entries, origin: 'LOCAL_STORAGE', errors: [`${invalid} lançamento(s) inválido(s) foram ignorados.`] }
    }

    return { entries, origin: 'LOCAL_STORAGE', errors: [] }
  } catch {
    return { entries: initialEntries, origin: 'INITIAL_DATA', errors: ['Não foi possível ler a base financeira salva; dados iniciais foram utilizados.'] }
  }
}

export function writeFinancialSource(entries: FinancialEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FINANCIAL_STORAGE_KEY, JSON.stringify(entries))
}

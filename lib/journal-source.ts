import type { JournalEntry } from './accounting-core'
import { sampleJournal } from './accounting-core'
import { journalFromLocalStorage } from './financial-accounting-integration'

/** Fonte única do Diário para componentes client-side.
 * Quando existem lançamentos financeiros, eles prevalecem sobre a amostra.
 * Sem dados persistidos, usamos a base demonstrativa para a aplicação continuar navegável.
 */
export function readJournalSource(): { entries: JournalEntry[]; integrated: boolean; errors: string[] } {
  if (typeof window === 'undefined') {
    return { entries: sampleJournal, integrated: false, errors: [] }
  }
  const result = journalFromLocalStorage()
  if (result.entries.length) return { entries: result.entries, integrated: true, errors: result.errors }
  return { entries: sampleJournal, integrated: false, errors: result.errors }
}

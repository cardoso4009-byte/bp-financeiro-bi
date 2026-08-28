// Compatibilidade de importação: o modelo contábil oficial agora vive em accounting-core.ts.
// Manter este arquivo evita quebrar as telas existentes enquanto os imports são migrados.
export {
  chartOfAccounts,
  sampleJournal,
  entryTotals,
  journalIsBalanced,
  validateJournalEntry,
  validateJournal,
  ledgerFromJournal,
  journalTotals,
} from './accounting-core'

export type {
  Account,
  AccountClass,
  AccountNature,
  JournalLine,
  JournalEntry,
  AccountBalance,
} from './accounting-core'

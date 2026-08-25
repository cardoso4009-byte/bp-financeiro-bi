export type ReconciliationStatus = 'OK' | 'DIVERGENTE'

export type ReconciliationResult = {
  patrimonial: { difference: number; status: ReconciliationStatus }
  caixa: { difference: number; status: ReconciliationStatus }
  dmpl: { difference: number; status: ReconciliationStatus }
}

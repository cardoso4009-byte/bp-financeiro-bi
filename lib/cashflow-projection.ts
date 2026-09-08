export type ProjectionPeriod = {
  competence: string
  month: string
  openingCash: number
  receivables: number
  payables: number
  financing: number
  capex: number
  projectedNet: number
  closingCash: number
  risk: 'normal' | 'attention' | 'critical'
}

export type ProjectionInput = {
  initialCash: number
  receivablesByMonth: Record<string, number>
  payablesByMonth: Record<string, number>
  financingByMonth: Record<string, number>
  capexByMonth: Record<string, number>
}

export const projectionMonths = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function projectCashFlow(input: ProjectionInput, year = 2026): ProjectionPeriod[] {
  let cash = input.initialCash
  return projectionMonths.map((month, index) => {
    const competence = `${year}-${String(index + 1).padStart(2, '0')}`
    const receivables = input.receivablesByMonth[competence] || 0
    const payables = input.payablesByMonth[competence] || 0
    const financing = input.financingByMonth[competence] || 0
    const capex = input.capexByMonth[competence] || 0
    const projectedNet = receivables - payables + financing - capex
    const openingCash = cash
    cash += projectedNet
    const risk = cash < 0 ? 'critical' : cash < input.initialCash * 0.2 ? 'attention' : 'normal'
    return { competence, month, openingCash, receivables, payables, financing, capex, projectedNet, closingCash: cash, risk }
  })
}

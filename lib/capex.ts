export type CapexStatus = 'planejado' | 'aprovado' | 'contratado' | 'em_execucao' | 'realizado' | 'cancelado'
export type CapexCategory = 'expansao' | 'manutencao' | 'tecnologia' | 'infraestrutura' | 'equipamentos' | 'outros'

export interface CapexProject {
  id: string
  companyId: string
  code: string
  name: string
  costCenterId?: string
  responsible?: string
  category: CapexCategory
  approvedBudget: number
  contractedAmount: number
  realizedAmount: number
  forecastAmount: number
  startDate?: string
  expectedEndDate?: string
  supplier?: string
  status: CapexStatus
  deviationCause?: string
  correctiveAction?: string
  description?: string
}

export interface CapexReport {
  projects: CapexProject[]
  approvedBudget: number
  contractedAmount: number
  realizedAmount: number
  balanceToRealize: number
  forecastAmount: number
  forecastVariance: number
  realizedVariance: number
  projectCount: number
}

export function buildCapexReport(projects: CapexProject[]): CapexReport {
  const approvedBudget=projects.reduce((s,p)=>s+p.approvedBudget,0)
  const contractedAmount=projects.reduce((s,p)=>s+p.contractedAmount,0)
  const realizedAmount=projects.reduce((s,p)=>s+p.realizedAmount,0)
  const forecastAmount=projects.reduce((s,p)=>s+p.forecastAmount,0)
  return {
    projects,
    approvedBudget,
    contractedAmount,
    realizedAmount,
    balanceToRealize:Math.max(approvedBudget-realizedAmount,0),
    forecastAmount,
    forecastVariance:forecastAmount-approvedBudget,
    realizedVariance:realizedAmount-approvedBudget,
    projectCount:projects.length,
  }
}

export function capexStatusLabel(status:CapexStatus){
  return ({planejado:'Planejado',aprovado:'Aprovado',contratado:'Contratado',em_execucao:'Em execução',realizado:'Realizado',cancelado:'Cancelado'} as Record<CapexStatus,string>)[status]
}

export function capexCategoryLabel(category:CapexCategory){
  return ({expansao:'Expansão',manutencao:'Manutenção',tecnologia:'Tecnologia',infraestrutura:'Infraestrutura',equipamentos:'Equipamentos',outros:'Outros'} as Record<CapexCategory,string>)[category]
}

export function validateCapexProjects(projects:CapexProject[]):string[]{
  const errors:string[]=[]
  const ids=new Set<string>()
  for(const p of projects){
    if(!p.id) errors.push('Projeto CAPEX sem id.')
    if(ids.has(p.id)) errors.push(`Projeto CAPEX duplicado: ${p.id}`)
    ids.add(p.id)
    if(!p.companyId) errors.push(`Empresa ausente: ${p.id}`)
    if(!p.code) errors.push(`Código ausente: ${p.id}`)
    if(!p.name) errors.push(`Nome ausente: ${p.id}`)
    for(const [label,value] of [['orçamento',p.approvedBudget],['contratado',p.contractedAmount],['realizado',p.realizedAmount],['forecast',p.forecastAmount]] as const){
      if(!Number.isFinite(value)||value<0) errors.push(`Valor de ${label} inválido: ${p.id}`)
    }
  }
  return errors
}

import { cookies } from 'next/headers'
import { neon } from '@neondatabase/serverless'
import { AUTH_COOKIE_NAME, verifySession } from '@/lib/auth'
import { getDatabaseUrl } from '@/lib/db'

export const PERMISSIONS = {
  AUDIT_READ: 'audit.read',
  COMPANY_MANAGE: 'company.manage',
  DASHBOARD_VIEW: 'dashboard.view',
  FINANCIAL_READ: 'financial.read',
  FINANCIAL_WRITE: 'financial.write',
  FORECAST_MANAGE: 'forecast.manage',
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export async function getCurrentUserPermissions(): Promise<Set<string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const session = verifySession(token)

  if (!session?.userId || !session.companyId) {
    return new Set()
  }

  const sql = neon(getDatabaseUrl())
  const rows = await sql`
    select distinct p.key
    from company_users cu
    join role_permissions rp on rp.role_id = cu.role_id
    join permissions p on p.id = rp.permission_id
    where cu.user_id = ${session.userId}
      and cu.company_id = ${session.companyId}
  `

  return new Set(rows.map((row) => String(row.key)))
}

export async function hasPermission(permission: PermissionKey | string) {
  const permissions = await getCurrentUserPermissions()
  return permissions.has(permission)
}

export async function requirePermission(permission: PermissionKey | string) {
  const allowed = await hasPermission(permission)

  if (!allowed) {
    throw new Error('FORBIDDEN')
  }
}


export function getRequiredPermissionForPath(pathname: string): PermissionKey | null {
  if (pathname === '/' || pathname === '/indicadores') {
    return PERMISSIONS.DASHBOARD_VIEW
  }

  if (
    pathname === '/forecast-gerencial-v2' ||
    pathname === '/painel-executivo-forecast-v2' ||
    pathname === '/cenarios-forecast-v2'
  ) {
    return PERMISSIONS.FORECAST_MANAGE
  }

  if (pathname === '/auditoria-contabil') {
    return PERMISSIONS.AUDIT_READ
  }

  if (pathname === '/lancamentos' || pathname === '/integracao') {
    return PERMISSIONS.FINANCIAL_WRITE
  }

  const financialReadPaths = [
    '/dre-gerencial',
    '/balanco-gerencial',
    '/dfc',
    '/dmpl',
    '/gestao',
    '/fluxo-caixa',
    '/contas-receber-pagar',
    '/capital-giro',
    '/opex',
    '/centros-resultado',
    '/budget-realizado',
    '/capex-gerencial',
    '/capex-cronograma',
    '/controladoria-gerencial-v2',
    '/plano-acao-gerencial-v2',
    '/contabil',
    '/razao',
    '/mapeamento-contabil',
    '/demonstracoes-integradas',
    '/dfc-integrada',
    '/fechamento-contabil',
  ]

  return financialReadPaths.includes(pathname) ? PERMISSIONS.FINANCIAL_READ : null
}

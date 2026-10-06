import { neon } from '@neondatabase/serverless'
import { getCurrentSession } from '@/lib/session'
import { getDatabaseUrl } from '@/lib/db'

export const PERMISSIONS = {
  AUDIT_READ: 'audit.read',
  COMPANY_MANAGE: 'company.manage',
  DASHBOARD_VIEW: 'dashboard.view',
  FINANCIAL_READ: 'financial.read',
  FINANCIAL_WRITE: 'financial.write',
  FORECAST_MANAGE: 'forecast.manage',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export async function hasPermission(permission: Permission) {
  const session = await getCurrentSession()

  if (!session?.userId || !session.companyId) {
    return false
  }

  const sql = neon(getDatabaseUrl())

  const rows = await sql`
    select 1
    from users u
    join company_users cu on cu.user_id = u.id
    join roles r on r.id = cu.role_id
    join role_permissions rp on rp.role_id = r.id
    join permissions p on p.id = rp.permission_id
    where u.id = ${session.userId}
      and cu.company_id = ${session.companyId}
      and u.active = true
      and p.key = ${permission}
    limit 1
  `

  return rows.length > 0
}

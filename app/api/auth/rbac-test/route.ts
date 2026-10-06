import { NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/session'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  const session = await getCurrentSession()

  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 },
    )
  }

  const [
    dashboardView,
    financialRead,
    financialWrite,
    forecastManage,
  ] = await Promise.all([
    hasPermission(PERMISSIONS.DASHBOARD_VIEW),
    hasPermission(PERMISSIONS.FINANCIAL_READ),
    hasPermission(PERMISSIONS.FINANCIAL_WRITE),
    hasPermission(PERMISSIONS.FORECAST_MANAGE),
  ])

  return NextResponse.json({
    authenticated: true,
    userId: session.userId,
    companyId: session.companyId,
    roleKey: session.roleKey,
    permissions: {
      dashboardView,
      financialRead,
      financialWrite,
      forecastManage,
    },
  })
}

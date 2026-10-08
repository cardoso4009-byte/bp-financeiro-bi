import './globals.css'
import './navigation-sections.css'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import AgingExecutiveAlerts from './components/aging-executive-alerts'
import AgingManagementPanel from './components/aging-management-panel'
import BpShell from './components/bp-shell'
import { getCurrentUserPermissions, getRequiredPermissionForPath } from '@/lib/permissions'

export const metadata: Metadata = {
  title: 'BP Financeiro BI',
  description: 'Dashboard de Controladoria e Finanças Corporativas'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-bp-pathname') ?? ''
  const isPublicPath = pathname === '' || pathname === '/login' || pathname === '/acesso-negado'
  const permissions = isPublicPath ? new Set<string>() : await getCurrentUserPermissions()
  const requiredPermission = isPublicPath ? null : getRequiredPermissionForPath(pathname)

  if (requiredPermission && !permissions.has(requiredPermission)) {
    redirect('/acesso-negado')
  }

  return (
    <html lang="pt-BR">
      <body>
        <BpShell permissions={Array.from(permissions)}>
          <AgingExecutiveAlerts />
          <AgingManagementPanel />
          {children}
        </BpShell>
      </body>
    </html>
  )
}

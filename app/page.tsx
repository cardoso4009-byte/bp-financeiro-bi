import { redirect } from 'next/navigation'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import HomeClient from './page-client'

export default async function Home() {
  const allowed = await hasPermission(PERMISSIONS.DASHBOARD_VIEW)

  if (!allowed) {
    redirect('/acesso-negado')
  }

  return <HomeClient />
}

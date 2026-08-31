import './globals.css'
import './navigation-sections.css'
import type { Metadata } from 'next'
import NavigationActions from './components/navigation-actions'
import AgingExecutiveAlerts from './components/aging-executive-alerts'
import AgingManagementPanel from './components/aging-management-panel'

export const metadata: Metadata = {
  title: 'BP Financeiro BI',
  description: 'Dashboard de Controladoria e Finanças Corporativas'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body><NavigationActions /><AgingExecutiveAlerts /><AgingManagementPanel />{children}</body></html>
}

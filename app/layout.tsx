import './globals.css'
import type { Metadata } from 'next'
import NavigationActions from './components/navigation-actions'

export const metadata: Metadata = {
  title: 'BP Financeiro BI',
  description: 'Dashboard de Controladoria e Finanças Corporativas'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body><NavigationActions />{children}</body></html>
}

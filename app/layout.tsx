import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BP Financeiro BI',
  description: 'Dashboard de Controladoria e Finanças Corporativas'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>
}

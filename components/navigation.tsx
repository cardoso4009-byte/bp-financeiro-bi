'use client'

import { useRouter } from 'next/navigation'

export default function Navigation() {
  const router = useRouter()
  return <nav className="navigation-actions">
    <button type="button" onClick={() => router.back()} className="nav-btn">← Voltar</button>
    <button type="button" onClick={() => router.push('/')} className="nav-btn">⌂ Dashboard</button>
  </nav>
}

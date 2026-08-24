'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function NavigationActions() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/') return null

  const goBack = () => {
    if (window.history.length > 1) window.history.back()
    else router.push('/')
  }

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      padding: '14px 24px 0',
      maxWidth: 1400,
      margin: '0 auto',
    }}>
      <button
        type="button"
        onClick={goBack}
        style={{
          border: '1px solid #d9e0ea',
          background: '#ffffff',
          color: '#17345f',
          borderRadius: 10,
          padding: '9px 14px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(15, 35, 65, 0.06)',
        }}
      >
        ← Voltar
      </button>
      <button
        type="button"
        onClick={() => router.push('/')}
        style={{
          border: '1px solid #17345f',
          background: '#17345f',
          color: '#ffffff',
          borderRadius: 10,
          padding: '9px 14px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(15, 35, 65, 0.10)',
        }}
      >
        ⌂ Dashboard
      </button>
    </div>
  )
}

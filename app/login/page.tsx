'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'Não foi possível autenticar.')
        return
      }

      const next = new URLSearchParams(window.location.search).get('next')
      router.replace(next?.startsWith('/') ? next : '/')
      router.refresh()
    } catch {
      setError('Não foi possível conectar ao serviço de autenticação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#071526' }}>
      <section style={{ width: '100%', maxWidth: 420, padding: 32, borderRadius: 18, background: '#fff', boxShadow: '0 24px 70px rgba(0,0,0,.25)' }}>
        <div style={{ marginBottom: 24 }}>
          <small style={{ color: '#60758a', letterSpacing: '.08em', fontWeight: 700 }}>BP FINANCEIRO</small>
          <h1 style={{ margin: '8px 0 6px', color: '#122b45' }}>Acesso seguro</h1>
          <p style={{ margin: 0, color: '#60758a' }}>Entre para acessar o ambiente financeiro.</p>
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6, color: '#122b45', fontWeight: 700 }}>
            E-mail
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="username" required style={{ padding: 12, border: '1px solid #cbd7e3', borderRadius: 9 }} />
          </label>

          <label style={{ display: 'grid', gap: 6, color: '#122b45', fontWeight: 700 }}>
            Senha
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" required style={{ padding: 12, border: '1px solid #cbd7e3', borderRadius: 9 }} />
          </label>

          {error && <p role="alert" style={{ margin: 0, color: '#b42318', fontSize: 14 }}>{error}</p>}

          <button disabled={loading} type="submit" style={{ marginTop: 6, padding: 13, border: 0, borderRadius: 9, background: '#1677c8', color: '#fff', fontWeight: 800, cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

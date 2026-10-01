import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, configuredAuthEmail, createSession, verifyPassword } from '@/lib/auth'

function safeAuthError(error: unknown) {
  if (!(error instanceof Error)) return 'unknown'
  const message = error.message

  if (message === 'BP_AUTH_EMAIL is not configured') return 'missing_email'
  if (message === 'BP_AUTH_PASSWORD_HASH is not configured') return 'missing_password_hash'
  if (message === 'BP_AUTH_SESSION_SECRET is not configured') return 'missing_session_secret'
  if (message === 'BP_AUTH_PASSWORD_HASH has an invalid format') return 'invalid_password_hash'
  return 'runtime_error'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!email || !password || email !== configuredAuthEmail() || !(await verifyPassword(password))) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: createSession(email),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    return response
  } catch (error) {
    console.error('[auth/login] safe configuration diagnostic:', safeAuthError(error))
    return NextResponse.json({ error: 'Autenticação não configurada corretamente.' }, { status: 500 })
  }
}

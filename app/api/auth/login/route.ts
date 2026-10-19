import { NextResponse } from 'next/server'
import {
  AUTH_COOKIE_NAME,
  configuredAuthEmail,
  createDatabaseSession,
  createSession,
  findDatabaseUser,
  verifyPassword,
  verifyPasswordHash,
} from '@/lib/auth'
import { isDatabaseConfigured } from '@/lib/db'

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

    if (!email || !password) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }

    let sessionToken: string

    if (isDatabaseConfigured()) {
      const user = await findDatabaseUser(email)

      if (!user || !(await verifyPasswordHash(password, user.passwordHash))) {
        return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
      }

      sessionToken = await createDatabaseSession(user)
    } else {
      if (email !== configuredAuthEmail() || !(await verifyPassword(password))) {
        return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
      }

      sessionToken = createSession(email)
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    return response
  } catch (error) {
    const diagnostic = safeAuthError(error)
    console.error('[auth/login] safe configuration diagnostic:', diagnostic)

    const message =
      process.env.VERCEL_ENV === 'production'
        ? 'Autenticação não configurada corretamente.'
        : `Autenticação não configurada corretamente. Diagnóstico: ${diagnostic}.`

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

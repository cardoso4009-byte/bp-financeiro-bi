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
  } catch {
    return NextResponse.json({ error: 'Autenticação não configurada corretamente.' }, { status: 500 })
  }
}

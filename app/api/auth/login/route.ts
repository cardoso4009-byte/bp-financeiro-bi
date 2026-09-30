import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, configuredAuthEmail, createSession, verifyPassword } from '@/lib/auth'

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
  } catch {
    return NextResponse.json({ error: 'Autenticação não configurada corretamente.' }, { status: 500 })
  }
}

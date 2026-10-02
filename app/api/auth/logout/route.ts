import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, revokeDatabaseSession } from '@/lib/auth'
import { isDatabaseConfigured } from '@/lib/db'

export async function POST(request: Request) {
  if (isDatabaseConfigured()) {
    const cookie = request.headers.get('cookie') ?? ''
    const token = cookie
      .split(';')
      .map(part => part.trim())
      .find(part => part.startsWith(AUTH_COOKIE_NAME + '='))
      ?.slice(AUTH_COOKIE_NAME.length + 1)

    try {
      await revokeDatabaseSession(token)
    } catch {
      // The browser cookie is still cleared even if database revocation fails.
    }
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}

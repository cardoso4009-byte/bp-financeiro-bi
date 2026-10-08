import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'bp_session'

function base64urlToBytes(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

async function verifySession(token: string | undefined) {
  if (!token) return false
  const secret = process.env.BP_AUTH_SESSION_SECRET
  if (!secret) return false

  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64urlToBytes(signature),
    new TextEncoder().encode(encoded),
  )
  if (!valid) return false

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(encoded))) as { exp?: number }
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

async function isDatabaseSessionActive(token: string) {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) return true

  try {
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(token),
    )
    const tokenHash = Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')

    const sql = neon(databaseUrl)
    const rows = await sql`select 1 as ok
      from sessions
      where token_hash = ${tokenHash}
        and revoked_at is null
        and expires_at > now()
      limit 1`

    return rows.length > 0
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  if (await verifySession(token) && (!process.env.DATABASE_URL || (token && await isDatabaseSessionActive(token)))) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-bp-pathname', pathname)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', pathname)
  const response = NextResponse.redirect(loginUrl)
  response.cookies.delete(COOKIE_NAME)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

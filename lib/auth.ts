import { createHmac, timingSafeEqual } from 'node:crypto'

export const AUTH_COOKIE_NAME = 'bp_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8

type SessionPayload = {
  email: string
  exp: number
}

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(name + ' is not configured')
  return value
}

function base64url(input: string | Uint8Array) {
  const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : Buffer.from(input)
  return buffer.toString('base64url')
}

function sign(value: string) {
  return createHmac('sha256', env('BP_AUTH_SESSION_SECRET')).update(value).digest('base64url')
}

export function createSession(email: string) {
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const encoded = base64url(JSON.stringify(payload))
  return encoded + '.' + sign(encoded)
}

export function verifySession(token?: string | null): SessionPayload | null {
  if (!token) return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expected = sign(encoded)
  const actualBuffer = new Uint8Array(Buffer.from(signature))
  const expectedBuffer = new Uint8Array(Buffer.from(expected))
  if (actualBuffer.length !== expectedBuffer.length) return null
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload
    if (!payload.email || payload.exp <= Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export async function verifyPassword(password: string) {
  const configured = env('BP_AUTH_PASSWORD_HASH')
  const [salt, iterationsText, expectedHex] = configured.split(':')
  const iterations = Number(iterationsText)

  if (!salt || !Number.isInteger(iterations) || iterations < 100_000 || !expectedHex) {
    throw new Error('BP_AUTH_PASSWORD_HASH has an invalid format')
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' },
    key,
    256,
  )
  const actualHex = Buffer.from(bits).toString('hex')
  return actualHex === expectedHex
}

export function configuredAuthEmail() {
  return env('BP_AUTH_EMAIL').trim().toLowerCase()
}

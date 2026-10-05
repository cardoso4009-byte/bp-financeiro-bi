import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { getDatabaseUrl } from '@/lib/db'

export const AUTH_COOKIE_NAME = 'bp_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8

type SessionPayload = {
  email: string
  userId?: string
  companyId?: string
  roleKey?: string
  nonce: string
  exp: number
}

export type DatabaseAuthUser = {
  id: string
  email: string
  name: string
  passwordHash: string
  roleKey: string
  companyId: string
  companyName: string
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

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function createSession(
  email: string,
  context?: Pick<DatabaseAuthUser, 'id' | 'companyId' | 'roleKey'>,
) {
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    userId: context?.id,
    companyId: context?.companyId,
    roleKey: context?.roleKey,
    nonce: randomBytes(16).toString('hex'),
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
    if (!payload.email || !payload.nonce || payload.exp <= Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export async function verifyPasswordHash(password: string, configured: string) {
  const [salt, iterationsText, expectedHex] = configured.split(':')
  const iterations = Number(iterationsText)

  if (
    !salt ||
    !Number.isInteger(iterations) ||
    iterations < 100_000 ||
    !expectedHex ||
    !/^[0-9a-f]{64}$/i.test(expectedHex)
  ) {
    throw new Error('password_hash has an invalid format')
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
  const actual = new Uint8Array(bits)
  const expected = new Uint8Array(Buffer.from(expectedHex, 'hex'))
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function verifyPassword(password: string) {
  return verifyPasswordHash(password, env('BP_AUTH_PASSWORD_HASH'))
}

export async function findDatabaseUser(email: string): Promise<DatabaseAuthUser | null> {
  const sql = neon(getDatabaseUrl())
  const rows = await sql`
    select
      u.id,
      u.email,
      u.name,
      u.password_hash as "passwordHash",
      cr.key as "roleKey",
      c.id as "companyId",
      c.name as "companyName"
    from users u
    join roles r on r.id = u.role_id
    join company_users cu on cu.user_id = u.id
    join roles cr on cr.id = cu.role_id
    join companies c on c.id = cu.company_id
    where lower(u.email) = lower(${email.trim()})
      and u.active = true
    order by c.created_at asc
    limit 1
  `

  return (rows[0] as DatabaseAuthUser | undefined) ?? null
}

export async function createDatabaseSession(user: DatabaseAuthUser) {
  const token = createSession(user.email, user)
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)

  const sql = neon(getDatabaseUrl())
  await sql`
    insert into sessions (user_id, token_hash, expires_at)
    values (${user.id}, ${hashSessionToken(token)}, ${expiresAt.toISOString()})
  `

  return token
}

export async function revokeDatabaseSession(token?: string | null) {
  if (!token) return

  const sql = neon(getDatabaseUrl())
  await sql`
    update sessions
    set revoked_at = now()
    where token_hash = ${hashSessionToken(token)}
      and revoked_at is null
  `
}

export function configuredAuthEmail() {
  return env('BP_AUTH_EMAIL').trim().toLowerCase()
}

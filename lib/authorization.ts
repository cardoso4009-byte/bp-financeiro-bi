import { createHash } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { AUTH_COOKIE_NAME, verifySession } from '@/lib/auth'
import { getDatabaseUrl } from '@/lib/db'

export type AuthorizationIdentity = {
  userId: string
  email: string
  name: string
  companyId: string
  companyName: string
  roleKey: string
  permissions: string[]
}

export class AuthorizationError extends Error {
  readonly status: 401 | 403

  constructor(status: 401 | 403, message: string) {
    super(message)
    this.name = 'AuthorizationError'
    this.status = status
  }
}

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function unauthorized() {
  return new AuthorizationError(401, 'Autenticação necessária')
}

function forbidden(permission: string) {
  return new AuthorizationError(403, 'Permissão insuficiente: ' + permission)
}

export async function getCurrentIdentity(request: Request): Promise<AuthorizationIdentity> {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const cookie = cookieHeader
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(AUTH_COOKIE_NAME + '='))
  const token = cookie?.slice(AUTH_COOKIE_NAME.length + 1)

  const session = verifySession(token)
  if (!session?.userId || !session.companyId) throw unauthorized()

  const sql = neon(getDatabaseUrl())
  const rows = await sql`
    select
      u.id as "userId",
      u.email,
      u.name,
      c.id as "companyId",
      c.name as "companyName",
      r.key as "roleKey",
      coalesce(
        array_agg(distinct p.key) filter (where p.key is not null),
        array[]::text[]
      ) as permissions
    from users u
    join company_users cu
      on cu.user_id = u.id
     and cu.company_id = ${session.companyId}
    join companies c on c.id = cu.company_id
    join roles r on r.id = cu.role_id
    left join role_permissions rp on rp.role_id = r.id
    left join permissions p on p.id = rp.permission_id
    join sessions s
      on s.user_id = u.id
     and s.token_hash = ${hashSessionToken(token ?? '')}
     and s.revoked_at is null
     and s.expires_at > now()
    where u.id = ${session.userId}
      and u.active = true
    group by u.id, u.email, u.name, c.id, c.name, r.key
    limit 1
  `

  const identity = rows[0] as AuthorizationIdentity | undefined
  if (!identity) throw unauthorized()

  return identity
}

export function hasPermission(
  identity: AuthorizationIdentity,
  permission: string,
) {
  return identity.permissions.includes(permission)
}

export async function requirePermission(
  request: Request,
  permission: string,
): Promise<AuthorizationIdentity> {
  const identity = await getCurrentIdentity(request)
  if (!hasPermission(identity, permission)) throw forbidden(permission)
  return identity
}

export function authorizationErrorResponse(error: unknown) {
  if (error instanceof AuthorizationError) {
    return Response.json(
      { ok: false, error: error.message },
      { status: error.status },
    )
  }

  return Response.json(
    { ok: false, error: 'Falha ao validar autorização' },
    { status: 500 },
  )
}

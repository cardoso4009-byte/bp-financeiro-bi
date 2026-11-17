import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { AUTH_COOKIE_NAME, verifySession } from '@/lib/auth'
import { getDatabaseUrl, isDatabaseConfigured } from '@/lib/db'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return jsonError('Banco de dados não configurado.', 503)
  }

  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return jsonError('Origem da requisição inválida.', 403)
  }

  const cookie = request.headers.get('cookie') ?? ''
  const token = cookie.split(';').map(part => part.trim())
    .find(part => part.startsWith(AUTH_COOKIE_NAME + '='))
    ?.slice(AUTH_COOKIE_NAME.length + 1)

  let session: ReturnType<typeof verifySession>
  try {
    session = verifySession(token)
  } catch {
    return jsonError('Sessão não pôde ser validada.', 401)
  }

  if (!session?.userId || !session.companyId || !token) {
    return jsonError('É necessário estar autenticado.', 401)
  }

  try {
    const databaseUrl = getDatabaseUrl()
    const parsedUrl = new URL(databaseUrl)
    const tokenHash = createHash('sha256').update(token, 'utf8').digest('hex')
    const sql = neon(databaseUrl)

    const rows = await sql`
      select current_database() as database
      from sessions s
      join users u on u.id = s.user_id and u.active = true
      join company_users cu on cu.user_id = u.id and cu.company_id = ${session.companyId}::uuid
      where s.token_hash = ${tokenHash}
        and s.user_id = ${session.userId}::uuid
        and s.revoked_at is null
        and s.expires_at > now()
      limit 1
    `

    if (!rows.length) return jsonError('Sessão não está ativa neste banco.', 403)

    return NextResponse.json(
      {
        ok: true,
        database: rows[0].database,
        host: parsedUrl.hostname,
        checkedAt: new Date().toISOString(),
        readOnly: true,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return jsonError('Não foi possível verificar a conexão com o banco.', 500)
  }
}

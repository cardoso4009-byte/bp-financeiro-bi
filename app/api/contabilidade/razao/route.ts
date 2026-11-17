import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { AUTH_COOKIE_NAME, verifySession } from '@/lib/auth'
import { getDatabaseUrl, isDatabaseConfigured } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return error('Banco de dados não configurado.', 503)

  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return error('Origem da requisição inválida.', 403)

  const cookie = request.headers.get('cookie') ?? ''
  const token = cookie.split(';').map(part => part.trim())
    .find(part => part.startsWith(AUTH_COOKIE_NAME + '='))?.slice(AUTH_COOKIE_NAME.length + 1)

  let session: ReturnType<typeof verifySession>
  try {
    session = verifySession(token)
  } catch {
    return error('Sessão não pôde ser validada.', 401)
  }
  if (!session?.userId || !session.companyId || !token) {
    return error('Sessão inválida ou sem vínculo com uma empresa.', 401)
  }

  try {
    const sql = neon(getDatabaseUrl())
    const tokenHash = createHash('sha256').update(token, 'utf8').digest('hex')

    const access = await sql`
      select cu.company_id as "companyId"
      from sessions s
      join users u on u.id = s.user_id and u.active = true
      join company_users cu on cu.user_id = u.id and cu.company_id = ${session.companyId}::uuid
      join role_permissions rp on rp.role_id = cu.role_id
      join permissions p on p.id = rp.permission_id and p.key = 'financial.read'
      where s.token_hash = ${tokenHash}
        and s.user_id = ${session.userId}::uuid
        and s.revoked_at is null
        and s.expires_at > now()
      limit 1
    `
    if (!access.length) return error('Usuário sem sessão ativa ou permissão de leitura financeira nesta empresa.', 403)

    const [rows, accountRows] = await Promise.all([
      sql`
        select
          je.id as "entryId",
          je.external_id as "externalId",
          je.entry_date::text as date,
          to_char(je.competence, 'YYYY-MM') as competence,
          je.description,
          je.document,
          je.cost_center as "costCenter",
          je.source,
          jl.line_number as "lineNumber",
          jl.account_code as "accountCode",
          jl.debit::text as debit,
          jl.credit::text as credit
        from journal_entries je
        join journal_lines jl on jl.entry_id = je.id
        where je.company_id = ${session.companyId}::uuid
        order by je.entry_date asc, je.created_at asc, je.id asc, jl.line_number asc
      `,
      sql`
        select
          code,
          name,
          account_class as class,
          nature,
          level,
          active,
          parent_code as "parentCode"
        from chart_of_accounts
        where company_id = ${session.companyId}::uuid
        order by code asc
      `,
    ])

    const entriesMap = new Map<string, {
      id: string; date: string; competence?: string; description: string;
      document?: string; costCenter?: string; source: string;
      lines: { account: string; debit: number; credit: number }[]
    }>()
    const accountsMap = new Map<string, {
      code: string; name: string; class: string; nature: string;
      level: number; active: boolean; parentCode?: string
    }>()

    for (const row of accountRows as Array<Record<string, unknown>>) {
      const code = String(row.code)
      accountsMap.set(code, {
        code,
        name: String(row.name),
        class: String(row.class),
        nature: String(row.nature),
        level: Number(row.level),
        active: Boolean(row.active),
        parentCode: row.parentCode ? String(row.parentCode) : undefined,
      })
    }

    for (const row of rows as Array<Record<string, unknown>>) {
      const entryId = String(row.entryId)
      let entry = entriesMap.get(entryId)
      if (!entry) {
        entry = {
          id: String(row.externalId || row.entryId),
          date: String(row.date),
          competence: row.competence ? String(row.competence) : undefined,
          description: String(row.description),
          document: row.document ? String(row.document) : undefined,
          costCenter: row.costCenter ? String(row.costCenter) : undefined,
          source: String(row.source),
          lines: [],
        }
        entriesMap.set(entryId, entry)
      }
      entry.lines.push({
        account: String(row.accountCode),
        debit: Number(row.debit ?? 0),
        credit: Number(row.credit ?? 0),
      })
    }

    return NextResponse.json({
      ok: true,
      entries: Array.from(entriesMap.values()),
      accounts: Array.from(accountsMap.values()),
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch {
    return error('Não foi possível consultar o Razão no banco de dados.', 500)
  }
}

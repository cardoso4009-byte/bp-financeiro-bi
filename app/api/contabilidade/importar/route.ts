import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { AUTH_COOKIE_NAME, verifySession } from '@/lib/auth'
import { getDatabaseUrl, isDatabaseConfigured } from '@/lib/db'

export const runtime = 'nodejs'

const ACCOUNT_CODES = new Set([
  '1', '1.1', '1.1.01', '1.1.02', '1.1.03', '1.2', '1.2.01',
  '2', '2.1', '2.1.01', '2.1.02', '2.2', '2.2.01',
  '3', '3.1', '3.2', '4', '4.1', '5', '5.1', '6', '6.1', '6.2', '6.3', '6.4',
])

type ImportLine = { account: string; debit: number; credit: number }
type ImportEntry = {
  id: string
  date: string
  competence?: string
  description: string
  document?: string
  costCenter?: string
  lines: ImportLine[]
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function parseCsv(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiters = [';', ',', '\t']
  const delimiter = delimiters
    .map(value => ({ value, count: firstLine.split(value).length - 1 }))
    .sort((a, b) => b.count - a.count)[0]?.value ?? ';'
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"'
        i++
      } else {
        quoted = !quoted
      }
    } else if (!quoted && char === delimiter) {
      row.push(cell.trim())
      cell = ''
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(cell.trim())
      if (row.some(value => value !== '')) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (quoted) throw new Error('CSV contém aspas não fechadas.')
  row.push(cell.trim())
  if (row.some(value => value !== '')) rows.push(row)
  if (rows.length < 2) throw new Error('CSV não contém linhas de lançamento.')

  const normalizeHeader = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[\s_-]+/g, '')
  const headers = rows[0].map(normalizeHeader)
  const aliases: Record<string, string[]> = {
    id: ['id', 'idLancamento', 'lancamentoid'],
    date: ['data', 'date'],
    description: ['historico', 'descricao', 'description'],
    account: ['conta', 'codigoConta', 'account'],
    debit: ['debito', 'debit'],
    credit: ['credito', 'credit'],
    competence: ['competencia', 'competence'],
    document: ['documento', 'document', 'nf'],
    costCenter: ['centrodecusto', 'centrocusto', 'costcenter'],
  }
  const positions: Record<string, number> = {}
  for (const [key, names] of Object.entries(aliases)) {
    const found = headers.findIndex(header => names.map(normalizeHeader).includes(header))
    if (found >= 0) positions[key] = found
  }
  for (const required of ['id', 'date', 'description', 'account', 'debit', 'credit']) {
    if (positions[required] === undefined) throw new Error(`Coluna obrigatória ausente: ${required}.`)
  }

  const get = (values: string[], key: string) => {
    const index = positions[key]
    return index === undefined ? '' : (values[index] ?? '').trim()
  }
  const parseMoney = (raw: string) => {
    const value = raw.replace(/\s/g, '').replace(/^R\$/i, '')
    if (!value) return 0
    let normalized = value
    if (value.includes(',') && value.includes('.')) {
      normalized = value.lastIndexOf(',') > value.lastIndexOf('.')
        ? value.replace(/\./g, '').replace(',', '.')
        : value.replace(/,/g, '')
    } else if (value.includes(',')) {
      normalized = value.replace(/\./g, '').replace(',', '.')
    }
    const amount = Number(normalized)
    if (!Number.isFinite(amount) || amount < 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.0001) {
      throw new Error(`Valor monetário inválido: ${raw}.`)
    }
    return Math.round(amount * 100) / 100
  }
  const parseDate = (raw: string) => {
    let value = raw
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/')
      value = `${year}-${month}-${day}`
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Data inválida: ${raw}.`)
    const date = new Date(`${value}T00:00:00.000Z`)
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new Error(`Data inválida: ${raw}.`)
    }
    return value
  }

  const entries = new Map<string, ImportEntry>()
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i]
    if (values.length !== headers.length) throw new Error(`Quantidade de colunas incorreta na linha ${i + 1}.`)
    const id = get(values, 'id')
    const date = parseDate(get(values, 'date'))
    const description = get(values, 'description')
    const account = get(values, 'account')
    if (!id || !description || !account) throw new Error(`ID, histórico e conta são obrigatórios na linha ${i + 1}.`)
    const competenceRaw = get(values, 'competence')
    const competence = competenceRaw
      ? (/^\d{4}-\d{2}$/.test(competenceRaw) ? competenceRaw : parseDate(competenceRaw))
      : undefined
    const document = get(values, 'document') || undefined
    const costCenter = get(values, 'costCenter') || undefined
    let entry = entries.get(id)
    if (!entry) {
      entry = { id, date, description, competence, document, costCenter, lines: [] }
      entries.set(id, entry)
    } else if (entry.date !== date || entry.description !== description ||
      entry.competence !== competence || entry.document !== document || entry.costCenter !== costCenter) {
      throw new Error(`As linhas do lançamento ${id} possuem dados de cabeçalho diferentes.`)
    }
    entry.lines.push({ account, debit: parseMoney(get(values, 'debit')), credit: parseMoney(get(values, 'credit')) })
  }
  return Array.from(entries.values())
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function validateEntries(entries: unknown): entries is ImportEntry[] {
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 500) return false
  const ids = new Set<string>()

  for (const raw of entries) {
    if (!raw || typeof raw !== 'object') return false
    const entry = raw as ImportEntry
    if (typeof entry.id !== 'string' || !entry.id.trim() || entry.id.length > 128) return false
    if (ids.has(entry.id.trim())) return false
    ids.add(entry.id.trim())
    if (typeof entry.description !== 'string' || !entry.description.trim() || entry.description.length > 500) return false
    if (typeof entry.date !== 'string' || !validDate(entry.date)) return false
    if (entry.competence !== undefined && entry.competence !== '') {
      if (typeof entry.competence !== 'string' ||
          !(/^\d{4}-\d{2}$/.test(entry.competence) || validDate(entry.competence))) return false
    }
    if (entry.document !== undefined && (typeof entry.document !== 'string' || entry.document.length > 255)) return false
    if (entry.costCenter !== undefined && (typeof entry.costCenter !== 'string' || entry.costCenter.length > 255)) return false
    if (!Array.isArray(entry.lines) || entry.lines.length < 2 || entry.lines.length > 1000) return false

    let debitCents = 0
    let creditCents = 0
    for (const line of entry.lines) {
      if (!line || typeof line.account !== 'string' || !ACCOUNT_CODES.has(line.account.trim())) return false
      if (!Number.isFinite(line.debit) || !Number.isFinite(line.credit) || line.debit < 0 || line.credit < 0) return false
      if (line.debit > 0 && line.credit > 0) return false
      if (line.debit === 0 && line.credit === 0) return false
      if (Math.abs(line.debit * 100 - Math.round(line.debit * 100)) > 0.0001 ||
          Math.abs(line.credit * 100 - Math.round(line.credit * 100)) > 0.0001) return false
      debitCents += Math.round(line.debit * 100)
      creditCents += Math.round(line.credit * 100)
    }
    if (debitCents !== creditCents) return false
  }
  return true
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return jsonError('Importação indisponível: banco de dados não configurado.', 503)
  }

  const requestOrigin = request.headers.get('origin')
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return jsonError('Origem da requisição inválida.', 403)
  }

  const cookie = request.headers.get('cookie') ?? ''
  const token = cookie.split(';').map(part => part.trim())
    .find(part => part.startsWith(AUTH_COOKIE_NAME + '='))?.slice(AUTH_COOKIE_NAME.length + 1)
  let session: ReturnType<typeof verifySession>
  try {
    session = verifySession(token)
  } catch {
    return jsonError('Sessão não pôde ser validada.', 401)
  }
  if (!session?.userId || !session.companyId) {
    return jsonError('Sessão inválida ou sem vínculo com uma empresa.', 401)
  }

  let body: { fileName?: unknown; fileContent?: unknown; idempotencyKey?: unknown }
  try {
    const rawBody = await request.text()
    if (rawBody.length > 2_500_000) return jsonError('Arquivo de importação excede o limite permitido.', 413)
    body = JSON.parse(rawBody)
  } catch {
    return jsonError('Corpo da requisição inválido.', 400)
  }

  if (typeof body.fileName !== 'string' || !body.fileName.trim() ||
      body.fileName.length > 255 || /[/\\]/.test(body.fileName)) {
    return jsonError('Nome de arquivo inválido.', 400)
  }
  if (!body.fileName.toLowerCase().endsWith('.csv')) {
    return jsonError('Nesta etapa, somente arquivos CSV são aceitos.', 415)
  }
  if (typeof body.fileContent !== 'string' || !body.fileContent.length || body.fileContent.length > 2_000_000) {
    return jsonError('Conteúdo original do CSV é obrigatório e deve ter até 2 MB.', 400)
  }
  if (typeof body.idempotencyKey !== 'string' ||
      body.idempotencyKey.length < 8 || body.idempotencyKey.length > 128) {
    return jsonError('Chave de idempotência inválida.', 400)
  }

  let entries: ImportEntry[]
  try {
    entries = parseCsv(body.fileContent)
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'CSV inválido.', 422)
  }
  if (!validateEntries(entries)) {
    return jsonError('Lançamentos inválidos. Confira datas, contas, valores e partidas balanceadas.', 422)
  }

  const fileSha256 = createHash('sha256').update(body.fileContent, 'utf8').digest('hex')
  const tokenHash = createHash('sha256').update(token!, 'utf8').digest('hex')

  try {
    const sql = neon(getDatabaseUrl())
    const access = await sql`
      select u.id as "userId", cu.company_id as "companyId"
      from sessions s
      join users u on u.id = s.user_id and u.active = true
      join company_users cu on cu.user_id = u.id and cu.company_id = ${session.companyId}::uuid
      join role_permissions rp on rp.role_id = cu.role_id
      join permissions p on p.id = rp.permission_id and p.key = 'financial.write'
      where s.token_hash = ${tokenHash}
        and s.user_id = ${session.userId}::uuid
        and s.revoked_at is null
        and s.expires_at > now()
      limit 1
    `
    if (!access.length) return jsonError('Usuário sem sessão ativa ou permissão para importar nesta empresa.', 403)

    const rows = await sql`
      select import_journal_batch(
        ${session.companyId}::uuid,
        ${session.userId}::uuid,
        ${body.fileName},
        ${fileSha256},
        ${body.idempotencyKey},
        ${JSON.stringify(entries)}::jsonb
      ) as result
    `
    return NextResponse.json({ ok: true, result: rows[0]?.result }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('uq_journal_entries_company_external_id') ||
        message.includes('duplicate key value')) {
      return jsonError('Importação rejeitada: um ou mais IDs de lançamento já existem para esta empresa.', 409)
    }
    if (message.includes('balanceado') || message.includes('inválid') ||
        message.includes('obrigatório') || message.includes('duplicidade') ||
        message.includes('Quantidade') || message.includes('Valores negativos') ||
        message.includes('partida precisa') || message.includes('idempotência')) {
      return jsonError(message, 422)
    }
    return jsonError('Não foi possível concluir a importação. Nenhum dado foi confirmado; verifique a migração e tente novamente.', 500)
  }
}

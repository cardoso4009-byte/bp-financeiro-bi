import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const ok = await checkDatabaseConnection()
    if (!ok) {
      return NextResponse.json({ ok: false, database: 'unhealthy' }, { status: 503 })
    }

    return NextResponse.json({ ok: true, database: 'healthy' })
  } catch {
    return NextResponse.json({ ok: false, database: 'unavailable' }, { status: 503 })
  }
}

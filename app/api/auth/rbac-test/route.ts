import { NextResponse } from 'next/server'
import { getCurrentUserPermissions } from '@/lib/permissions'

export async function GET() {
  const permissions = await getCurrentUserPermissions()
  return NextResponse.json({
    authenticated: permissions.size > 0,
    permissions: Array.from(permissions).sort(),
  })
}

import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME, verifySession } from '@/lib/auth'

export async function getCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  return verifySession(token)
}

const DATABASE_URL_ERROR = 'DATABASE_URL is not configured'

export function getDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim()
  if (!value) throw new Error(DATABASE_URL_ERROR)

  const url = new URL(value)
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use the postgres:// or postgresql:// protocol')
  }

  return value
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim())
}

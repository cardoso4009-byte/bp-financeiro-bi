import crypto from 'node:crypto'

const password = process.argv[2]

if (!password) {
  console.error('Uso: npm run auth:hash -- "SUA_SENHA"')
  process.exit(1)
}

const salt = crypto.randomBytes(16).toString('hex')
const iterations = 210_000
const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex')

console.log(`BP_AUTH_PASSWORD_HASH=${salt}:${iterations}:${hash}`)

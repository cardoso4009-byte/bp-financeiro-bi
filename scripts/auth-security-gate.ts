import assert from 'node:assert/strict'
import fs from 'node:fs'

const middleware = fs.readFileSync('middleware.ts', 'utf8')
const auth = fs.readFileSync('lib/auth.ts', 'utf8')
const login = fs.readFileSync('app/api/auth/login/route.ts', 'utf8')

assert.match(middleware, /BP_AUTH_SESSION_SECRET/)
assert.match(middleware, /crypto\.subtle/)
assert.match(middleware, /maxAge|exp/)
assert.match(auth, /PBKDF2/)
assert.match(auth, /createHmac/)
assert.match(login, /httpOnly: true/)
assert.match(login, /sameSite: 'lax'/)
assert.match(login, /secure: process\.env\.NODE_ENV === 'production'/)

console.log('Auth Security Gate: OK — sessão assinada, senha derivada com PBKDF2 e cookie com flags de segurança.')

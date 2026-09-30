import assert from 'node:assert/strict'
import fs from 'node:fs'

const schema = fs.readFileSync('db/schema.sql', 'utf8')

for (const table of ['companies', 'users', 'company_users', 'sessions', 'audit_log']) {
  assert.match(schema, new RegExp('create table if not exists ' + table))
}

assert.match(schema, /password_hash/)
assert.match(schema, /token_hash/)
assert.match(schema, /expires_at/)
assert.match(schema, /audit_log/)
assert.match(schema, /company_id/)

console.log('Database Foundation Gate: OK — identidade, escopo por empresa, sessões e auditoria definidos.')

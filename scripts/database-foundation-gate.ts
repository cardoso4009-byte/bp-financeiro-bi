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
assert.match(schema, /create table if not exists roles/)
assert.match(schema, /create table if not exists permissions/)
assert.match(schema, /create table if not exists role_permissions/)
for (const permission of ['dashboard.view', 'financial.read', 'financial.write', 'forecast.manage', 'company.manage', 'audit.read']) {
  assert.match(fs.readFileSync('db/migrations/002-rbac-seed.sql', 'utf8'), new RegExp(permission.replace('.', '\\.'), 'g'))
}

console.log('Database Foundation Gate: OK — identidade, escopo por empresa, sessões e auditoria definidos.')

import assert from 'node:assert/strict'
import fs from 'node:fs'

const db = fs.readFileSync('lib/db.ts', 'utf8')
const readme = fs.readFileSync('db/README.md', 'utf8')

assert.match(db, /DATABASE_URL/)
assert.match(db, /postgres:/)
assert.match(db, /postgresql:/)
assert.match(readme, /DATABASE_URL/)
assert.match(readme, /PostgreSQL/)

console.log('Database Config Gate: OK — contrato PostgreSQL e DATABASE_URL validados.')

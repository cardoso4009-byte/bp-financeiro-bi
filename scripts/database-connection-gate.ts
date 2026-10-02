import assert from 'node:assert/strict'
import fs from 'node:fs'

const db = fs.readFileSync('lib/db.ts', 'utf8')
const route = fs.readFileSync('app/api/health/db/route.ts', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

assert.equal(pkg.dependencies['@neondatabase/serverless'], '1.1.0')
assert.match(db, /@neondatabase\/serverless/)
assert.match(db, /DATABASE_URL/)
assert.match(db, /select 1 as ok/)
assert.match(route, /checkDatabaseConnection/)
assert.match(route, /status: 503/)

console.log('Database Connection Gate: OK — driver Neon, DATABASE_URL e health check validados.')

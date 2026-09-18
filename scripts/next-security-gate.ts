import assert from 'node:assert/strict'
import fs from 'node:fs'

const pkg=JSON.parse(fs.readFileSync('package.json','utf8')) as {dependencies?:Record<string,string>}
const nextVersion=pkg.dependencies?.next
assert.ok(nextVersion,'Next.js dependency must be declared')

const match=nextVersion.match(/^(\d+)\.(\d+)\.(\d+)$/)
assert.ok(match,'Next.js version must be pinned, received: '+nextVersion)
const [,major,minor,patch]=match.map(Number)

// Security floor for the August 2026 Next.js release.
// Maintenance LTS: 15.5.24 or newer.
const safe = major > 15 || (major === 15 && (minor > 5 || (minor === 5 && patch >= 24)))
assert.equal(safe,true,'Next.js '+nextVersion+' is below the documented security floor 15.5.24')
console.log('Next.js Security Gate: OK — '+nextVersion+' atende ao piso 15.5.24.')

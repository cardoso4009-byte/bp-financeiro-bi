import assert from 'node:assert/strict'
import fs from 'node:fs'

type PackageJson = {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const packageJsonPath = 'package.json'
const lockfilePath = 'package-lock.json'

assert.ok(fs.existsSync(packageJsonPath), 'package.json must exist')
assert.ok(fs.existsSync(lockfilePath), 'package-lock.json must exist')

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageJson
const lock = JSON.parse(fs.readFileSync(lockfilePath, 'utf8')) as {
  name?: string
  version?: string
  lockfileVersion?: number
  packages?: Record<string, PackageJson>
}

assert.equal(lock.lockfileVersion, 3, 'package-lock.json must use lockfileVersion 3')
assert.ok(lock.packages?.[''], 'package-lock.json must contain the root package entry')

const root = lock.packages['']

assert.equal(lock.name, pkg.name, 'package-lock name must match package.json')
assert.equal(lock.version, pkg.version, 'package-lock version must match package.json')
assert.equal(root.name, pkg.name, 'lockfile root name must match package.json')
assert.equal(root.version, pkg.version, 'lockfile root version must match package.json')

for (const [section, expected] of [
  ['dependencies', pkg.dependencies ?? {}],
  ['devDependencies', pkg.devDependencies ?? {}],
] as const) {
  const locked = root[section] ?? {}
  assert.deepEqual(locked, expected, `package-lock root ${section} must match package.json`)
}

console.log('Dependency Lockfile Gate: OK — package-lock.json presente, lockfileVersion 3 e root sincronizado com package.json.')

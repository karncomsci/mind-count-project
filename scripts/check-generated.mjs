import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const roots = ['apps/api/internal/db/gen', 'apps/api/internal/transport/http/openapi', 'apps/web/app/lib/api/generated']
function snapshot() {
  const files = {}
  for (const root of roots) {
    for (const name of readdirSync(root).sort()) {
      const path = join(root, name)
      files[path] = readFileSync(path, 'utf8')
    }
  }
  return JSON.stringify(files)
}
const before = snapshot()
const result = spawnSync('make', ['generate'], { stdio: 'inherit' })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
if (before !== snapshot()) {
  console.error('Generated code changed. Review and commit make generate output.')
  process.exit(1)
}
console.log('Generated Go, sqlc and TypeScript files match their sources.')

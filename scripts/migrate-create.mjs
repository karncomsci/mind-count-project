import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const name = process.argv[2]
if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) {
  console.error('Usage: make migrate-create name=create_users (lowercase snake_case)')
  process.exit(1)
}
const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
const directory = resolve('apps/api/internal/db/migrations')
mkdirSync(directory, { recursive: true })
const path = resolve(directory, `${timestamp}_${name}.sql`)
writeFileSync(path, '-- +goose Up\n-- Replace this statement with the forward migration before review.\nSELECT 1;\n\n-- +goose Down\n-- Replace this statement with its rollback before review.\nSELECT 1;\n', { flag: 'wx' })
console.log(path)

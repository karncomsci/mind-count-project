import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

// Export only source directories and an explicit root allowlist, never .env or runtime data.
const rootFiles = ['.dockerignore', '.editorconfig', '.env.example', '.gitignore', 'CONTRIBUTING.md', 'Makefile', 'README.md', 'compose.yaml', 'package.json', 'playwright.config.ts', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']
const directories = ['.github', 'apps', 'contracts', 'deployments', 'docs', 'scripts', 'tests']
const ignored = new Set(['node_modules', '.nuxt', '.output', 'coverage', 'test-results', 'playwright-report'])
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name) || entry.isSymbolicLink()) return []
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}
const files = [...rootFiles, ...directories.flatMap(walk)].sort()
const languages = { '.go': 'go', '.ts': 'typescript', '.mjs': 'javascript', '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml', '.md': 'markdown', '.vue': 'vue', '.sql': 'sql', '.css': 'css' }
const sections = files.map((path) => {
  const content = readFileSync(path, 'utf8')
  const fence = '`'.repeat(Math.max(4, ...[...content.matchAll(/`+/g)].map(match => match[0].length + 1)))
  return `## ${resolve(path)}\n\n${fence}${languages[extname(path)] ?? 'text'}\n${content}${content.endsWith('\n') ? '' : '\n'}${fence}\n`
})
mkdirSync('_wrx-output', { recursive: true })
const target = resolve('_wrx-output/phase-0-full-source.md')
writeFileSync(target, `# PHASE 0 — Full source listing\n\n${files.length} files. Every section contains the absolute path and full file content. Generated code is included unchanged. Runtime tools, secrets, build outputs and the original user instruction are excluded.\n\n${sections.join('\n')}`)
writeFileSync('_wrx-output/evidence/source-manifest.json', JSON.stringify(files.map(path => resolve(path)), null, 2) + '\n')
console.log(`${files.length} files exported to ${target}`)

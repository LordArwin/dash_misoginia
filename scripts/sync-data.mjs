// Copia a planilha oficial (raiz do projeto) para public/data e gera um manifesto
// com metadados de importação. A planilha da raiz é a única fonte de verdade.
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const SOURCE = 'Base Questionarios.xlsx'
const root = resolve(import.meta.dirname, '..')
const src = resolve(root, SOURCE)
const outDir = resolve(root, 'public', 'data')

if (!existsSync(src)) {
  console.error(`[sync-data] Arquivo não encontrado: ${src}`)
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })
copyFileSync(src, resolve(outDir, SOURCE))

let committedAt = null
try {
  committedAt = execSync(`git log -1 --format=%cI -- "${SOURCE}"`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString().trim() || null
} catch { /* não é um repositório git */ }

const buf = readFileSync(src)
const manifest = {
  fileName: SOURCE,
  sizeBytes: buf.length,
  sha256: createHash('sha256').update(buf).digest('hex'),
  fileModifiedAt: statSync(src).mtime.toISOString(),
  committedAt,
  syncedAt: new Date().toISOString(),
}
writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`[sync-data] ${SOURCE} copiado para public/data (${buf.length} bytes)`)

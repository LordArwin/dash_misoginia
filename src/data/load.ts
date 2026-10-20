/** Leitura do arquivo Excel com SheetJS (no navegador ou no Node, para testes). */
import { read, utils } from 'xlsx'
import { normalizeSheet, matchKey, type Dataset, type RawSheet } from './normalize'

export const DATA_FILE = 'Base Questionarios.xlsx'

export interface Manifest {
  fileName: string
  sizeBytes: number
  sha256: string
  fileModifiedAt: string | null
  committedAt: string | null
  syncedAt: string
}

export function readWorkbook(data: ArrayBuffer | Uint8Array, fileName: string): RawSheet {
  const wb = read(data, { type: 'array', cellDates: true, dense: true })
  if (wb.SheetNames.length === 0) throw new Error('O arquivo não contém abas.')
  // Usa a primeira aba cujo cabeçalho contenha "IDADE"; caso contrário, a primeira aba.
  const sheetName =
    wb.SheetNames.find((n) => {
      const first = utils.sheet_to_json<unknown[]>(wb.Sheets[n], { header: 1, defval: null, blankrows: false })[0] ?? []
      return first.some((h) => matchKey(h) === 'idade')
    }) ?? wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const matrix = utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null, blankrows: true, raw: true })
  if (matrix.length === 0) throw new Error(`A aba "${sheetName}" está vazia.`)
  const width = Math.max(...matrix.map((r) => r.length))
  const pad = (r: unknown[]) => Array.from({ length: width }, (_, i) => (r[i] === undefined ? null : r[i]))
  const [headerRow, ...rows] = matrix.map(pad)
  return {
    fileName,
    sheetName,
    sheetNames: wb.SheetNames,
    range: ws['!ref'] ?? '',
    headers: headerRow.map((h) => (h === null ? '' : String(h))),
    rows,
  }
}

export function parseDataset(data: ArrayBuffer | Uint8Array, fileName: string): Dataset {
  return normalizeSheet(readWorkbook(data, fileName))
}

/** Busca a planilha publicada em /data (copiada da raiz do projeto no build). */
export async function fetchDataset(baseUrl: string): Promise<{ dataset: Dataset; manifest: Manifest | null; lastModified: string | null }> {
  const url = `${baseUrl}data/${encodeURIComponent(DATA_FILE)}`
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Não foi possível carregar a planilha (${res.status} ${res.statusText}).`)
  const buf = await res.arrayBuffer()
  const dataset = parseDataset(buf, DATA_FILE)
  let manifest: Manifest | null = null
  try {
    const m = await fetch(`${baseUrl}data/manifest.json`, { cache: 'no-cache' })
    if (m.ok) manifest = (await m.json()) as Manifest
  } catch {
    manifest = null
  }
  return { dataset, manifest, lastModified: res.headers.get('last-modified') }
}

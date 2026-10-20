/** Exportação CSV compatível com Excel em português (separador ";" e BOM UTF-8). */
export type CsvValue = string | number | null | undefined

function cell(v: CsvValue): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',')) : v
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: CsvValue[][]): string {
  return '\uFEFF' + rows.map((r) => r.map(cell).join(';')).join('\r\n')
}

export function downloadCsv(fileName: string, rows: CsvValue[][]): void {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function slug(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

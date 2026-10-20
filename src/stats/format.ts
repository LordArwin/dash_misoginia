const pctFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const intFmt = new Intl.NumberFormat('pt-BR')
const ppFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' })

/** Percentual com uma casa decimal, no padrão brasileiro (ex.: "42,9%"). */
export const formatPct = (v: number): string => `${pctFmt.format(v)}%`
export const formatInt = (v: number): string => intFmt.format(v)
/** Diferença em pontos percentuais (ex.: "+12,5 p.p."). */
export const formatPP = (v: number): string => `${ppFmt.format(v)} p.p.`
export const formatCountPct = (count: number, pctValue: number): string => `${formatInt(count)} (${formatPct(pctValue)})`

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
}

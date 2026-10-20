/**
 * Camada de normalização: converte a planilha bruta (sem alterações) em uma
 * estrutura de participantes com respostas canônicas, e gera o relatório de
 * qualidade. Nenhum componente visual deve ler a planilha diretamente.
 */
import { QUESTIONS, type AlternativeDef, type QuestionDef, type QuestionId } from './schema'

export interface RawSheet {
  fileName: string
  sheetName: string
  sheetNames: string[]
  range: string
  headers: string[]
  /** Linhas de dados (sem o cabeçalho), exatamente como lidas pelo SheetJS. */
  rows: unknown[][]
}

export interface ResolvedAlternative extends AlternativeDef {
  /** false quando o valor não consta do catálogo (alternativa inesperada). */
  expected: boolean
}

export interface ResolvedQuestion extends Omit<QuestionDef, 'alternatives'> {
  colIndex: number | null
  columnLetter: string | null
  headerFound: string | null
  matchedBy: 'cabeçalho' | 'posição' | 'não encontrada'
  alternatives: ResolvedAlternative[]
}

export interface Participant {
  /** Identificador sequencial gerado na importação (P01, P02…), sem dado pessoal. */
  id: string
  /** Número da linha correspondente na planilha. */
  excelRow: number
  /** Resposta canônica por pergunta; `null` = resposta ausente. */
  answers: Record<QuestionId, string | null>
}

export type Severity = 'erro' | 'aviso' | 'info'

export interface QualityIssue {
  severity: Severity
  kind: 'coluna' | 'ausente' | 'inesperada' | 'duplicado' | 'espaços' | 'constante' | 'linha vazia' | 'coluna extra'
  column?: string
  questionId?: QuestionId
  message: string
  count?: number
}

export interface ColumnVariants {
  questionId: QuestionId
  /** Para cada alternativa canônica, as grafias brutas encontradas. */
  variants: { label: string; raw: { text: string; count: number }[] }[]
}

export interface Dataset {
  participants: Participant[]
  questions: ResolvedQuestion[]
  issues: QualityIssue[]
  variants: ColumnVariants[]
  source: {
    fileName: string
    sheetName: string
    sheetNames: string[]
    range: string
    headerRow: number
    dataRows: number
    emptyRowsSkipped: number
    columns: number
  }
}

/** Remove espaços excedentes (início, fim e repetidos) e unifica a codificação Unicode. */
export function cleanText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).normalize('NFC').replace(/[\s ]+/g, ' ').trim()
}

/** Chave de comparação: texto limpo, minúsculo, sem ponto final. */
export function matchKey(value: unknown): string {
  return cleanText(value).toLocaleLowerCase('pt-BR').replace(/[.;:]+$/, '').trim()
}

export function isMissing(value: unknown): boolean {
  return cleanText(value) === ''
}

export function columnLetter(index: number): string {
  let s = ''
  let n = index + 1
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export function letterToIndex(letter: string): number {
  return letter.split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1
}

function resolveColumn(q: QuestionDef, headers: string[]): Pick<ResolvedQuestion, 'colIndex' | 'columnLetter' | 'headerFound' | 'matchedBy'> {
  const target = matchKey(q.header)
  const byHeader = headers.findIndex((h) => matchKey(h) === target)
  if (byHeader >= 0) {
    return { colIndex: byHeader, columnLetter: columnLetter(byHeader), headerFound: headers[byHeader], matchedBy: 'cabeçalho' }
  }
  const byPos = letterToIndex(q.column)
  if (byPos < headers.length && headers[byPos] !== undefined && cleanText(headers[byPos]) !== '') {
    return { colIndex: byPos, columnLetter: q.column, headerFound: headers[byPos], matchedBy: 'posição' }
  }
  return { colIndex: null, columnLetter: null, headerFound: null, matchedBy: 'não encontrada' }
}

export function normalizeSheet(sheet: RawSheet): Dataset {
  const issues: QualityIssue[] = []
  const headers = sheet.headers.map((h) => cleanText(h))

  const resolved: ResolvedQuestion[] = QUESTIONS.map((q) => {
    const col = resolveColumn(q, headers)
    if (col.matchedBy === 'não encontrada') {
      issues.push({ severity: 'erro', kind: 'coluna', questionId: q.id, message: `Coluna esperada não encontrada: "${q.header}" (coluna ${q.column}). A pergunta não será analisada.` })
    } else if (col.matchedBy === 'posição') {
      issues.push({ severity: 'aviso', kind: 'coluna', column: col.columnLetter!, questionId: q.id, message: `Cabeçalho da coluna ${col.columnLetter} difere do esperado ("${col.headerFound}"); associada a "${q.short}" pela posição.` })
    }
    return { ...q, ...col, alternatives: q.alternatives.map((a) => ({ ...a, expected: true })) }
  })

  // Colunas da planilha não previstas no catálogo
  const used = new Set(resolved.map((q) => q.colIndex).filter((i): i is number => i !== null))
  headers.forEach((h, i) => {
    if (used.has(i)) return
    const hasData = sheet.rows.some((r) => !isMissing(r[i]))
    if (h !== '' || hasData) {
      issues.push({ severity: 'info', kind: 'coluna extra', column: columnLetter(i), message: `Coluna ${columnLetter(i)} ("${h || 'sem cabeçalho'}") não faz parte do catálogo e foi ignorada.` })
    }
  })

  // Linhas: ignorar apenas as completamente vazias
  let emptyRowsSkipped = 0
  const dataRows: { row: unknown[]; excelRow: number }[] = []
  sheet.rows.forEach((row, i) => {
    if (row.every((v) => isMissing(v))) emptyRowsSkipped++
    else dataRows.push({ row, excelRow: i + 2 })
  })
  if (emptyRowsSkipped > 0) {
    issues.push({ severity: 'info', kind: 'linha vazia', message: `${emptyRowsSkipped} linha(s) totalmente vazia(s) ignorada(s).`, count: emptyRowsSkipped })
  }

  const variantMap = new Map<QuestionId, Map<string, Map<string, number>>>()
  const pad = String(dataRows.length).length < 2 ? 2 : String(dataRows.length).length

  const participants: Participant[] = dataRows.map(({ row, excelRow }, i) => {
    const answers = {} as Record<QuestionId, string | null>
    for (const q of resolved) {
      if (q.colIndex === null) { answers[q.id] = null; continue }
      const raw = row[q.colIndex]
      if (isMissing(raw)) { answers[q.id] = null; continue }
      const key = matchKey(raw)
      let alt = q.alternatives.find((a) => matchKey(a.label) === key)
      if (!alt) {
        alt = { label: cleanText(raw), group: '__inesperada', expected: false }
        q.alternatives.push(alt)
      }
      answers[q.id] = alt.label
      const byAlt = variantMap.get(q.id) ?? new Map<string, Map<string, number>>()
      const rawCounts = byAlt.get(alt.label) ?? new Map<string, number>()
      const rawText = String(raw)
      rawCounts.set(rawText, (rawCounts.get(rawText) ?? 0) + 1)
      byAlt.set(alt.label, rawCounts)
      variantMap.set(q.id, byAlt)
    }
    return { id: `P${String(i + 1).padStart(pad, '0')}`, excelRow, answers }
  })

  // Alertas por pergunta
  for (const q of resolved) {
    if (q.colIndex === null) continue
    const missing = participants.filter((p) => p.answers[q.id] === null).length
    if (missing > 0) {
      issues.push({ severity: 'aviso', kind: 'ausente', column: q.columnLetter!, questionId: q.id, count: missing, message: `${missing} resposta(s) ausente(s) em "${q.short}".` })
    }
    for (const a of q.alternatives.filter((x) => !x.expected)) {
      const count = participants.filter((p) => p.answers[q.id] === a.label).length
      issues.push({ severity: 'aviso', kind: 'inesperada', column: q.columnLetter!, questionId: q.id, count, message: `Alternativa não prevista no catálogo em "${q.short}": "${a.label}". Mantida como categoria própria.` })
    }
    const distinct = new Set(participants.map((p) => p.answers[q.id]).filter(Boolean))
    if (participants.length > 1 && distinct.size === 1) {
      issues.push({ severity: 'info', kind: 'constante', column: q.columnLetter!, questionId: q.id, message: `"${q.short}" tem um único valor em todos os registros ("${[...distinct][0]}"); não é usado como filtro.` })
    }
    const byAlt = variantMap.get(q.id)
    if (byAlt) {
      const multi = [...byAlt.entries()].filter(([, m]) => m.size > 1 || [...m.keys()].some((k) => k !== cleanText(k)))
      if (multi.length > 0) {
        const total = multi.reduce((s, [, m]) => s + [...m.values()].reduce((a, b) => a + b, 0), 0)
        issues.push({ severity: 'info', kind: 'espaços', column: q.columnLetter!, questionId: q.id, count: total, message: `${multi.length} alternativa(s) com espaços excedentes ou grafias divergentes em "${q.short}"; unificadas pela normalização.` })
      }
    }
  }

  // Registros com respostas idênticas em todas as colunas analisadas
  const signatures = new Map<string, string[]>()
  for (const p of participants) {
    const sig = resolved.map((q) => p.answers[q.id] ?? '∅').join('|')
    signatures.set(sig, [...(signatures.get(sig) ?? []), p.id])
  }
  for (const ids of signatures.values()) {
    if (ids.length > 1) {
      issues.push({ severity: 'aviso', kind: 'duplicado', count: ids.length, message: `Registros com respostas idênticas em todas as colunas: ${ids.join(', ')}. Mantidos (podem ser participantes distintos).` })
    }
  }

  const variants: ColumnVariants[] = resolved.map((q) => ({
    questionId: q.id,
    variants: [...(variantMap.get(q.id) ?? new Map()).entries()].map(([label, m]) => ({
      label,
      raw: [...m.entries()].map(([text, count]) => ({ text, count })),
    })),
  }))

  return {
    participants,
    questions: resolved,
    issues,
    variants,
    source: {
      fileName: sheet.fileName,
      sheetName: sheet.sheetName,
      sheetNames: sheet.sheetNames,
      range: sheet.range,
      headerRow: 1,
      dataRows: participants.length,
      emptyRowsSkipped,
      columns: headers.length,
    },
  }
}

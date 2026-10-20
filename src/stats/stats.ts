/**
 * Funções estatísticas reutilizáveis. Regras:
 *  - Denominador = respostas válidas (não ausentes) da pergunta no universo filtrado.
 *  - Ausências não entram no denominador, mas são sempre informadas.
 *  - Nenhuma categoria (ex.: "Não sei responder") é excluída.
 *  - Não há pontuação composta nem pesos atribuídos às alternativas.
 */
import type { Participant, ResolvedQuestion } from '../data/normalize'
import type { QuestionId } from '../data/schema'

export const UNEXPECTED_GROUP = '__inesperada'

export interface FrequencyRow {
  label: string
  group: string
  groupLabel: string
  uncertain: boolean
  expected: boolean
  /** Posição da alternativa na ordem lógica (para cores ordinais). */
  order: number
  count: number
  /** Percentual sobre as respostas válidas (0–100). */
  pct: number
}

export interface Frequency {
  questionId: QuestionId
  /** Participantes no universo considerado. */
  participants: number
  valid: number
  missing: number
  rows: FrequencyRow[]
}

export interface GroupShare {
  groupId: string
  label: string
  uncertain: boolean
  count: number
  pct: number
  alternatives: string[]
}

export const pct = (part: number, whole: number): number => (whole > 0 ? (part / whole) * 100 : 0)

export function distinctParticipants(ps: Participant[]): number {
  return new Set(ps.map((p) => p.id)).size
}

export function validCount(ps: Participant[], qid: QuestionId): number {
  return ps.filter((p) => p.answers[qid] !== null).length
}

export function missingCount(ps: Participant[], qid: QuestionId): number {
  return ps.filter((p) => p.answers[qid] === null).length
}

function groupMeta(q: ResolvedQuestion, groupId: string) {
  if (groupId === UNEXPECTED_GROUP) return { label: 'Alternativa não prevista', uncertain: false }
  const g = q.groups.find((x) => x.id === groupId)
  return { label: g?.label ?? groupId, uncertain: Boolean(g?.uncertain) }
}

export function frequency(ps: Participant[], q: ResolvedQuestion): Frequency {
  const valid = validCount(ps, q.id)
  const rows = q.alternatives.map((a, i): FrequencyRow => {
    const count = ps.filter((p) => p.answers[q.id] === a.label).length
    const meta = groupMeta(q, a.group)
    return {
      label: a.label,
      group: a.group,
      groupLabel: meta.label,
      uncertain: meta.uncertain,
      expected: a.expected,
      order: i,
      count,
      pct: pct(count, valid),
    }
  })
  return { questionId: q.id, participants: ps.length, valid, missing: ps.length - valid, rows }
}

/** Soma de alternativas pertencentes a um grupo documentado no catálogo. */
export function groupShares(ps: Participant[], q: ResolvedQuestion): GroupShare[] {
  const f = frequency(ps, q)
  const ids = [...new Set(q.alternatives.map((a) => a.group))]
  return ids.map((gid) => {
    const rows = f.rows.filter((r) => r.group === gid)
    const count = rows.reduce((s, r) => s + r.count, 0)
    const meta = groupMeta(q, gid)
    return { groupId: gid, label: meta.label, uncertain: meta.uncertain, count, pct: pct(count, f.valid), alternatives: rows.map((r) => r.label) }
  })
}

export interface Share {
  count: number
  valid: number
  missing: number
  pct: number
}

/** Percentual de respostas válidas que estão em um conjunto de alternativas. */
export function shareOf(ps: Participant[], qid: QuestionId, labels: string[]): Share {
  const set = new Set(labels)
  const valid = validCount(ps, qid)
  const count = ps.filter((p) => p.answers[qid] !== null && set.has(p.answers[qid]!)).length
  return { count, valid, missing: ps.length - valid, pct: pct(count, valid) }
}

export function shareOfGroup(ps: Participant[], q: ResolvedQuestion, groupId: string): Share {
  return shareOf(ps, q.id, q.alternatives.filter((a) => a.group === groupId).map((a) => a.label))
}

export type CrossMode = 'count' | 'row' | 'col' | 'total'

export interface Crosstab {
  rowQ: QuestionId
  colQ: QuestionId
  rowLabels: string[]
  colLabels: string[]
  counts: number[][]
  rowTotals: number[]
  colTotals: number[]
  /** Participantes com resposta válida nas duas perguntas (denominador do % do total). */
  n: number
  /** Participantes excluídos por ausência em pelo menos uma das perguntas. */
  excluded: number
}

export function crosstab(ps: Participant[], rowQ: ResolvedQuestion, colQ: ResolvedQuestion): Crosstab {
  const rowLabels = rowQ.alternatives.map((a) => a.label)
  const colLabels = colQ.alternatives.map((a) => a.label)
  const counts = rowLabels.map(() => colLabels.map(() => 0))
  let n = 0
  for (const p of ps) {
    const r = p.answers[rowQ.id]
    const c = p.answers[colQ.id]
    if (r === null || c === null) continue
    const i = rowLabels.indexOf(r)
    const j = colLabels.indexOf(c)
    if (i < 0 || j < 0) continue
    counts[i][j]++
    n++
  }
  return {
    rowQ: rowQ.id,
    colQ: colQ.id,
    rowLabels,
    colLabels,
    counts,
    rowTotals: counts.map((r) => r.reduce((a, b) => a + b, 0)),
    colTotals: colLabels.map((_, j) => counts.reduce((s, r) => s + r[j], 0)),
    n,
    excluded: ps.length - n,
  }
}

/** Valor de uma célula conforme o modo de percentual escolhido. */
export function cellValue(ct: Crosstab, i: number, j: number, mode: CrossMode): number {
  const c = ct.counts[i][j]
  switch (mode) {
    case 'count': return c
    case 'row': return pct(c, ct.rowTotals[i])
    case 'col': return pct(c, ct.colTotals[j])
    case 'total': return pct(c, ct.n)
  }
}

export function denominatorLabel(mode: CrossMode): string {
  switch (mode) {
    case 'count': return 'Quantidade de participantes'
    case 'row': return 'Percentual sobre o total da linha'
    case 'col': return 'Percentual sobre o total da coluna'
    case 'total': return 'Percentual sobre o total com resposta válida nas duas perguntas'
  }
}

export interface GroupedDistribution {
  group: string
  n: number
  missing: number
  rows: FrequencyRow[]
}

/** Distribuição de `q` dentro de cada categoria de `by` (base para barras empilhadas 100%). */
export function distributionBy(ps: Participant[], q: ResolvedQuestion, by: ResolvedQuestion): GroupedDistribution[] {
  return by.alternatives
    .map((a) => {
      const subset = ps.filter((p) => p.answers[by.id] === a.label)
      const f = frequency(subset, q)
      return { group: a.label, n: f.valid, missing: f.missing, rows: f.rows }
    })
    .filter((g) => g.n + g.missing > 0)
}

/** Diferença entre dois percentuais, em pontos percentuais (a − b). */
export function diffPP(a: number, b: number): number {
  return a - b
}

/** Arredonda preservando o total de 100% (método do maior resto) — apenas para exibição. */
export function roundedPercents(counts: number[], decimals = 1): number[] {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return counts.map(() => 0)
  const factor = 10 ** decimals
  const target = 100 * factor
  const exact = counts.map((c) => (c / total) * target)
  const floors = exact.map(Math.floor)
  let remainder = target - floors.reduce((a, b) => a + b, 0)
  const order = exact.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r)
  for (const { i } of order) {
    if (remainder <= 0) break
    floors[i]++
    remainder--
  }
  return floors.map((v) => v / factor)
}

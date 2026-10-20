import type { Dataset, Participant } from '../data/normalize'
import { PROFILE_IDS, type QuestionId, type Questionnaire } from '../data/schema'

export type QuestionnaireScope = 'todos' | Exclude<Questionnaire, 'perfil'>

export interface Filters {
  questionnaire: QuestionnaireScope
  /** Valores selecionados por pergunta (perfil ou resposta). Vazio = sem filtro. */
  values: Partial<Record<QuestionId, string[]>>
}

export const EMPTY_FILTERS: Filters = { questionnaire: 'todos', values: {} }

/** Aplica todos os filtros em conjunto (E entre perguntas, OU entre valores da mesma pergunta). */
export function applyFilters(ps: Participant[], f: Filters): Participant[] {
  const active = Object.entries(f.values).filter(([, v]) => v && v.length > 0) as [QuestionId, string[]][]
  if (active.length === 0) return ps
  return ps.filter((p) => active.every(([qid, vals]) => p.answers[qid] !== null && vals.includes(p.answers[qid]!)))
}

export function activeFilterCount(f: Filters): number {
  return Object.values(f.values).filter((v) => v && v.length > 0).length + (f.questionnaire !== 'todos' ? 1 : 0)
}

/** Dimensões de perfil disponíveis como filtro: existem no arquivo e têm mais de um valor. */
export function filterableProfileDims(ds: Dataset): QuestionId[] {
  return PROFILE_IDS.filter((id) => {
    const q = ds.questions.find((x) => x.id === id)
    if (!q || q.colIndex === null) return false
    const distinct = new Set(ds.participants.map((p) => p.answers[id]).filter(Boolean))
    return distinct.size > 1
  })
}

export function toggleValue(f: Filters, qid: QuestionId, value: string): Filters {
  const cur = f.values[qid] ?? []
  const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]
  return { ...f, values: { ...f.values, [qid]: next } }
}

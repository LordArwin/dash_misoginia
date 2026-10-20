import { useState } from 'react'
import { FilterX, X, SlidersHorizontal } from 'lucide-react'
import { PROFILE_IDS, QUESTIONNAIRE_LABEL, type QuestionId } from '../../data/schema'
import { useAnalysis } from '../../state/AppState'
import { activeFilterCount, applyFilters, type QuestionnaireScope } from '../../stats/filters'
import { formatInt } from '../../stats/format'
import { Segmented, SelectField } from '../common/ui'
import { MultiSelect } from './MultiSelect'

/** Contagens de cada valor considerando os demais filtros (exceto o da própria dimensão). */
function useCounts(qid: QuestionId) {
  const { all, filters, q } = useAnalysis()
  const others = { ...filters, values: { ...filters.values, [qid]: [] } }
  const base = applyFilters(all, others)
  return q(qid).alternatives.map((a) => ({ value: a.label, label: a.label, count: base.filter((p) => p.answers[qid] === a.label).length }))
}

function DimFilter({ qid }: { qid: QuestionId }) {
  const { q, filters, toggle, setFilters } = useAnalysis()
  const options = useCounts(qid)
  return (
    <MultiSelect
      label={q(qid).short.replace(' declarado', '')}
      options={options}
      selected={filters.values[qid] ?? []}
      onToggle={(v) => toggle(qid, v)}
      onClear={() => setFilters({ ...filters, values: { ...filters.values, [qid]: [] } })}
    />
  )
}

function AnswerFilter() {
  const { dataset, filters, toggle, setFilters } = useAnalysis()
  const answerQs = dataset.questions.filter(
    (x) => x.questionnaire !== 'perfil' && x.colIndex !== null && (filters.questionnaire === 'todos' || x.questionnaire === filters.questionnaire),
  )
  const [qid, setQid] = useState<QuestionId>(answerQs[0]?.id ?? 'q1_misoginia')
  const current = answerQs.find((x) => x.id === qid) ?? answerQs[0]
  const options = useCounts(current?.id ?? qid)
  const totalSelected = answerQs.reduce((s, x) => s + (filters.values[x.id]?.length ?? 0), 0)
  if (!current) return null
  return (
    <MultiSelect
      label="Resposta"
      wide
      options={options}
      selected={filters.values[current.id] ?? []}
      onToggle={(v) => toggle(current.id, v)}
      onClear={() => setFilters({ ...filters, values: { ...filters.values, [current.id]: [] } })}
    >
      <div className="mb-2 border-b border-line pb-2">
        <SelectField
          label="Pergunta"
          value={current.id}
          onChange={(v) => setQid(v as QuestionId)}
          options={answerQs.map((x) => ({ value: x.id, label: `${x.columnLetter}. ${x.short}`, group: QUESTIONNAIRE_LABEL[x.questionnaire] }))}
        />
        <p className="mt-1.5 text-[11px] text-ink-3">
          Mantém apenas participantes que marcaram as alternativas escolhidas. {totalSelected > 0 && `${totalSelected} alternativa(s) ativa(s) no total.`}
        </p>
      </div>
    </MultiSelect>
  )
}

export function FilterBar() {
  const { profileDims, filters, setScope, clear, filtered, all } = useAnalysis()
  const n = activeFilterCount(filters)
  return (
    <div className="no-print border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8" role="region" aria-label="Filtros globais">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
          <SlidersHorizontal size={14} aria-hidden /> Filtros
        </span>
        <Segmented<QuestionnaireScope>
          label="Questionário"
          value={filters.questionnaire}
          onChange={setScope}
          options={[
            { value: 'todos', label: 'Ambos questionários' },
            { value: 'q1', label: 'Q1' },
            { value: 'q2', label: 'Q2' },
          ]}
        />
        {profileDims.map((d) => <DimFilter key={d} qid={d} />)}
        <AnswerFilter />
        <button
          type="button"
          onClick={clear}
          disabled={n === 0}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-alert-700 hover:bg-alert-100 disabled:text-ink-3 disabled:hover:bg-transparent"
        >
          <FilterX size={14} aria-hidden /> Limpar filtros
        </button>
        <p className="ml-auto text-xs text-ink-2 tabular" aria-live="polite">
          Exibindo <strong className="text-ink">{formatInt(filtered.length)}</strong> de {formatInt(all.length)} participantes
        </p>
      </div>
      <ActiveFilters />
    </div>
  )
}

export function ActiveFilters({ readOnly = false }: { readOnly?: boolean }) {
  const { filters, q, toggle, setScope } = useAnalysis()
  const chips: { key: string; label: string; onRemove: () => void }[] = []
  if (filters.questionnaire !== 'todos') {
    chips.push({ key: 'scope', label: `Questionário: ${QUESTIONNAIRE_LABEL[filters.questionnaire]}`, onRemove: () => setScope('todos') })
  }
  for (const [qid, vals] of Object.entries(filters.values) as [QuestionId, string[]][]) {
    for (const v of vals ?? []) {
      const question = q(qid)
      const prefix = PROFILE_IDS.includes(qid) ? question.short.replace(' declarado', '') : `${question.columnLetter}. ${question.short}`
      chips.push({ key: `${qid}:${v}`, label: `${prefix}: ${v}`, onRemove: () => toggle(qid, v) })
    }
  }
  if (chips.length === 0) return null
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Filtros ativos">
      {chips.map((c) => (
        <li key={c.key} className="inline-flex max-w-full items-center gap-1 rounded-full border border-petrol-600/30 bg-petrol-50 py-0.5 pl-2.5 pr-1 text-[11px] text-petrol-800">
          <span className="truncate">{c.label}</span>
          {!readOnly && (
            <button type="button" onClick={c.onRemove} className="rounded-full p-0.5 hover:bg-petrol-100" aria-label={`Remover filtro ${c.label}`}>
              <X size={12} aria-hidden />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

import type { ReactNode } from 'react'
import type { QuestionId } from '../../data/schema'
import { QUESTIONNAIRE_LABEL } from '../../data/schema'
import type { ResolvedQuestion } from '../../data/normalize'
import { useAnalysis } from '../../state/AppState'
import { frequency, groupShares, type Frequency, type GroupShare } from '../../stats/stats'
import { formatInt, formatPct } from '../../stats/format'
import { SMALL_SAMPLE } from '../../stats/insights'
import { ChartCard, EmptyState } from '../common/ui'
import { DistributionChart } from '../charts/DistributionChart'
import { slug, type CsvValue } from '../../utils/csv'

export function questionMeta(q: ResolvedQuestion, f: Frequency): string {
  return `${QUESTIONNAIRE_LABEL[q.questionnaire]} · coluna ${q.columnLetter ?? '—'} · ${formatInt(f.valid)} respostas válidas · ${formatInt(f.missing)} ausente(s)`
}

export function frequencyCsv(q: ResolvedQuestion, f: Frequency): CsvValue[][] {
  return [
    ['Questionário', 'Coluna', 'Pergunta', 'Alternativa', 'Grupo analítico', 'Quantidade', '% das respostas válidas', 'Respostas válidas', 'Ausentes'],
    ...f.rows.map((r) => [QUESTIONNAIRE_LABEL[q.questionnaire], q.columnLetter, q.header, r.label, r.groupLabel, r.count, r.pct, f.valid, f.missing]),
  ]
}

export function FrequencyTable({ f }: { f: Frequency }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-ink-3">
          <tr className="border-b border-line">
            <th scope="col" className="py-1.5 pr-3 font-medium">Alternativa</th>
            <th scope="col" className="py-1.5 pr-3 font-medium">Grupo analítico</th>
            <th scope="col" className="py-1.5 pr-3 text-right font-medium">Quantidade</th>
            <th scope="col" className="py-1.5 text-right font-medium">% válidas</th>
          </tr>
        </thead>
        <tbody>
          {f.rows.map((r) => (
            <tr key={r.label} className="border-b border-line/60">
              <td className="py-1.5 pr-3 text-ink">{r.label}{!r.expected && <span className="ml-1 text-ochre-700">(não prevista)</span>}</td>
              <td className="py-1.5 pr-3 text-ink-2">{r.groupLabel === 'Valor' ? '—' : r.groupLabel}</td>
              <td className="tabular py-1.5 pr-3 text-right">{formatInt(r.count)}</td>
              <td className="tabular py-1.5 text-right">{formatPct(r.pct)}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-1.5 pr-3">Total de respostas válidas</td>
            <td />
            <td className="tabular py-1.5 pr-3 text-right">{formatInt(f.valid)}</td>
            <td className="tabular py-1.5 text-right">{f.valid ? '100,0%' : '—'}</td>
          </tr>
          <tr className="text-ink-3">
            <td className="py-1.5 pr-3">Ausentes (fora do denominador)</td>
            <td />
            <td className="tabular py-1.5 pr-3 text-right">{formatInt(f.missing)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function GroupSummary({ shares }: { shares: GroupShare[] }) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 sm:grid-cols-4">
      {shares.map((s) => (
        <div key={s.groupId} className="rounded-md bg-canvas px-2.5 py-2" title={`Inclui: ${s.alternatives.join(' + ')}`}>
          <dt className="text-[11px] leading-tight text-ink-2">
            {s.label}
          </dt>
          <dd className="mt-1 tabular text-base font-semibold text-navy-900">
            {formatPct(s.pct)} <span className="text-xs font-normal text-ink-3">({formatInt(s.count)})</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}

interface QuestionCardProps {
  qid: QuestionId
  title?: string
  showGroups?: boolean
  footnote?: ReactNode
  /** Permite clicar nas barras para filtrar o painel. */
  clickToFilter?: boolean
  className?: string
}

/** Cartão padrão: distribuição completa das alternativas de uma pergunta. */
export function QuestionCard({ qid, title, showGroups, footnote, clickToFilter = true, className }: QuestionCardProps) {
  const { q, filtered, filters, toggle } = useAnalysis()
  const question = q(qid)
  if (question.colIndex === null) {
    return (
      <ChartCard title={title ?? question.short} alt="Pergunta indisponível" className={className}>
        <EmptyState title="Coluna não encontrada na planilha" />
      </ChartCard>
    )
  }
  const f = frequency(filtered, question)
  const shares = showGroups ? groupShares(filtered, question) : []
  const groupedDiff = shares.some((s) => s.alternatives.length > 1)
  const top = [...f.rows].sort((a, b) => b.count - a.count)[0]

  return (
    <ChartCard
      className={className}
      title={title ?? question.short}
      subtitle={<span className="italic">“{question.header}”</span>}
      meta={questionMeta(question, f)}
      alt={`Gráfico de barras: ${question.short}. ${f.rows.map((r) => `${r.label}: ${r.count} (${formatPct(r.pct)})`).join('; ')}.`}
      csv={{ name: `distribuicao-${slug(question.short)}`, rows: frequencyCsv(question, f) }}
      table={<FrequencyTable f={f} />}
      footnote={
        <>
          {f.valid === 0 ? 'Sem respostas válidas no recorte atual.' : `Percentuais sobre ${formatInt(f.valid)} respostas válidas. Alternativa mais frequente: “${top.label}”.`}
          {f.valid > 0 && f.valid < SMALL_SAMPLE && ' Amostra filtrada pequena: interprete com cautela.'}
          {clickToFilter && ' Clique em uma barra para filtrar o painel por essa alternativa.'}
          {groupedDiff && ' Os grupos-síntese abaixo somam alternativas conforme regra documentada na página Metodologia.'}
          {footnote && <span className="mt-1 block">{footnote}</span>}
        </>
      }
    >
      {f.valid === 0 ? (
        <EmptyState />
      ) : (
        <>
          <DistributionChart freq={f} selected={filters.values[qid]} onToggle={clickToFilter ? (l) => toggle(qid, l) : undefined} />
          {showGroups && <GroupSummary shares={shares} />}
        </>
      )}
    </ChartCard>
  )
}

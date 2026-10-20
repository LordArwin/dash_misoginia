import { useState } from 'react'
import type { QuestionId } from '../../data/schema'
import { useAnalysis } from '../../state/AppState'
import { crosstab, distributionBy, groupShares, diffPP } from '../../stats/stats'
import { formatInt, formatPct, formatPP } from '../../stats/format'
import { ChartCard, EmptyState, Segmented, SelectField } from '../common/ui'
import { StackedChart } from '../charts/StackedChart'
import { HeatmapTable } from '../charts/HeatmapTable'
import { slug, type CsvValue } from '../../utils/csv'

interface Props {
  qid: QuestionId
  title?: string
  dims?: QuestionId[]
}

/** Barras empilhadas 100% de uma pergunta segundo uma dimensão de perfil selecionável. */
export function CrossByDimension({ qid, title, dims = ['ano', 'idade', 'genero'] }: Props) {
  const { q, filtered, profileDims } = useAnalysis()
  const available = dims.filter((d) => profileDims.includes(d))
  const [dim, setDim] = useState<QuestionId>(available[0] ?? 'ano')
  const question = q(qid)
  if (available.length === 0) return null
  const by = q(dim)
  const groups = distributionBy(filtered, question, by)
  const ct = crosstab(filtered, by, question)

  const csv: CsvValue[][] = [
    [by.short, 'Alternativa', 'Quantidade', '% do grupo (respostas válidas)', 'Respostas válidas no grupo', 'Ausentes no grupo'],
    ...groups.flatMap((g) => g.rows.map((r) => [g.group, r.label, r.count, r.pct, g.n, g.missing] as CsvValue[])),
  ]

  return (
    <ChartCard
      title={title ?? `${question.short} por ${by.short.toLowerCase()}`}
      subtitle="Distribuição percentual dentro de cada grupo (cada barra soma 100% das respostas válidas do grupo)."
      meta={`Base: ${formatInt(ct.n)} participante(s) com resposta válida nas duas variáveis${ct.excluded ? ` · ${formatInt(ct.excluded)} excluído(s) por ausência` : ''}`}
      alt={`Barras empilhadas de ${question.short} por ${by.short}. ${groups.map((g) => `${g.group} (n=${g.n}): ${g.rows.filter((r) => r.count > 0).map((r) => `${r.label} ${formatPct(r.pct)}`).join(', ')}`).join('. ')}`}
      csv={{ name: `${slug(question.short)}-por-${slug(by.short)}`, rows: csv }}
      table={<HeatmapTable ct={ct} mode="row" rowTitle={by.short} colTitle={question.short} />}
      actions={
        available.length > 1 ? (
          <Segmented label="Cruzar por" value={dim} onChange={setDim} options={available.map((d) => ({ value: d, label: q(d).short.replace(' declarado', '') }))} />
        ) : undefined
      }
      footnote="Associações descritivas entre grupos; não indicam causalidade. Grupos com poucos participantes produzem percentuais instáveis."
    >
      {groups.length === 0 ? <EmptyState /> : (
        <>
          <StackedChart question={question} groups={groups} />
          <GroupDifference qid={qid} by={dim} />
        </>
      )}
    </ChartCard>
  )
}

/** Diferença, em pontos percentuais, de um grupo-síntese entre as categorias de uma dimensão. */
export function GroupDifference({ qid, by }: { qid: QuestionId; by: QuestionId }) {
  const { q, filtered } = useAnalysis()
  const question = q(qid)
  const dim = q(by)
  const groupIds = [...new Set(question.alternatives.map((a) => a.group))]
  const options = [
    ...groupIds
      .filter((g) => question.alternatives.filter((a) => a.group === g).length > 1)
      .map((g) => ({ value: `g:${g}`, label: `Grupo: ${question.groups.find((x) => x.id === g)?.label ?? g}` })),
    ...question.alternatives.map((a) => ({ value: `a:${a.label}`, label: a.label })),
  ]
  const [sel, setSel] = useState(options[0]?.value ?? '')
  const current = options.some((o) => o.value === sel) ? sel : options[0]?.value
  if (!current) return null

  const rows = dim.alternatives
    .map((cat) => {
      const subset = filtered.filter((p) => p.answers[by] === cat.label)
      const valid = subset.filter((p) => p.answers[qid] !== null).length
      let count: number
      if (current.startsWith('g:')) {
        const g = groupShares(subset, question).find((x) => x.groupId === current.slice(2))
        count = g?.count ?? 0
      } else {
        count = subset.filter((p) => p.answers[qid] === current.slice(2)).length
      }
      return { cat: cat.label, count, valid, pct: valid ? (count / valid) * 100 : 0 }
    })
    .filter((r) => r.valid > 0)

  const max = rows.reduce((a, b) => (b.pct > a.pct ? b : a), rows[0])
  const min = rows.reduce((a, b) => (b.pct < a.pct ? b : a), rows[0])

  return (
    <div className="mt-4 rounded-md border border-line bg-canvas/60 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <SelectField className="min-w-56 flex-1" label="Comparar grupos pela categoria" value={current} onChange={setSel} options={options} />
      </div>
      {rows.length < 2 ? (
        <p className="mt-2 text-xs text-ink-3">São necessários ao menos dois grupos com respostas válidas para comparar.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-ink-3">
              <tr>
                <th scope="col" className="py-1 pr-3 text-left font-medium">{dim.short}</th>
                <th scope="col" className="py-1 pr-3 text-right font-medium">Quantidade</th>
                <th scope="col" className="py-1 pr-3 text-right font-medium">Válidas no grupo</th>
                <th scope="col" className="py-1 text-right font-medium">% no grupo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.cat} className="border-t border-line/70">
                  <td className="py-1 pr-3">{r.cat}</td>
                  <td className="tabular py-1 pr-3 text-right">{formatInt(r.count)}</td>
                  <td className="tabular py-1 pr-3 text-right">{formatInt(r.valid)}</td>
                  <td className="tabular py-1 text-right font-semibold">{formatPct(r.pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-ink-2">
            Diferença entre o maior e o menor percentual: <strong className="tabular">{formatPP(diffPP(max.pct, min.pct))}</strong> ({max.cat} − {min.cat}).
            {rows.some((r) => r.valid < 5) && <span className="text-ochre-700"> Há grupo com menos de 5 respostas válidas.</span>}
          </p>
        </div>
      )}
    </div>
  )
}

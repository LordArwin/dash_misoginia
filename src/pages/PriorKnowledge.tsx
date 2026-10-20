import { useState } from 'react'
import { useAnalysis } from '../state/AppState'
import type { QuestionId } from '../data/schema'
import { groupShares } from '../stats/stats'
import { formatInt, formatPct } from '../stats/format'
import { QuestionCard } from '../components/analysis/QuestionCard'
import { CrossByDimension } from '../components/analysis/CrossByDimension'
import { ChartCard, Notice, PageHeader, SectionTitle, Segmented } from '../components/common/ui'
import { heatColor } from '../components/charts/colors'
import { grid2, SampleGuard, ScopeGate } from './common'
import type { CsvValue } from '../utils/csv'

const KNOWLEDGE: QuestionId[] = ['q1_misoginia', 'q1_dh', 'q1_relacao']

/** Matriz de indicadores: linhas = perguntas, colunas = grupos analíticos (com as alternativas que os compõem). */
export function IndicatorMatrix({ ids, caption }: { ids: QuestionId[]; caption: string }) {
  const { q, filtered } = useAnalysis()
  const first = q(ids[0])
  const groups = first.groups
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0.5 text-xs">
        <caption className="mb-2 text-left text-ink-3">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-left font-medium text-ink-3">Pergunta</th>
            {groups.map((g) => (
              <th key={g.id} scope="col" className="min-w-28 p-2 text-left font-medium text-ink-2">{g.label}</th>
            ))}
            <th scope="col" className="p-2 text-right font-medium text-ink-3">Válidas</th>
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const question = q(id)
            const shares = groupShares(filtered, question)
            const valid = shares.reduce((s, x) => s + x.count, 0)
            return (
              <tr key={id}>
                <th scope="row" className="p-2 text-left font-medium text-ink">{question.columnLetter}. {question.short}</th>
                {groups.map((g) => {
                  const s = shares.find((x) => x.groupId === g.id)
                  const { bg, fg } = heatColor((s?.pct ?? 0) / 100)
                  return (
                    <td key={g.id} className="tabular rounded p-2 text-right" style={{ background: bg, color: fg }} title={s ? `Inclui: ${s.alternatives.join(' + ')}` : ''}>
                      <span className="block font-semibold">{formatPct(s?.pct ?? 0)}</span>
                      <span className="block opacity-80">n={formatInt(s?.count ?? 0)}</span>
                    </td>
                  )
                })}
                <td className="tabular p-2 text-right text-ink-2">{formatInt(valid)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function PriorKnowledge() {
  const { q, filtered } = useAnalysis()
  const [crossQ, setCrossQ] = useState<QuestionId>('q1_misoginia')

  const matrixCsv: CsvValue[][] = [
    ['Pergunta', 'Grupo analítico', 'Alternativas incluídas', 'Quantidade', '% das respostas válidas'],
    ...KNOWLEDGE.flatMap((id) => groupShares(filtered, q(id)).map((s) => [q(id).short, s.label, s.alternatives.join(' + '), s.count, s.pct] as CsvValue[])),
  ]

  return (
    <>
      <PageHeader
        eyebrow="Questionário 01"
        title="Conhecimento prévio"
        description="Conhecimento declarado pelos participantes antes da apresentação sobre o termo misoginia, sobre Direitos Humanos e sobre a relação entre os dois temas."
      />
      <ScopeGate scope="q1">
        <SampleGuard>
          <div className="mb-5">
            <Notice title="Como ler os níveis de conhecimento">
              Os gráficos mostram todas as alternativas originais. Nos quadros-síntese, distinguem-se: <strong>declara saber o significado</strong> (“Sim, sei o que significa.”), <strong>apenas ouviu falar</strong> (“Já ouvi falar, mas não sei explicar.” + “Já ouvi o termo, mas não sei o que significa.”), <strong>nunca ouviu falar</strong> e <strong>não tem certeza</strong>. Trata-se de conhecimento <em>declarado</em>, não verificado.
            </Notice>
          </div>
          <div className={grid2}>
            <QuestionCard qid="q1_misoginia" showGroups />
            <QuestionCard qid="q1_dh" showGroups />
            <QuestionCard qid="q1_relacao" showGroups className="xl:col-span-2" />
          </div>

          <SectionTitle description="Comparação entre perguntas apenas onde as alternativas são idênticas (colunas D e E). A pergunta sobre a relação (coluna F) mede outro conceito, com alternativas próprias, e aparece em matriz separada.">
            Matriz de indicadores
          </SectionTitle>
          <ChartCard
            title="Níveis de conhecimento declarado por pergunta"
            meta="Percentual sobre as respostas válidas de cada pergunta"
            alt="Matriz com o percentual de cada nível de conhecimento declarado nas perguntas do Questionário 01"
            csv={{ name: 'matriz-conhecimento-previo', rows: matrixCsv }}
          >
            <IndicatorMatrix ids={['q1_misoginia', 'q1_dh']} caption="Misoginia e Direitos Humanos (mesmas alternativas de resposta)." />
            <div className="mt-5">
              <IndicatorMatrix ids={['q1_relacao']} caption="Relação entre Direitos Humanos e enfrentamento à misoginia (alternativas próprias)." />
            </div>
          </ChartCard>

          <SectionTitle description="Distribuição do conhecimento declarado segundo o perfil dos participantes.">Cruzamentos por perfil</SectionTitle>
          <div className="mb-3">
            <Segmented label="Pergunta para o cruzamento" value={crossQ} onChange={setCrossQ} options={KNOWLEDGE.map((id) => ({ value: id, label: q(id).short }))} />
          </div>
          <CrossByDimension key={crossQ} qid={crossQ} />
        </SampleGuard>
      </ScopeGate>
    </>
  )
}

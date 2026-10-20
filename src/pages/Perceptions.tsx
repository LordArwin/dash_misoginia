import { useState } from 'react'
import { useAnalysis } from '../state/AppState'
import type { QuestionId } from '../data/schema'
import { crosstab, type CrossMode } from '../stats/stats'
import { formatInt } from '../stats/format'
import { QuestionCard } from '../components/analysis/QuestionCard'
import { CrossByDimension } from '../components/analysis/CrossByDimension'
import { ChartCard, Notice, PageHeader, SectionTitle, Segmented, SelectField } from '../components/common/ui'
import { HeatmapTable } from '../components/charts/HeatmapTable'
import { grid2, SampleGuard, ScopeGate } from './common'
import { slug } from '../utils/csv'

const PERCEPTION: QuestionId[] = ['q1_tratamento', 'q1_espacos', 'q1_silenciamento', 'q1_discutir', 'q1_igualdade']

export function Perceptions() {
  const { q, filtered } = useAnalysis()
  const [crossQ, setCrossQ] = useState<QuestionId>('q1_tratamento')
  const [rowQ, setRowQ] = useState<QuestionId>('q1_espacos')
  const [colQ, setColQ] = useState<QuestionId>('q1_silenciamento')
  const [mode, setMode] = useState<CrossMode>('row')
  const ct = crosstab(filtered, q(rowQ), q(colQ))
  const opts = PERCEPTION.map((id) => ({ value: id, label: `${q(id).columnLetter}. ${q(id).short}` }))

  return (
    <>
      <PageHeader
        eyebrow="Questionário 01"
        title="Percepções sobre desigualdade de gênero"
        description="Como os participantes percebem diferenças de tratamento, barreiras e silenciamento de mulheres e meninas, e a importância de discutir a discriminação de gênero."
      />
      <ScopeGate scope="q1">
        <SampleGuard>
          <div className="mb-5">
            <Notice title="Tipos de resposta">
              Cada alternativa é classificada, apenas para os quadros-síntese, como <strong>afirmativa</strong>, <strong>afirmativa com ressalva ou parcial</strong>, <strong>baixa frequência</strong> (“Raramente.”), <strong>neutra</strong>, <strong>negativa</strong> ou <strong>incerteza</strong> (“Não sei responder.”, “Nunca pensei sobre isso.”). As respostas não são convertidas em escala numérica. As cores seguem a ordem das alternativas e não expressam julgamento; incerteza aparece em cinza.
            </Notice>
          </div>
          <div className={grid2}>
            <QuestionCard qid="q1_tratamento" showGroups />
            <QuestionCard qid="q1_espacos" showGroups />
            <QuestionCard qid="q1_silenciamento" showGroups />
            <QuestionCard qid="q1_discutir" showGroups />
            <QuestionCard
              qid="q1_igualdade"
              showGroups
              className="xl:col-span-2"
              footnote="Pergunta complementar do Questionário 01 (coluna I), sobre igualdade de direitos de forma ampla."
            />
          </div>

          <SectionTitle description="Barras empilhadas 100% para comparar a distribuição das respostas entre grupos.">Comparação entre grupos</SectionTitle>
          <div className="mb-3 max-w-md">
            <SelectField label="Pergunta" value={crossQ} onChange={(v) => setCrossQ(v as QuestionId)} options={opts} />
          </div>
          <CrossByDimension key={crossQ} qid={crossQ} dims={['ano', 'idade', 'genero']} />

          <SectionTitle description="Mapa de calor entre duas perguntas de percepção. Cada participante entra uma única vez, na combinação das suas duas respostas.">Matriz entre percepções</SectionTitle>
          <ChartCard
            title={`${q(rowQ).short} × ${q(colQ).short}`}
            meta={`${formatInt(ct.n)} participante(s) com as duas respostas válidas`}
            alt={`Mapa de calor ${q(rowQ).short} por ${q(colQ).short}`}
            csv={{ name: `matriz-${slug(q(rowQ).short)}-${slug(q(colQ).short)}`, rows: [[`${q(rowQ).short} \\ ${q(colQ).short}`, ...ct.colLabels, 'Total'], ...ct.rowLabels.map((r, i) => [r, ...ct.counts[i], ct.rowTotals[i]]), ['Total', ...ct.colTotals, ct.n]] }}
            footnote="Associação descritiva entre respostas do mesmo participante; não indica relação causal."
          >
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <SelectField label="Linhas" value={rowQ} onChange={(v) => setRowQ(v as QuestionId)} options={opts} />
              <SelectField label="Colunas" value={colQ} onChange={(v) => setColQ(v as QuestionId)} options={opts} />
              <Segmented label="Valores" value={mode} onChange={setMode} options={[{ value: 'count', label: 'n' }, { value: 'row', label: '% linha' }, { value: 'col', label: '% coluna' }, { value: 'total', label: '% total' }]} />
            </div>
            <HeatmapTable ct={ct} mode={mode} rowTitle={q(rowQ).short} colTitle={q(colQ).short} />
          </ChartCard>
        </SampleGuard>
      </ScopeGate>
    </>
  )
}

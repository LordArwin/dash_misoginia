import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { useAnalysis } from '../state/AppState'
import { QUESTIONNAIRE_LABEL, type QuestionId } from '../data/schema'
import { crosstab, distributionBy, type CrossMode } from '../stats/stats'
import { ChartCard, Notice, PageHeader, SectionTitle, Segmented, SelectField } from '../components/common/ui'
import { HeatmapTable } from '../components/charts/HeatmapTable'
import { StackedChart } from '../components/charts/StackedChart'
import { GroupDifference } from '../components/analysis/CrossByDimension'
import { SampleGuard } from './common'
import { slug, type CsvValue } from '../utils/csv'

const PRESETS: { label: string; row: QuestionId; col: QuestionId }[] = [
  { label: 'Conhecimento prévio sobre misoginia × percepção de desigualdade', row: 'q1_misoginia', col: 'q1_tratamento' },
  { label: 'Conhecimento sobre DH × compreensão da relação com misoginia', row: 'q1_dh', col: 'q1_relacao' },
  { label: 'Série escolar × conhecimento prévio', row: 'ano', col: 'q1_misoginia' },
  { label: 'Percepção inicial × avaliação posterior', row: 'q1_tratamento', col: 'q2_percepcao' },
  { label: 'Conhecimento inicial × capacidade declarada de identificar (após)', row: 'q1_misoginia', col: 'q2_identificar' },
  { label: 'Relação DH × misoginia: antes × compreensão após', row: 'q1_relacao', col: 'q2_compreensao' },
]

export function CrossAnalysis() {
  const { dataset, filtered, q, filters } = useAnalysis()
  const [row, setRow] = useState<QuestionId>(PRESETS[0].row)
  const [col, setCol] = useState<QuestionId>(PRESETS[0].col)
  const [mode, setMode] = useState<CrossMode>('row')

  const inScope = (id: QuestionId) => {
    const qq = q(id)
    return qq.colIndex !== null && (qq.questionnaire === 'perfil' || filters.questionnaire === 'todos' || qq.questionnaire === filters.questionnaire)
  }
  const options = dataset.questions
    .filter((x) => inScope(x.id) && new Set(dataset.participants.map((p) => p.answers[x.id]).filter(Boolean)).size > 1)
    .map((x) => ({ value: x.id, label: `${x.columnLetter}. ${x.short}`, group: QUESTIONNAIRE_LABEL[x.questionnaire] }))
  const presets = PRESETS.filter((p) => inScope(p.row) && inScope(p.col))

  const rowQ = q(inScope(row) ? row : (options[0]?.value as QuestionId))
  const colQ = q(inScope(col) ? col : (options[1]?.value as QuestionId))
  if (!rowQ || !colQ) return null
  const ct = crosstab(filtered, rowQ, colQ)
  const groups = distributionBy(filtered, colQ, rowQ)
  const crossesQuestionnaires = rowQ.questionnaire !== colQ.questionnaire && rowQ.questionnaire !== 'perfil' && colQ.questionnaire !== 'perfil'

  const csv: CsvValue[][] = [
    [`${rowQ.short} (linhas) \\ ${colQ.short} (colunas)`, ...ct.colLabels, 'Total'],
    ...ct.rowLabels.map((r, i) => [r, ...ct.counts[i], ct.rowTotals[i]]),
    ['Total', ...ct.colTotals, ct.n],
    [],
    ['Base (pares válidos)', ct.n],
    ['Excluídos por ausência', ct.excluded],
  ]

  return (
    <>
      <PageHeader
        eyebrow="Análise integrada"
        title="Cruzamentos"
        description="Escolha duas variáveis para investigar como as respostas se distribuem conjuntamente. Cada participante entra uma vez na tabela, na combinação das suas duas respostas."
      />
      <SampleGuard>
        <div className="mb-5 space-y-3">
          <Notice title="Vínculo entre os questionários">
            Cada linha da planilha corresponde a um participante, com as respostas dos dois questionários. Por isso os cruzamentos Q1 × Q2 são feitos no nível individual (mesma linha). A planilha não possui uma coluna de identificação explícita: o vínculo depende da organização do arquivo pela equipe de pesquisa. Associações observadas são descritivas e <strong>não indicam causalidade</strong>.
          </Notice>
        </div>

        <SectionTitle>Cruzamentos sugeridos</SectionTitle>
        <div className="no-print mb-5 flex flex-wrap gap-2">
          {presets.map((p) => {
            const active = p.row === rowQ.id && p.col === colQ.id
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={active}
                onClick={() => { setRow(p.row); setCol(p.col) }}
                className={`rounded-md border px-3 py-1.5 text-left text-xs transition-colors ${active ? 'border-navy-800 bg-navy-800 text-white' : 'border-line-strong bg-white text-ink-2 hover:border-navy-700'}`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <div className="no-print mb-4 grid grid-cols-1 gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
          <SelectField label="Variável das linhas (grupos)" value={rowQ.id} onChange={(v) => setRow(v as QuestionId)} options={options} />
          <button type="button" onClick={() => { setRow(colQ.id); setCol(rowQ.id) }} className="inline-flex items-center justify-center gap-1 rounded-md border border-line-strong px-2.5 py-1.5 text-xs text-ink-2 hover:border-navy-700" aria-label="Inverter linhas e colunas">
            <ArrowLeftRight size={14} aria-hidden /> Inverter
          </button>
          <SelectField label="Variável das colunas (respostas)" value={colQ.id} onChange={(v) => setCol(v as QuestionId)} options={options} />
          <Segmented label="Valores da tabela" value={mode} onChange={setMode} options={[{ value: 'count', label: 'n' }, { value: 'row', label: '% linha' }, { value: 'col', label: '% coluna' }, { value: 'total', label: '% total' }]} />
        </div>

        {rowQ.id === colQ.id ? (
          <Notice tone="warn">Selecione duas variáveis diferentes.</Notice>
        ) : (
          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
            <ChartCard
              title="Tabela de contingência"
              subtitle={`${rowQ.short} × ${colQ.short}`}
              alt={`Tabela de contingência entre ${rowQ.short} e ${colQ.short}`}
              csv={{ name: `contingencia-${slug(rowQ.short)}-x-${slug(colQ.short)}`, rows: csv }}
              footnote={
                <>
                  “% linha”: distribuição das respostas das colunas dentro de cada grupo da linha. “% coluna”: composição de cada resposta pelos grupos da linha. “% total”: sobre todos os pares válidos.
                  {crossesQuestionnaires && ' Este cruzamento combina respostas do Q1 (antes) e do Q2 (após) do mesmo participante; os universos de cada pergunta estão indicados nos totais.'}
                </>
              }
            >
              <HeatmapTable ct={ct} mode={mode} rowTitle={`${rowQ.columnLetter}. ${rowQ.short}`} colTitle={`${colQ.columnLetter}. ${colQ.short}`} />
            </ChartCard>
            <ChartCard
              title="Distribuição dentro de cada grupo"
              subtitle={`Respostas de “${colQ.short}” em cada categoria de “${rowQ.short}”`}
              meta="Barras empilhadas 100% · percentual sobre as respostas válidas do grupo"
              alt={`Barras empilhadas de ${colQ.short} por ${rowQ.short}`}
              footnote="Grupos sem participantes no recorte não são exibidos."
            >
              <StackedChart question={colQ} groups={groups} />
              <GroupDifference key={`${rowQ.id}-${colQ.id}`} qid={colQ.id} by={rowQ.id} />
            </ChartCard>
          </div>
        )}
      </SampleGuard>
    </>
  )
}

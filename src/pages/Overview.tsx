import { useEffect, useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { useAnalysis } from '../state/AppState'
import { computeIndicator, indicatorRule, INDICATORS, type IndicatorId } from '../stats/indicators'
import { buildInsights } from '../stats/insights'
import { formatInt, formatPct } from '../stats/format'
import { validCount, type Frequency } from '../stats/stats'
import { Q1_IDS, Q2_IDS } from '../data/schema'
import { KpiCard, QBadge } from '../components/analysis/KpiCard'
import { QuestionCard } from '../components/analysis/QuestionCard'
import { Card, ChartCard, Notice, PageHeader, SectionTitle } from '../components/common/ui'
import { DistributionChart } from '../components/charts/DistributionChart'
import { grid2, SampleGuard } from './common'

const NOTES_KEY = 'mdh-notas-pesquisador'

function respondents(ps: ReturnType<typeof useAnalysis>['filtered'], ids: string[]) {
  return ps.filter((p) => ids.some((id) => p.answers[id as keyof typeof p.answers] !== null)).length
}

export function Overview() {
  const a = useAnalysis()
  const { dataset, filtered, filters } = a
  const showQ1 = filters.questionnaire !== 'q2'
  const showQ2 = filters.questionnaire !== 'q1'
  const ind = (id: IndicatorId) => computeIndicator(dataset, filtered, INDICATORS[id])
  const insights = buildInsights(dataset, filtered).filter((i) => (showQ1 || !['conhecimento-misoginia', 'percepcao-desigualdade', 'experiencias', 'relacao-antes-depois'].includes(i.id)) && (showQ2 || !['mudanca-percepcao', 'relacao-antes-depois'].includes(i.id)))

  const kpi = (id: IndicatorId, label: string, q: 'q1' | 'q2') => {
    const v = ind(id)
    return <KpiCard key={id} label={label} value={v.pct} count={v.count} denominator={v.valid} rule={indicatorRule(v.alternatives)} badge={<QBadge q={q} />} />
  }

  // Síntese do Q2: um indicador por pergunta (proporção do grupo documentado)
  const synthesisIds: IndicatorId[] = ['compreendeMelhor', 'concordaViolacao', 'identifica', 'mudouPercepcao', 'importante']
  const synthesis: Frequency = {
    questionId: 'q2_compreensao',
    participants: filtered.length,
    valid: 100,
    missing: 0,
    rows: synthesisIds.map((id, i) => {
      const v = ind(id)
      return { label: INDICATORS[id].label, group: '', groupLabel: '', uncertain: false, expected: true, order: i, count: v.count, pct: v.pct }
    }),
  }

  return (
    <>
      <PageHeader
        eyebrow="Síntese"
        title="Visão geral"
        description="Principais resultados dos dois questionários. Os percentuais usam como denominador as respostas válidas de cada pergunta no recorte filtrado; a quantidade de participantes que fundamenta cada valor é informada junto a ele."
      />
      <SampleGuard>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {showQ1 && <KpiCard label="Participantes do Questionário 01" value={formatInt(respondents(filtered, Q1_IDS))} denominatorLabel="responderam ao menos uma pergunta do Q1" badge={<QBadge q="q1" />} />}
          {showQ2 && <KpiCard label="Participantes do Questionário 02" value={formatInt(respondents(filtered, Q2_IDS))} denominatorLabel="responderam ao menos uma pergunta do Q2" badge={<QBadge q="q2" />} />}
          {showQ1 && kpi('conheceMisoginia', 'Declararam saber o significado de misoginia antes da apresentação', 'q1')}
          {showQ1 && kpi('sabeRelacao', 'Declararam saber explicar a relação entre Direitos Humanos e misoginia antes', 'q1')}
          {showQ2 && kpi('compreendeMelhor', 'Relataram compreender melhor essa relação após a apresentação', 'q2')}
          {showQ2 && kpi('mudouPercepcao', 'Relataram mudança na percepção sobre desigualdade ou discriminação de gênero', 'q2')}
        </div>

        <SectionTitle description="Achados calculados automaticamente a partir dos dados filtrados, segundo regras fixas e visíveis. Descrevem respostas declaradas, sem inferência causal.">
          Achados relevantes
        </SectionTitle>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="p-4 sm:p-5 xl:col-span-2">
            <ol className="space-y-4">
              {insights.map((ins, i) => (
                <li key={ins.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-800 tabular">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{ins.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-2">{ins.text}</p>
                    <p className="mt-1 text-[11px] leading-snug text-ink-3">Regra: {ins.rule} Base: {formatInt(ins.n)} respostas válidas.</p>
                  </div>
                </li>
              ))}
              {insights.length === 0 && <p className="text-sm text-ink-3">Sem dados suficientes no recorte atual para gerar achados.</p>}
            </ol>
          </Card>
          <ResearcherNotes />
        </div>

        {showQ1 && (
          <>
            <SectionTitle description="Respostas do Questionário 01, antes da apresentação educativa.">Conhecimento prévio</SectionTitle>
            <div className={grid2}>
              <QuestionCard qid="q1_misoginia" title="Conhecimento prévio sobre misoginia" showGroups />
              <QuestionCard qid="q1_dh" title="Conhecimento prévio sobre Direitos Humanos" showGroups />
              <QuestionCard qid="q1_relacao" title="Compreensão inicial da relação entre os dois temas" showGroups className="xl:col-span-2" />
            </div>
          </>
        )}

        {showQ2 && (
          <>
            <SectionTitle description="Cada barra é a proporção de um grupo de alternativas documentado, calculada sobre as respostas válidas da respectiva pergunta do Questionário 02. Os indicadores medem coisas diferentes e não devem ser somados ou comparados como uma escala única.">
              Síntese após a apresentação
            </SectionTitle>
            <ChartCard
              title="Compreensão e percepção relatadas após a apresentação"
              subtitle="Indicadores-síntese do Questionário 02 (autoavaliação dos participantes)"
              meta={`Questionário 02 · ${formatInt(validCount(filtered, 'q2_compreensao'))} participantes com resposta válida`}
              alt={`Indicadores do Q2: ${synthesis.rows.map((r) => `${r.label}: ${formatPct(r.pct)}`).join('; ')}`}
              csv={{ name: 'sintese-q2', rows: [['Indicador', 'Quantidade', '% das respostas válidas', 'Regra'], ...synthesisIds.map((id) => { const v = ind(id); return [INDICATORS[id].label, v.count, v.pct, indicatorRule(v.alternatives)] })] }}
              footnote="Autoavaliação posterior à apresentação: mudança percebida, compreensão declarada e capacidade declarada de identificação não são medidas objetivas de aprendizagem e não permitem atribuir causalidade à ação educativa."
            >
              <DistributionChart freq={synthesis} validByRow={Object.fromEntries(synthesisIds.map((id) => [INDICATORS[id].label, ind(id).valid]))} />
            </ChartCard>
          </>
        )}
        {!showQ1 && !showQ2 && <Notice>Nenhum questionário selecionado.</Notice>}
      </SampleGuard>
    </>
  )
}

function ResearcherNotes() {
  const [text, setText] = useState('')
  useEffect(() => {
    try {
      setText(localStorage.getItem(NOTES_KEY) ?? '')
    } catch {
      /* armazenamento indisponível */
    }
  }, [])
  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <label htmlFor="notas" className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Lightbulb size={16} className="text-petrol-700" aria-hidden /> Interpretação do pesquisador
      </label>
      <p className="mt-1 text-xs text-ink-3">Campo editável para registrar conclusões próprias. Fica salvo apenas neste navegador.</p>
      <textarea
        id="notas"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          try {
            localStorage.setItem(NOTES_KEY, e.target.value)
          } catch {
            /* armazenamento indisponível */
          }
        }}
        rows={8}
        placeholder="Ex.: síntese para a apresentação acadêmica…"
        className="mt-3 w-full flex-1 resize-y rounded-md border border-line-strong p-2.5 text-sm leading-relaxed text-ink print:border-none"
      />
    </Card>
  )
}

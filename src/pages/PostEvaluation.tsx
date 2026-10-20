import { useState } from 'react'
import { useAnalysis } from '../state/AppState'
import type { QuestionId } from '../data/schema'
import { computeIndicator, indicatorRule, INDICATORS, type IndicatorId } from '../stats/indicators'
import { QuestionCard } from '../components/analysis/QuestionCard'
import { CrossByDimension } from '../components/analysis/CrossByDimension'
import { KpiCard } from '../components/analysis/KpiCard'
import { Notice, PageHeader, SectionTitle, SelectField } from '../components/common/ui'
import { grid2, SampleGuard, ScopeGate } from './common'

const Q2: QuestionId[] = ['q2_compreensao', 'q2_violacao', 'q2_identificar', 'q2_percepcao', 'q2_importancia']

const KPIS: { id: IndicatorId; label: string; kind: string }[] = [
  { id: 'compreendeMelhor', label: 'Relatam melhora na compreensão da relação DH × misoginia', kind: 'Compreensão declarada' },
  { id: 'concordaViolacao', label: 'Concordam total ou parcialmente que a discriminação pode violar direitos', kind: 'Concordância' },
  { id: 'identifica', label: 'Declaram identificar situações com facilidade ou em algumas situações', kind: 'Capacidade declarada' },
  { id: 'dificuldade', label: 'Declaram ainda ter dificuldade para identificar situações de misoginia', kind: 'Capacidade declarada' },
  { id: 'mudouPercepcao', label: 'Relatam mudança significativa ou parcial de percepção', kind: 'Mudança percebida' },
  { id: 'importante', label: 'Consideram a educação em DH muito importante ou importante', kind: 'Importância atribuída' },
]

export function PostEvaluation() {
  const { dataset, filtered, q } = useAnalysis()
  const [crossQ, setCrossQ] = useState<QuestionId>('q2_compreensao')

  return (
    <>
      <PageHeader
        eyebrow="Questionário 02"
        title="Avaliação após a apresentação"
        description="Autoavaliação dos participantes depois da apresentação educativa."
      />
      <ScopeGate scope="q2">
        <SampleGuard>
          <div className="mb-5">
            <Notice title="Medidas diferentes, não equivalentes">
              As perguntas medem dimensões distintas: <strong>compreensão declarada</strong> (coluna M), <strong>concordância</strong> sobre violação de direitos (N), <strong>capacidade declarada de identificação</strong> (O), <strong>importância atribuída</strong> (P) e <strong>mudança percebida</strong> (Q). Todas são respostas autorrelatadas, coletadas apenas após a apresentação; não são medidas objetivas de aprendizagem e não permitem afirmar que a apresentação causou as mudanças relatadas.
            </Notice>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {KPIS.map((k) => {
              const v = computeIndicator(dataset, filtered, INDICATORS[k.id])
              return (
                <KpiCard
                  key={k.id}
                  label={k.label}
                  value={v.pct}
                  count={v.count}
                  denominator={v.valid}
                  rule={indicatorRule(v.alternatives)}
                  badge={<span className="whitespace-nowrap rounded bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-ink-3">{k.kind}</span>}
                />
              )
            })}
          </div>

          <SectionTitle>Distribuição de todas as alternativas</SectionTitle>
          <div className={grid2}>
            <QuestionCard qid="q2_compreensao" title="Compreensão declarada da relação DH × misoginia" showGroups />
            <QuestionCard qid="q2_violacao" title="Discriminação e violência de gênero como violação de direitos" showGroups />
            <QuestionCard qid="q2_identificar" title="Capacidade declarada de identificar situações" showGroups />
            <QuestionCard qid="q2_percepcao" title="Mudança de percepção relatada" showGroups />
            <QuestionCard qid="q2_importancia" title="Importância atribuída à educação em Direitos Humanos" showGroups className="xl:col-span-2" />
          </div>

          <SectionTitle description="Distribuição das respostas do Questionário 02 segundo o perfil.">Cruzamentos por perfil</SectionTitle>
          <div className="mb-3 max-w-md">
            <SelectField label="Pergunta" value={crossQ} onChange={(v) => setCrossQ(v as QuestionId)} options={Q2.map((id) => ({ value: id, label: `${q(id).columnLetter}. ${q(id).short}` }))} />
          </div>
          <CrossByDimension key={crossQ} qid={crossQ} />
        </SampleGuard>
      </ScopeGate>
    </>
  )
}

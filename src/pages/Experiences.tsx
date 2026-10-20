import { useAnalysis } from '../state/AppState'
import { shareOf, shareOfGroup } from '../stats/stats'
import { indicatorRule } from '../stats/indicators'
import { QuestionCard } from '../components/analysis/QuestionCard'
import { CrossByDimension } from '../components/analysis/CrossByDimension'
import { KpiCard } from '../components/analysis/KpiCard'
import { Notice, PageHeader, SectionTitle } from '../components/common/ui'
import { SampleGuard, ScopeGate } from './common'

export function Experiences() {
  const { q, filtered } = useAnalysis()
  const question = q('q1_presenciou')
  const alts = (g: string) => question.alternatives.filter((a) => a.group === g).map((a) => a.label)
  const kpi = (label: string, labels: string[]) => {
    const s = shareOf(filtered, question.id, labels)
    return <KpiCard key={label} label={label} value={s.pct} count={s.count} denominator={s.valid} rule={indicatorRule(labels)} />
  }
  const pres = shareOfGroup(filtered, question, 'presenciou')

  return (
    <>
      <PageHeader
        eyebrow="Questionário 01"
        title="Experiências relatadas"
        description="Respostas à pergunta sobre ter presenciado alguma situação considerada violência ou discriminação relacionada ao gênero."
      />
      <ScopeGate scope="q1">
        <SampleGuard>
          <div className="mb-5">
            <Notice tone="warn" title="Percepções relatadas, não incidência">
              Estes dados representam experiências e percepções relatadas pelos participantes. Não constituem medida direta da incidência de violência ou discriminação nas escolas: a mesma situação pode ter sido presenciada por vários participantes, e a classificação de uma situação depende da percepção de quem responde. A planilha não contém relatos em texto livre; nenhuma resposta individual é exibida.
            </Notice>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpi('Relatam ter presenciado (pessoalmente ou envolvendo outra pessoa)', alts('presenciou'))}
            {kpi('Ouviram relatos, sem presenciar', alts('relatos'))}
            {kpi('Afirmam nunca ter presenciado', alts('nunca'))}
            {kpi('Não têm certeza de como classificar a situação', alts('incerteza'))}
          </div>
          <p className="mt-2 text-xs text-ink-3">
            O primeiro indicador soma {pres.count} resposta(s): “Sim, presenciei pessoalmente.” e “Sim, presenciei envolvendo outra pessoa.”, que continuam separadas no gráfico abaixo.
          </p>

          <SectionTitle>Distribuição das alternativas</SectionTitle>
          <QuestionCard qid="q1_presenciou" showGroups />

          <SectionTitle description="Comparação descritiva entre grupos; com poucos participantes por grupo, as diferenças devem ser lidas com cautela.">Cruzamentos por série e faixa etária</SectionTitle>
          <CrossByDimension qid="q1_presenciou" dims={['ano', 'idade', 'genero']} />
        </SampleGuard>
      </ScopeGate>
    </>
  )
}

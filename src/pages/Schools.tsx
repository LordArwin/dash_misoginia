import { useState } from 'react'
import { useAnalysis } from '../state/AppState'
import { QUESTIONNAIRE_LABEL, type QuestionId } from '../data/schema'
import { computeIndicator, indicatorRule, INDICATORS, type IndicatorId } from '../stats/indicators'
import { buildInsights, SMALL_SAMPLE } from '../stats/insights'
import { nesting, pct } from '../stats/stats'
import { formatInt, formatPct, formatPP } from '../stats/format'
import { KpiCard, QBadge } from '../components/analysis/KpiCard'
import { CrossByDimension } from '../components/analysis/CrossByDimension'
import { Card, ChartCard, Notice, PageHeader, SectionTitle, Segmented, SelectField } from '../components/common/ui'
import { heatColor } from '../components/charts/colors'
import { SampleGuard } from './common'
import type { CsvValue } from '../utils/csv'

const Q1_INDICATORS: IndicatorId[] = ['conheceMisoginia', 'conheceDH', 'sabeRelacao', 'percebeTratamento', 'percebeEspacos', 'percebeSilenciamento', 'igualdadeTotal', 'presenciou']
const Q2_INDICATORS: IndicatorId[] = ['compreendeMelhor', 'concordaViolacao', 'identifica', 'dificuldade', 'mudouPercepcao', 'importante']

export function Schools() {
  const { dataset, filtered, q, filters } = useAnalysis()
  const escola = q('escola')
  const [profileDim, setProfileDim] = useState<QuestionId>('ano')
  const [distQ, setDistQ] = useState<QuestionId>('q1_misoginia')

  const showQ1 = filters.questionnaire !== 'q2'
  const showQ2 = filters.questionnaire !== 'q1'
  const schools = escola.alternatives
    .map((a) => ({ name: a.label, ps: filtered.filter((p) => p.answers.escola === a.label) }))
    .filter((s) => s.ps.length > 0)
  const noSchool = filtered.filter((p) => p.answers.escola === null).length

  const anoNest = nesting(filtered, escola, q('ano'))
  const idadeNest = nesting(filtered, escola, q('idade'))

  const indicatorIds = [...(showQ1 ? Q1_INDICATORS : []), ...(showQ2 ? Q2_INDICATORS : [])]
  const table = indicatorIds.map((id) => {
    const def = INDICATORS[id]
    const cells = schools.map((s) => computeIndicator(dataset, s.ps, def))
    const valid = cells.filter((c) => c.valid > 0)
    const hi = valid.length ? Math.max(...valid.map((c) => c.pct)) : 0
    const lo = valid.length ? Math.min(...valid.map((c) => c.pct)) : 0
    // Com duas escolas: diferença com sinal (1ª − 2ª); com mais: amplitude (maior − menor).
    const diff = valid.length < 2 ? null : schools.length === 2 ? cells[0].pct - cells[1].pct : hi - lo
    return { id, def, cells, diff, q: q(def.questionId) }
  })

  const csv: CsvValue[][] = [
    ['Questionário', 'Indicador', ...schools.flatMap((s) => [`${s.name} — quantidade`, `${s.name} — respostas válidas`, `${s.name} — %`]), schools.length === 2 ? `Diferença (${schools[0].name} − ${schools[1].name}, p.p.)` : 'Amplitude (p.p.)', 'Regra'],
    ...table.map((r) => [QUESTIONNAIRE_LABEL[r.q.questionnaire], r.def.label, ...r.cells.flatMap((c) => [c.count, c.valid, c.pct]), r.diff, indicatorRule(r.cells[0]?.alternatives ?? [])]),
  ]

  const distOptions = dataset.questions
    .filter((x) => x.questionnaire !== 'perfil' && x.colIndex !== null && (filters.questionnaire === 'todos' || x.questionnaire === filters.questionnaire))
    .map((x) => ({ value: x.id, label: `${x.columnLetter}. ${x.short}`, group: QUESTIONNAIRE_LABEL[x.questionnaire] }))
  const distCurrent = distOptions.some((o) => o.value === distQ) ? distQ : (distOptions[0]?.value as QuestionId)

  return (
    <>
      <PageHeader
        eyebrow="Comparação"
        title="Comparação entre escolas"
        description="Perfil, indicadores-chave e distribuição das respostas em cada escola. Os percentuais usam como denominador as respostas válidas da escola no recorte filtrado."
      />
      <SampleGuard>
        {schools.length < 2 ? (
          <Notice title="Apenas uma escola no recorte atual">
            {schools.length === 1 ? `Todos os participantes do recorte são da escola “${schools[0].name}”.` : 'Nenhum participante do recorte tem escola informada.'} Remova o filtro de escola (ou outros filtros) para comparar as escolas.
          </Notice>
        ) : (
          <>
            {(anoNest.nested || idadeNest.nested) && (
              <div className="mb-5">
                <Notice tone="warn" title="Escola e série escolar estão sobrepostas">
                  Nenhuma série escolar se repete entre as escolas:{' '}
                  {anoNest.byOuter.map((x, i) => (
                    <span key={x.outer}>{i > 0 && '; '}<strong>{x.outer}</strong> — {x.inner.join(', ')}</span>
                  ))}
                  . {idadeNest.nested ? 'O mesmo ocorre com as faixas etárias. ' : 'As faixas etárias também são bem diferentes entre as escolas. '}
                  Por isso, qualquer diferença entre escolas é também uma diferença entre séries e idades: não é possível separar o efeito da escola do efeito da série. Leia as comparações como descrição de duas turmas distintas, e não como avaliação das escolas.
                </Notice>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {schools.map((s) => (
                <KpiCard
                  key={s.name}
                  label={s.name}
                  value={formatInt(s.ps.length)}
                  denominatorLabel={`participantes · ${formatPct(pct(s.ps.length, filtered.length))} do recorte`}
                  badge={<QBadge q="perfil" />}
                />
              ))}
            </div>
            {noSchool > 0 && <p className="mt-2 text-xs text-ink-3">{formatInt(noSchool)} participante(s) sem escola informada não aparecem nas comparações.</p>}

            <SectionTitle description="Cada barra mostra a composição de uma escola (100% dos participantes da escola com a informação).">Perfil dos participantes por escola</SectionTitle>
            <div className="mb-3">
              <Segmented
                label="Característica"
                value={profileDim}
                onChange={setProfileDim}
                options={(['ano', 'idade', 'genero'] as QuestionId[]).map((d) => ({ value: d, label: q(d).short.replace(' declarado', '') }))}
              />
            </div>
            <CrossByDimension key={`perfil-${profileDim}`} qid={profileDim} dims={['escola']} />

            <SectionTitle description="Cada indicador é a proporção de um grupo de alternativas documentado sobre as respostas válidas da escola. A última coluna é a diferença entre as escolas em pontos percentuais.">
              Indicadores-chave por escola
            </SectionTitle>
            <ChartCard
              title="Indicadores por escola"
              meta={`${schools.map((s) => `${s.name}: ${formatInt(s.ps.length)}`).join(' · ')} participantes`}
              alt={`Tabela de indicadores por escola. ${table.map((r) => `${r.def.label}: ${r.cells.map((c, i) => `${schools[i].name} ${formatPct(c.pct)}`).join(', ')}`).join('; ')}`}
              csv={{ name: 'indicadores-por-escola', rows: csv }}
              footnote={
                <>
                  Comparação descritiva; com amostras pequenas, diferenças de poucos participantes mudam muito os percentuais. Células com menos de {SMALL_SAMPLE} respostas válidas aparecem com borda tracejada. Passe o mouse sobre um indicador para ver a regra de cálculo.
                </>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0.5 text-xs">
                  <thead>
                    <tr>
                      <th scope="col" className="p-2 text-left font-medium text-ink-3">Indicador</th>
                      {schools.map((s) => (
                        <th key={s.name} scope="col" className="min-w-28 p-2 text-right font-medium text-ink-2">{s.name}</th>
                      ))}
                      <th scope="col" className="min-w-24 p-2 text-right font-medium text-ink-3">
                        {schools.length === 2 ? `Diferença (${schools[0].name} − ${schools[1].name})` : 'Amplitude'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((r) => (
                      <tr key={r.id}>
                        <th scope="row" className="p-2 text-left font-medium text-ink" title={indicatorRule(r.cells[0]?.alternatives ?? [])}>
                          <span className="mr-1.5 inline-block align-middle"><QBadge q={r.q.questionnaire} /></span>
                          {r.def.label}
                        </th>
                        {r.cells.map((c, i) => {
                          const { bg, fg } = heatColor(c.pct / 100)
                          const small = c.valid > 0 && c.valid < SMALL_SAMPLE
                          return (
                            <td key={schools[i].name} className={`tabular rounded p-2 text-right ${small ? 'outline-1 outline-dashed outline-ochre-700' : ''}`} style={{ background: bg, color: fg }}>
                              <span className="block font-semibold">{c.valid ? formatPct(c.pct) : '—'}</span>
                              <span className="block opacity-80">{formatInt(c.count)} de {formatInt(c.valid)}</span>
                            </td>
                          )
                        })}
                        <td className="tabular p-2 text-right font-semibold text-ink">{r.diff === null ? '—' : formatPP(r.diff)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>

            <SectionTitle description="Distribuição completa das alternativas de qualquer pergunta, separada por escola (barras empilhadas 100%).">Respostas por escola</SectionTitle>
            {distCurrent && (
              <>
                <div className="mb-3 max-w-xl">
                  <SelectField label="Pergunta" value={distCurrent} onChange={(v) => setDistQ(v as QuestionId)} options={distOptions} />
                </div>
                <CrossByDimension key={`dist-${distCurrent}`} qid={distCurrent} dims={['escola']} />
              </>
            )}

            <SectionTitle description="Os mesmos achados da Visão geral, calculados separadamente para cada escola, com as mesmas regras.">Achados por escola</SectionTitle>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {schools.map((s) => {
                const ins = buildInsights(dataset, s.ps).filter(
                  (i) => (showQ1 || !['conhecimento-misoginia', 'percepcao-desigualdade', 'experiencias', 'relacao-antes-depois'].includes(i.id)) && (showQ2 || !['mudanca-percepcao', 'relacao-antes-depois'].includes(i.id)),
                )
                return (
                  <Card key={s.name} className="p-4 sm:p-5">
                    <h3 className="text-[15px] font-semibold text-ink">{s.name} <span className="text-xs font-normal text-ink-3">· {formatInt(s.ps.length)} participantes</span></h3>
                    <ol className="mt-3 space-y-3">
                      {ins.map((x) => (
                        <li key={x.id}>
                          <p className="text-sm font-semibold text-ink">{x.title}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-ink-2">{x.text}</p>
                          <p className="mt-1 text-[11px] text-ink-3">Base: {formatInt(x.n)} respostas válidas.</p>
                        </li>
                      ))}
                      {ins.length === 0 && <p className="text-sm text-ink-3">Sem dados suficientes para gerar achados.</p>}
                    </ol>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </SampleGuard>
    </>
  )
}

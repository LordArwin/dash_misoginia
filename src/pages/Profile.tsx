import { useAnalysis } from '../state/AppState'
import { crosstab } from '../stats/stats'
import { formatInt } from '../stats/format'
import { QuestionCard } from '../components/analysis/QuestionCard'
import { ChartCard, Notice, PageHeader, SectionTitle } from '../components/common/ui'
import { HeatmapTable } from '../components/charts/HeatmapTable'
import { SampleGuard } from './common'

export function Profile() {
  const { q, filtered, profileDims, dataset } = useAnalysis()
  const ct = crosstab(filtered, q('idade'), q('ano'))
  const ctEscola = crosstab(filtered, q('escola'), q('ano'))
  const constant = dataset.questions.filter((x) => x.questionnaire === 'perfil' && x.colIndex !== null && !profileDims.includes(x.id))

  return (
    <>
      <PageHeader
        eyebrow="Amostra"
        title="Perfil dos participantes"
        description="Composição da amostra por escola, faixa etária, gênero declarado e ano escolar. Clique em uma barra para filtrar todas as páginas por essa categoria."
      />
      <SampleGuard>
        <div className="mb-5">
          <Notice title="Categorias presentes no arquivo">
            O arquivo contém apenas as categorias exibidas abaixo. Não há respostas “Prefiro não responder” nem outras identidades de gênero registradas na planilha; por isso essas opções não aparecem nos gráficos nem nos filtros. A série “Outro” aparece assim na planilha, sem especificação.
            {constant.length > 0 && ` ${constant.map((c) => `“${c.short}” possui um único valor (${c.alternatives.map((a) => a.label).join(', ')}) e não é oferecido como filtro.`).join(' ')}`}
          </Notice>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {profileDims.includes('escola') && <QuestionCard qid="escola" title="Participantes por escola" />}
          <QuestionCard qid="idade" title="Participantes por faixa etária" />
          <QuestionCard qid="genero" title="Participantes por gênero declarado" />
          <QuestionCard qid="ano" title="Participantes por ano/série escolar" />
        </div>
        {profileDims.includes('escola') && (
          <>
            <SectionTitle description="Quantidade de participantes de cada série escolar em cada escola. Quando as séries não se repetem entre escolas, diferenças entre escolas e entre séries se confundem.">Matriz de escola por série escolar</SectionTitle>
            <ChartCard
              title="Escola × ano escolar"
              meta={`${formatInt(ctEscola.n)} participante(s) com as duas informações`}
              alt={`Tabela de contingência escola por ano escolar: ${ctEscola.rowLabels.map((r, i) => `${r}: ${ctEscola.colLabels.map((c, j) => `${c} ${ctEscola.counts[i][j]}`).join(', ')}`).join('; ')}`}
              csv={{ name: 'escola-por-ano', rows: [['Escola', ...ctEscola.colLabels, 'Total'], ...ctEscola.rowLabels.map((r, i) => [r, ...ctEscola.counts[i], ctEscola.rowTotals[i]]), ['Total', ...ctEscola.colTotals, ctEscola.n]] }}
            >
              <HeatmapTable ct={ctEscola} mode="count" rowTitle="Escola" colTitle="Ano escolar" />
            </ChartCard>
          </>
        )}
        <SectionTitle description="Quantidade de participantes em cada combinação de faixa etária e ano escolar.">Matriz de faixa etária por série escolar</SectionTitle>
        <ChartCard
          title="Faixa etária × ano escolar"
          meta={`${formatInt(ct.n)} participante(s) com as duas informações`}
          alt={`Tabela de contingência faixa etária por ano escolar: ${ct.rowLabels.map((r, i) => `${r}: ${ct.colLabels.map((c, j) => `${c} ${ct.counts[i][j]}`).join(', ')}`).join('; ')}`}
          csv={{ name: 'faixa-etaria-por-ano', rows: [['Faixa etária', ...ct.colLabels, 'Total'], ...ct.rowLabels.map((r, i) => [r, ...ct.counts[i], ct.rowTotals[i]]), ['Total', ...ct.colTotals, ct.n]] }}
        >
          <HeatmapTable ct={ct} mode="total" rowTitle="Faixa etária" colTitle="Ano escolar" />
        </ChartCard>
      </SampleGuard>
    </>
  )
}

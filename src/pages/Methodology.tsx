import { useRef, useState, type ReactNode } from 'react'
import { FileUp, RotateCcw } from 'lucide-react'
import { useAnalysis } from '../state/AppState'
import { useData } from '../state/AppState'
import { QUESTIONNAIRE_LABEL } from '../data/schema'
import { frequency } from '../stats/stats'
import { formatDateTime, formatInt } from '../stats/format'
import { Badge, Card, Notice, PageHeader, SectionTitle } from '../components/common/ui'
import type { Severity } from '../data/normalize'

const SEV: Record<Severity, { tone: 'warn' | 'neutral' | 'navy'; label: string }> = {
  erro: { tone: 'warn', label: 'Erro' },
  aviso: { tone: 'warn', label: 'Aviso' },
  info: { tone: 'neutral', label: 'Informação' },
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-4 sm:p-5">
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-2">{children}</div>
    </Card>
  )
}

/** Mostra espaços invisíveis da grafia original. */
const showSpaces = (s: string) => s.replace(/ /g, '·')

export function Methodology() {
  const { dataset, all } = useAnalysis()
  const { state, loadLocalFile, reload } = useData()
  const input = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  if (state.status !== 'ready') return null
  const { source } = dataset
  const qs = dataset.questions.filter((x) => x.colIndex !== null)
  const q1 = qs.filter((x) => x.questionnaire === 'q1')
  const q2 = qs.filter((x) => x.questionnaire === 'q2')
  const validAnswers = (list: typeof qs) => list.reduce((s, x) => s + frequency(all, x).valid, 0)
  const sorted = [...dataset.issues].sort((a, b) => ['erro', 'aviso', 'info'].indexOf(a.severity) - ['erro', 'aviso', 'info'].indexOf(b.severity))

  return (
    <>
      <PageHeader
        eyebrow="Transparência"
        title="Metodologia e qualidade dos dados"
        description="Como a planilha foi lida, quais regras de tratamento foram aplicadas e quais limitações devem ser consideradas na interpretação."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Block title="Descrição da pesquisa e dos questionários">
          <p>A pesquisa investiga percepções e conhecimentos de estudantes sobre misoginia e Direitos Humanos, e a avaliação que fazem de uma apresentação educativa sobre o tema.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Perfil</strong> (colunas A–C e R): faixa etária, gênero declarado, ano escolar e escola.</li>
            <li><strong>Questionário 01</strong> (colunas {q1[0]?.columnLetter}–{q1.at(-1)?.columnLetter}, {q1.length} perguntas): diagnóstico inicial — conhecimento sobre misoginia e Direitos Humanos, percepções sobre desigualdade de gênero e experiências relatadas.</li>
            <li><strong>Questionário 02</strong> (colunas {q2[0]?.columnLetter}–{q2.at(-1)?.columnLetter}, {q2.length} perguntas): avaliação após a apresentação — compreensão, reconhecimento de violações de direitos, identificação de situações, importância da educação em DH e mudança de percepção.</li>
          </ul>
          <p>Todas as perguntas são de escolha única. A coluna “Escola” aparece após o Q2 na planilha, mas é um dado de perfil e não integra o questionário.</p>
        </Block>

        <Block title="Fonte e importação">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
            <dt className="text-ink-3">Arquivo</dt><dd className="text-ink">{source.fileName} <span className="text-ink-3">({state.origin})</span></dd>
            <dt className="text-ink-3">Aba utilizada</dt><dd className="text-ink">{source.sheetName} {source.sheetNames.length > 1 && <span className="text-ink-3">de {source.sheetNames.length} abas</span>}</dd>
            <dt className="text-ink-3">Intervalo</dt><dd className="text-ink tabular">{source.range} · cabeçalho na linha {source.headerRow}</dd>
            <dt className="text-ink-3">Registros</dt><dd className="text-ink tabular">{formatInt(source.dataRows)} participantes · {formatInt(source.columns)} colunas{source.emptyRowsSkipped ? ` · ${source.emptyRowsSkipped} linha(s) vazia(s) ignorada(s)` : ''}</dd>
            <dt className="text-ink-3">Importado em</dt><dd className="text-ink">{formatDateTime(state.loadedAt)}</dd>
            {state.manifest?.committedAt && (<><dt className="text-ink-3">Último commit do arquivo</dt><dd className="text-ink">{formatDateTime(state.manifest.committedAt)}</dd></>)}
            {state.manifest && !state.manifest.committedAt && (<><dt className="text-ink-3">Arquivo modificado em</dt><dd className="text-ink">{formatDateTime(state.manifest.fileModifiedAt)}</dd></>)}
            {state.origin === 'arquivo local' && (<><dt className="text-ink-3">Arquivo modificado em</dt><dd className="text-ink">{formatDateTime(state.lastModified)}</dd></>)}
            {state.manifest && (<><dt className="text-ink-3">Build dos dados</dt><dd className="text-ink">{formatDateTime(state.manifest.syncedAt)}</dd><dt className="text-ink-3">SHA-256</dt><dd className="break-all font-mono text-[11px] text-ink-2">{state.manifest.sha256}</dd></>)}
          </dl>
          <div className="no-print mt-3 flex flex-wrap gap-2">
            <input
              ref={input}
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              aria-label="Selecionar planilha"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                try {
                  setUploadError(null)
                  await loadLocalFile(f)
                } catch (err) {
                  setUploadError(err instanceof Error ? err.message : String(err))
                } finally {
                  e.target.value = ''
                }
              }}
            />
            <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-2 hover:border-navy-700">
              <FileUp size={14} aria-hidden /> Analisar outra planilha (local)
            </button>
            {state.origin === 'arquivo local' && (
              <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-2 hover:border-navy-700">
                <RotateCcw size={14} aria-hidden /> Voltar à planilha publicada
              </button>
            )}
          </div>
          <p className="text-xs text-ink-3">Uma planilha local é processada apenas neste navegador e não é enviada nem publicada. Para atualizar o painel publicado, substitua o arquivo na raiz do repositório.</p>
          {uploadError && <Notice tone="error">{uploadError}</Notice>}
        </Block>

        <Block title="Participantes e respostas">
          <p>Cada linha da planilha representa um participante, com as respostas aos dois questionários. Como as perguntas são de escolha única, o número de respostas válidas de uma pergunta é igual ao número de participantes que a responderam.</p>
          <ul className="list-disc space-y-1 pl-5 tabular">
            <li>Participantes distintos: <strong>{formatInt(all.length)}</strong> (identificadores P01–P{String(all.length).padStart(2, '0')} gerados na importação).</li>
            <li>Respostas válidas no Q1: <strong>{formatInt(validAnswers(q1))}</strong> ({q1.length} perguntas × participantes).</li>
            <li>Respostas válidas no Q2: <strong>{formatInt(validAnswers(q2))}</strong> ({q2.length} perguntas × participantes).</li>
          </ul>
          <p>Os cartões e gráficos informam sempre o denominador: “respostas válidas” da pergunta no recorte filtrado; nas tabelas de contingência, participantes com resposta válida nas duas variáveis.</p>
        </Block>

        <Block title="Relacionamento entre os dois questionários">
          <p>Não há coluna de identificação na planilha. Conforme a organização do arquivo, as respostas do Q1 e do Q2 de um mesmo participante estão na mesma linha; esse vínculo é usado nos cruzamentos individuais (página Cruzamentos).</p>
          <p>O Q1 e o Q2 contêm perguntas diferentes (não há a mesma pergunta aplicada antes e depois). Logo, comparações entre eles são descritivas e não constituem medida de mudança pré/pós.</p>
        </Block>

        <Block title="Regras de tratamento">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Dados originais preservados:</strong> a planilha não é alterada; a normalização ocorre em camada separada, no navegador.</li>
            <li><strong>Normalização textual:</strong> remoção de espaços no início, no fim e repetidos, e unificação Unicode. O texto das perguntas e alternativas é mantido.</li>
            <li><strong>Associação de colunas:</strong> pelo texto do cabeçalho (posição da coluna usada só como alternativa, com aviso).</li>
            <li><strong>Valores ausentes:</strong> células vazias são “ausentes”, ficam fora do denominador e são informadas. Ausência nunca é tratada como resposta negativa.</li>
            <li><strong>Categorias preservadas:</strong> “Não sei responder”, “Nunca pensei sobre isso”, “Não tenho certeza” etc. permanecem no denominador.</li>
            <li><strong>Sem pontuação composta:</strong> não há escala numérica, pesos ou índice geral de conhecimento.</li>
            <li><strong>Arredondamento:</strong> percentuais com uma casa decimal; somas podem diferir de 100% por arredondamento.</li>
            <li><strong>Alternativas não previstas:</strong> mantidas como categoria própria e listadas na tabela de qualidade.</li>
          </ul>
        </Block>

        <Block title="Limitações">
          <ul className="list-disc space-y-1 pl-5">
            <li>Amostra pequena ({formatInt(all.length)} participantes) e de uma única escola; resultados não são generalizáveis e recortes por grupo ficam rapidamente instáveis.</li>
            <li>Grupos desbalanceados (ex.: 2º ano e 16–18 anos com poucos participantes).</li>
            <li>Sem grupo de controle nem pré/pós com as mesmas perguntas: não é possível atribuir causalidade à apresentação.</li>
            <li>Todas as medidas são autorrelatadas (conhecimento, compreensão e capacidade declarados), sujeitas a desejabilidade social.</li>
            <li>Experiências relatadas não medem a incidência de violência nas escolas.</li>
            <li>O formulário original não foi fornecido: o catálogo contém somente as alternativas observadas. Alternativas que existiam no formulário mas não foram escolhidas (ex.: “Prefiro não responder”) não aparecem com zero.</li>
          </ul>
        </Block>
      </div>

      <SectionTitle description="Agrupamentos usados apenas em cartões e quadros-síntese. Os gráficos de distribuição sempre mostram todas as alternativas originais.">Critérios de agrupamento das alternativas</SectionTitle>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-xs">
          <thead className="bg-canvas text-ink-3">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Col.</th>
              <th scope="col" className="px-3 py-2 font-medium">Pergunta</th>
              <th scope="col" className="px-3 py-2 font-medium">Grupo analítico</th>
              <th scope="col" className="px-3 py-2 font-medium">Alternativas incluídas</th>
            </tr>
          </thead>
          <tbody>
            {qs.filter((x) => x.questionnaire !== 'perfil').flatMap((x) =>
              x.groups.map((g, gi) => (
                <tr key={`${x.id}-${g.id}`} className={gi === 0 ? 'border-t border-line' : ''}>
                  {gi === 0 && <td rowSpan={x.groups.length} className="px-3 py-2 align-top font-semibold text-ink">{x.columnLetter}</td>}
                  {gi === 0 && <td rowSpan={x.groups.length} className="max-w-xs px-3 py-2 align-top text-ink">{x.short}<span className="block text-ink-3">{x.groupKind}</span></td>}
                  <td className="px-3 py-1.5 text-ink-2">{g.label}</td>
                  <td className="px-3 py-1.5 text-ink-2">{x.alternatives.filter((a) => a.group === g.id).map((a) => `“${a.label}”`).join(' + ') || '—'}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </Card>

      <SectionTitle description="Colunas identificadas na planilha e totais por pergunta (sem filtros).">Estrutura encontrada</SectionTitle>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-xs">
          <thead className="bg-canvas text-ink-3">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Col.</th>
              <th scope="col" className="px-3 py-2 font-medium">Bloco</th>
              <th scope="col" className="px-3 py-2 font-medium">Cabeçalho original</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Válidas</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Ausentes</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Alternativas</th>
              <th scope="col" className="px-3 py-2 font-medium">Associação</th>
            </tr>
          </thead>
          <tbody>
            {dataset.questions.slice().sort((a, b) => (a.colIndex ?? 99) - (b.colIndex ?? 99)).map((x) => {
              const f = frequency(all, x)
              return (
                <tr key={x.id} className="border-t border-line">
                  <td className="px-3 py-2 font-semibold">{x.columnLetter ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2">{QUESTIONNAIRE_LABEL[x.questionnaire]}</td>
                  <td className="max-w-md px-3 py-2 text-ink-2">{x.headerFound ?? x.header}</td>
                  <td className="tabular px-3 py-2 text-right">{formatInt(f.valid)}</td>
                  <td className="tabular px-3 py-2 text-right">{formatInt(f.missing)}</td>
                  <td className="tabular px-3 py-2 text-right">{x.alternatives.length}</td>
                  <td className="px-3 py-2">{x.matchedBy}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <SectionTitle description="Alertas gerados automaticamente na importação.">Tabela de qualidade dos dados</SectionTitle>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-xs">
          <thead className="bg-canvas text-ink-3">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Nível</th>
              <th scope="col" className="px-3 py-2 font-medium">Tipo</th>
              <th scope="col" className="px-3 py-2 font-medium">Col.</th>
              <th scope="col" className="px-3 py-2 font-medium">Descrição</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Ocorrências</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((i, k) => (
              <tr key={k} className="border-t border-line">
                <td className="px-3 py-2"><Badge tone={SEV[i.severity].tone}>{SEV[i.severity].label}</Badge></td>
                <td className="whitespace-nowrap px-3 py-2">{i.kind}</td>
                <td className="px-3 py-2">{i.column ?? '—'}</td>
                <td className="px-3 py-2 text-ink-2">{i.message}</td>
                <td className="tabular px-3 py-2 text-right">{i.count ?? '—'}</td>
              </tr>
            ))}
            {['ausente', 'inesperada', 'duplicado', 'coluna'].map((kind) =>
              sorted.some((i) => i.kind === kind) ? null : (
                <tr key={kind} className="border-t border-line">
                  <td className="px-3 py-2"><Badge tone="petrol">OK</Badge></td>
                  <td className="px-3 py-2">{kind}</td>
                  <td className="px-3 py-2">—</td>
                  <td className="px-3 py-2 text-ink-2">
                    {{ ausente: 'Nenhum valor ausente encontrado.', inesperada: 'Nenhuma alternativa fora do catálogo.', duplicado: 'Nenhum par de registros com respostas idênticas em todas as colunas.', coluna: 'Todas as colunas esperadas foram encontradas pelo cabeçalho.' }[kind]}
                  </td>
                  <td className="px-3 py-2 text-right">0</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </Card>

      <details className="mt-4 rounded-lg border border-line bg-white p-4 text-xs">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Grafias originais unificadas pela normalização</summary>
        <p className="mt-2 text-ink-3">Espaços são mostrados como “·”. Apenas alternativas com espaços excedentes ou mais de uma grafia são listadas.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-ink-3">
              <tr><th className="py-1 pr-3 font-medium">Col.</th><th className="py-1 pr-3 font-medium">Alternativa normalizada</th><th className="py-1 pr-3 font-medium">Grafia na planilha</th><th className="py-1 text-right font-medium">n</th></tr>
            </thead>
            <tbody>
              {dataset.variants.flatMap((v) => {
                const qq = dataset.questions.find((x) => x.id === v.questionId)!
                return v.variants
                  .filter((a) => a.raw.some((r) => r.text !== a.label))
                  .flatMap((a) => a.raw.map((r, i) => (
                    <tr key={`${v.questionId}-${a.label}-${i}`} className="border-t border-line/70">
                      <td className="py-1 pr-3">{qq.columnLetter}</td>
                      <td className="py-1 pr-3">{i === 0 ? a.label : ''}</td>
                      <td className="py-1 pr-3 font-mono text-[11px] text-ink-2">“{showSpaces(r.text)}”</td>
                      <td className="tabular py-1 text-right">{r.count}</td>
                    </tr>
                  )))
              })}
            </tbody>
          </table>
        </div>
      </details>
    </>
  )
}

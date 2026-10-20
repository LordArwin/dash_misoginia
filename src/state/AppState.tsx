import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Manifest } from '../data/load'
import type { Dataset, Participant, ResolvedQuestion } from '../data/normalize'
import type { QuestionId } from '../data/schema'
import { applyFilters, EMPTY_FILTERS, filterableProfileDims, toggleValue, type Filters, type QuestionnaireScope } from '../stats/filters'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | {
      status: 'ready'
      dataset: Dataset
      manifest: Manifest | null
      lastModified: string | null
      loadedAt: string
      origin: 'publicado' | 'arquivo local'
    }

interface DataCtx {
  state: LoadState
  reload: () => void
  loadLocalFile: (file: File) => Promise<void>
}

const DataContext = createContext<DataCtx | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    // SheetJS é carregado sob demanda, em um bloco separado do restante da aplicação.
    import('../data/load')
      .then(({ fetchDataset }) => fetchDataset(import.meta.env.BASE_URL))
      .then(({ dataset, manifest, lastModified }) => {
        if (alive) setState({ status: 'ready', dataset, manifest, lastModified, loadedAt: new Date().toISOString(), origin: 'publicado' })
      })
      .catch((e: unknown) => {
        if (alive) setState({ status: 'error', error: e instanceof Error ? e.message : String(e) })
      })
    return () => {
      alive = false
    }
  }, [nonce])

  const loadLocalFile = useCallback(async (file: File) => {
    const [{ parseDataset }, buf] = await Promise.all([import('../data/load'), file.arrayBuffer()])
    const dataset = parseDataset(buf, file.name)
    setState({
      status: 'ready',
      dataset,
      manifest: null,
      lastModified: new Date(file.lastModified).toISOString(),
      loadedAt: new Date().toISOString(),
      origin: 'arquivo local',
    })
  }, [])

  const value = useMemo(() => ({ state, reload: () => setNonce((n) => n + 1), loadLocalFile }), [state, loadLocalFile])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataCtx {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData fora do DataProvider')
  return ctx
}

// ---------------------------------------------------------------- Filtros + UI

interface AnalysisCtx {
  dataset: Dataset
  /** Todos os participantes (sem filtro). */
  all: Participant[]
  /** Participantes após os filtros globais. */
  filtered: Participant[]
  filters: Filters
  setFilters: (f: Filters) => void
  toggle: (qid: QuestionId, value: string) => void
  setScope: (s: QuestionnaireScope) => void
  clear: () => void
  profileDims: QuestionId[]
  q: (id: QuestionId) => ResolvedQuestion
  presentation: boolean
  setPresentation: (v: boolean) => void
}

const AnalysisContext = createContext<AnalysisCtx | null>(null)

export function AnalysisProvider({ dataset, children }: { dataset: Dataset; children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [presentation, setPresentation] = useState(false)

  // Ao trocar de arquivo, filtros antigos podem não fazer sentido.
  useEffect(() => setFilters(EMPTY_FILTERS), [dataset])

  const value = useMemo<AnalysisCtx>(() => {
    const byId = new Map(dataset.questions.map((x) => [x.id, x]))
    return {
      dataset,
      all: dataset.participants,
      filtered: applyFilters(dataset.participants, filters),
      filters,
      setFilters,
      toggle: (qid, v) => setFilters((f) => toggleValue(f, qid, v)),
      setScope: (s) => setFilters((f) => ({ ...f, questionnaire: s })),
      clear: () => setFilters(EMPTY_FILTERS),
      profileDims: filterableProfileDims(dataset),
      q: (id) => byId.get(id)!,
      presentation,
      setPresentation,
    }
  }, [dataset, filters, presentation])

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
}

export function useAnalysis(): AnalysisCtx {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis fora do AnalysisProvider')
  return ctx
}

import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AnalysisProvider, DataProvider, useData } from './state/AppState'
import { Shell } from './components/layout/Shell'
import { ErrorState, LoadingState } from './components/common/ui'
import { Overview } from './pages/Overview'
import { Profile } from './pages/Profile'
import { PriorKnowledge } from './pages/PriorKnowledge'
import { Perceptions } from './pages/Perceptions'
import { Experiences } from './pages/Experiences'
import { PostEvaluation } from './pages/PostEvaluation'
import { CrossAnalysis } from './pages/CrossAnalysis'
import { Methodology } from './pages/Methodology'

function Content() {
  const { state, reload } = useData()
  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={reload} />
  if (state.dataset.participants.length === 0) return <ErrorState message="A planilha foi lida, mas não contém registros de participantes." onRetry={reload} />
  return (
    <AnalysisProvider dataset={state.dataset}>
      <Shell>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/conhecimento" element={<PriorKnowledge />} />
          <Route path="/percepcoes" element={<Perceptions />} />
          <Route path="/experiencias" element={<Experiences />} />
          <Route path="/avaliacao" element={<PostEvaluation />} />
          <Route path="/cruzamentos" element={<CrossAnalysis />} />
          <Route path="/metodologia" element={<Methodology />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </AnalysisProvider>
  )
}

// HashRouter: as rotas ficam após "#", então recarregar uma página interna
// no GitHub Pages nunca gera erro 404.
export default function App() {
  return (
    <HashRouter>
      <DataProvider>
        <Content />
      </DataProvider>
    </HashRouter>
  )
}

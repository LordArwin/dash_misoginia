import type { ReactNode } from 'react'
import { useAnalysis } from '../state/AppState'
import { QUESTIONNAIRE_LABEL } from '../data/schema'
import { EmptyState, Notice } from '../components/common/ui'
import { SMALL_SAMPLE } from '../stats/insights'
import { formatInt } from '../stats/format'

/** Bloqueia o conteúdo de um questionário quando o filtro "Questionário" seleciona o outro. */
export function ScopeGate({ scope, children }: { scope: 'q1' | 'q2'; children: ReactNode }) {
  const { filters, setScope } = useAnalysis()
  if (filters.questionnaire !== 'todos' && filters.questionnaire !== scope) {
    return (
      <EmptyState title={`Conteúdo do ${QUESTIONNAIRE_LABEL[scope]} oculto pelo filtro de questionário`}>
        <p>O filtro global está restrito ao {QUESTIONNAIRE_LABEL[filters.questionnaire]}.</p>
        <button type="button" onClick={() => setScope('todos')} className="mt-3 rounded-md bg-navy-800 px-3 py-1.5 text-sm font-medium text-white">
          Mostrar ambos os questionários
        </button>
      </EmptyState>
    )
  }
  return <>{children}</>
}

/** Mensagens padrão sobre o recorte atual (vazio ou amostra pequena). */
export function SampleGuard({ children }: { children: ReactNode }) {
  const { filtered, clear } = useAnalysis()
  if (filtered.length === 0) {
    return (
      <EmptyState>
        <p>Remova ou altere filtros para visualizar os resultados.</p>
        <button type="button" onClick={clear} className="mt-3 rounded-md bg-navy-800 px-3 py-1.5 text-sm font-medium text-white">Limpar filtros</button>
      </EmptyState>
    )
  }
  return (
    <>
      {filtered.length < SMALL_SAMPLE && (
        <div className="mb-5">
          <Notice tone="warn" title={`Recorte com apenas ${formatInt(filtered.length)} participante(s)`}>
            Cada resposta altera muito os percentuais. Use os resultados deste recorte apenas de forma exploratória.
          </Notice>
        </div>
      )}
      {children}
    </>
  )
}

export const grid2 = 'grid grid-cols-1 gap-4 xl:grid-cols-2'

import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Download, Menu, MonitorPlay, Printer, X, Minimize2 } from 'lucide-react'
import { ROUTES } from '../../pages/routes'
import { useAnalysis } from '../../state/AppState'
import { QUESTIONNAIRE_LABEL } from '../../data/schema'
import { frequency } from '../../stats/stats'
import { downloadCsv, type CsvValue } from '../../utils/csv'
import { FilterBar, ActiveFilters } from './FilterBar'
import { QBadge } from '../analysis/KpiCard'

export const TITLE = 'Misoginia e Direitos Humanos nas Escolas'
export const SUBTITLE = 'Análise das percepções, do conhecimento e dos resultados de uma ação educativa'

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-navy-950/40 lg:hidden ${open ? '' : 'hidden'}`} onClick={onClose} aria-hidden />
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy-900 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navegação principal"
      >
        <div className="flex items-start justify-between gap-2 border-b border-white/10 px-5 pb-5 pt-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7fb5c8]">Painel da pesquisa</p>
            <p className="mt-1.5 font-serif text-lg leading-snug">{TITLE}</p>
          </div>
          <button type="button" className="rounded p-1 text-white/70 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {ROUTES.map((r, i) => (
              <li key={r.path}>
                <NavLink
                  to={r.path}
                  end={r.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-white/12 font-semibold text-white shadow-[inset_3px_0_0_#7fb5c8]' : 'text-white/75 hover:bg-white/6 hover:text-white'}`
                  }
                >
                  <r.icon size={17} aria-hidden className="shrink-0 opacity-90" />
                  <span className="flex-1">
                    <span className="mr-1.5 text-[11px] tabular text-white/45">{i + 1}</span>
                    {r.label}
                  </span>
                  {(r.scope === 'q1' || r.scope === 'q2') && (
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/80">{r.scope.toUpperCase()}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="border-t border-white/10 px-5 py-4 text-[11px] leading-relaxed text-white/55">
          Dados lidos diretamente da planilha no navegador. Nenhuma informação é enviada a servidores.
        </p>
      </aside>
    </>
  )
}

function exportAll(ps: ReturnType<typeof useAnalysis>) {
  const rows: CsvValue[][] = [['Questionário', 'Coluna', 'Pergunta', 'Alternativa', 'Quantidade', '% das respostas válidas', 'Respostas válidas', 'Ausentes', 'Participantes no recorte']]
  for (const q of ps.dataset.questions) {
    if (q.colIndex === null) continue
    if (ps.filters.questionnaire !== 'todos' && q.questionnaire !== 'perfil' && q.questionnaire !== ps.filters.questionnaire) continue
    const f = frequency(ps.filtered, q)
    for (const r of f.rows) rows.push([QUESTIONNAIRE_LABEL[q.questionnaire], q.columnLetter, q.header, r.label, r.count, r.pct, f.valid, f.missing, ps.filtered.length])
  }
  const filters = Object.entries(ps.filters.values).filter(([, v]) => v && v.length).map(([k, v]) => `${k}=${v!.join('|')}`)
  rows.push([], ['Filtros aplicados', filters.length ? filters.join('; ') : 'nenhum'], ['Escopo de questionário', ps.filters.questionnaire])
  downloadCsv('dados-agregados-recorte-atual', rows)
}

export function Shell({ children }: { children: ReactNode }) {
  const analysis = useAnalysis()
  const { presentation, setPresentation } = analysis
  const [menuOpen, setMenuOpen] = useState(false)
  const loc = useLocation()
  const route = ROUTES.find((r) => r.path === loc.pathname) ?? ROUTES[0]

  useEffect(() => {
    document.title = `${route.label} · ${TITLE}`
    window.scrollTo({ top: 0 })
    document.getElementById('conteudo')?.focus({ preventScroll: true })
  }, [route])

  useEffect(() => {
    if (!presentation) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPresentation(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presentation, setPresentation])

  return (
    <div className="flex min-h-screen">
      <a href="#conteudo" className="sr-only z-[60] rounded bg-white px-3 py-2 text-sm font-semibold text-navy-900 focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus() }}>
        Pular para o conteúdo
      </a>
      {!presentation && <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="border-b border-line bg-surface">
          <div className="flex items-start gap-3 px-4 py-4 sm:px-6 lg:px-8">
            {!presentation && (
              <button type="button" className="no-print mt-1 rounded-md border border-line p-1.5 text-ink-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menu de navegação">
                <Menu size={18} />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-xl font-semibold leading-tight text-navy-900 sm:text-2xl">{TITLE}</h1>
              <p className="mt-0.5 text-sm text-ink-2">{SUBTITLE}</p>
            </div>
            <div className="no-print flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <HeaderButton onClick={() => exportAll(analysis)} icon={<Download size={15} />} label="CSV do recorte" />
              <HeaderButton onClick={() => window.print()} icon={<Printer size={15} />} label="Imprimir / PDF" />
              <HeaderButton
                onClick={() => setPresentation(!presentation)}
                icon={presentation ? <Minimize2 size={15} /> : <MonitorPlay size={15} />}
                label={presentation ? 'Sair da apresentação' : 'Modo apresentação'}
                pressed={presentation}
              />
            </div>
          </div>
          {presentation && (
            <nav className="no-print flex gap-1 overflow-x-auto border-t border-line px-4 py-2 sm:px-6 lg:px-8" aria-label="Páginas">
              {ROUTES.map((r, i) => (
                <NavLink key={r.path} to={r.path} end={r.path === '/'} className={({ isActive }) => `whitespace-nowrap rounded px-2.5 py-1 text-xs ${isActive ? 'bg-navy-800 text-white' : 'text-ink-2 hover:bg-navy-100'}`}>
                  {i + 1}. {r.label}
                </NavLink>
              ))}
            </nav>
          )}
        </header>
        {presentation ? (
          <div className="no-print px-4 sm:px-6 lg:px-8"><ActiveFilters readOnly /></div>
        ) : (
          <div className="sticky top-0 z-30"><FilterBar /></div>
        )}
        <div className="hidden print:block print:px-0 print:pt-2">
          <p className="text-xs text-ink-3">{route.label} · {analysis.filtered.length} de {analysis.all.length} participantes no recorte</p>
          <ActiveFilters readOnly />
        </div>
        <main id="conteudo" tabIndex={-1} className={`print-full mx-auto px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8 ${presentation ? 'max-w-[1500px] text-[15px]' : 'max-w-[1400px]'}`}>
          <div className="mb-4 flex items-center gap-2 text-xs text-ink-3">
            <span>Página {ROUTES.indexOf(route) + 1} de {ROUTES.length}</span>
            {route.scope !== 'ambos' && <QBadge q={route.scope === 'perfil' ? 'perfil' : route.scope} />}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

function HeaderButton({ onClick, icon, label, pressed }: { onClick: () => void; icon: ReactNode; label: string; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${pressed ? 'border-navy-800 bg-navy-800 text-white' : 'border-line-strong bg-white text-ink-2 hover:border-navy-700 hover:text-navy-900'}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

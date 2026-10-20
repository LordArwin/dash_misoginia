import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  label: string
  options: { value: string; label: string; count?: number }[]
  selected: string[]
  onToggle: (v: string) => void
  onClear?: () => void
  children?: ReactNode
  wide?: boolean
}

/** Botão com painel de caixas de seleção (fecha com Esc ou clique fora). */
export function MultiSelect({ label, options, selected, onToggle, onClear, children, wide }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btn.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const summary = selected.length === 0 ? 'Todos' : selected.length === 1 ? selected[0] : `${selected.length} selecionados`

  return (
    <div ref={ref} className="relative">
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={`flex max-w-64 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors ${selected.length ? 'border-petrol-600 bg-petrol-50 text-petrol-800' : 'border-line-strong bg-white text-ink-2 hover:border-navy-700'}`}
      >
        <span className="font-semibold text-ink">{label}:</span>
        <span className="truncate">{summary}</span>
        <ChevronDown size={14} aria-hidden className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div id={id} role="group" aria-label={label} className={`absolute left-0 z-40 mt-1 rounded-lg border border-line bg-white p-2 shadow-lg ${wide ? 'w-[min(92vw,26rem)]' : 'w-64 max-w-[92vw]'}`}>
          {children}
          <ul className="max-h-72 space-y-0.5 overflow-y-auto">
            {options.map((o) => (
              <li key={o.value}>
                <label className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-xs text-ink hover:bg-canvas">
                  <input type="checkbox" className="mt-0.5 accent-[#0f5c6e]" checked={selected.includes(o.value)} onChange={() => onToggle(o.value)} />
                  <span className="flex-1">{o.label}</span>
                  {o.count !== undefined && <span className="tabular text-ink-3">{o.count}</span>}
                </label>
              </li>
            ))}
          </ul>
          {onClear && selected.length > 0 && (
            <button type="button" onClick={onClear} className="mt-1 w-full rounded px-2 py-1 text-left text-xs font-medium text-petrol-700 hover:bg-canvas">
              Limpar seleção
            </button>
          )}
        </div>
      )}
    </div>
  )
}

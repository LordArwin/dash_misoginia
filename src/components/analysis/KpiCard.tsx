import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatInt, formatPct } from '../../stats/format'
import { Badge } from '../common/ui'

interface Props {
  label: string
  /** Valor principal já formatado, ou percentual numérico. */
  value: number | string
  count?: number
  denominator?: number
  denominatorLabel?: string
  rule?: string
  badge?: ReactNode
}

export function KpiCard({ label, value, count, denominator, denominatorLabel = 'respostas válidas', rule, badge }: Props) {
  return (
    <div className="chart-card flex min-w-0 flex-col justify-between rounded-lg border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] leading-snug text-ink-2">{label}</p>
        {badge}
      </div>
      <p className="mt-3 font-serif text-[32px] font-semibold leading-none text-navy-900 tabular">
        {typeof value === 'number' ? formatPct(value) : value}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-xs text-ink-3 tabular">
          {count !== undefined && denominator !== undefined
            ? `${formatInt(count)} de ${formatInt(denominator)} ${denominatorLabel}`
            : denominatorLabel}
        </p>
        {rule && (
          <span className="group relative no-print">
            <button type="button" className="rounded p-0.5 text-ink-3 hover:text-petrol-700" aria-label={`Regra de cálculo: ${rule}`}>
              <Info size={14} aria-hidden />
            </button>
            <span role="tooltip" className="pointer-events-none absolute bottom-6 right-0 z-20 hidden w-64 rounded-md border border-line bg-white p-2 text-[11px] leading-snug text-ink-2 shadow-md group-focus-within:block group-hover:block">
              {rule}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

export function QBadge({ q }: { q: 'q1' | 'q2' | 'perfil' }) {
  return q === 'q1' ? <Badge tone="navy">Q1</Badge> : q === 'q2' ? <Badge tone="petrol">Q2</Badge> : <Badge tone="neutral">Perfil</Badge>
}

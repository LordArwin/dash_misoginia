import { useId, useState, type ReactNode } from 'react'
import { AlertTriangle, Download, Info, Table2, Loader2, CircleAlert, Inbox } from 'lucide-react'
import { downloadCsv, type CsvValue } from '../../utils/csv'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`chart-card min-w-0 rounded-lg border border-line bg-surface shadow-[0_1px_2px_rgba(12,35,64,0.04)] ${className}`}>{children}</section>
}

interface ChartCardProps {
  title: string
  subtitle?: ReactNode
  meta?: ReactNode
  csv?: { name: string; rows: CsvValue[][] }
  table?: ReactNode
  /** Descrição textual para leitores de tela. */
  alt: string
  footnote?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function ChartCard({ title, subtitle, meta, csv, table, alt, footnote, actions, children, className = '' }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false)
  const id = useId()
  return (
    <Card className={`flex flex-col p-4 sm:p-5 ${className}`}>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 id={`${id}-t`} className="text-[15px] font-semibold leading-snug text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{subtitle}</p>}
          {meta && <p className="mt-1 text-xs text-ink-3 tabular">{meta}</p>}
        </div>
        <div className="no-print flex shrink-0 items-center gap-1">
          {actions}
          {table && (
            <IconButton label={showTable ? 'Ocultar tabela de dados' : 'Ver tabela de dados'} pressed={showTable} onClick={() => setShowTable((v) => !v)}>
              <Table2 size={16} />
            </IconButton>
          )}
          {csv && (
            <IconButton label="Exportar dados agregados (CSV)" onClick={() => downloadCsv(csv.name, csv.rows)}>
              <Download size={16} />
            </IconButton>
          )}
        </div>
      </header>
      <figure role="figure" aria-labelledby={`${id}-t`} className="min-w-0">
        <div role="img" aria-label={alt}>{children}</div>
        {showTable && table && <div className="mt-4 border-t border-line pt-3">{table}</div>}
        {footnote && <figcaption className="mt-3 text-xs leading-relaxed text-ink-3">{footnote}</figcaption>}
      </figure>
    </Card>
  )
}

export function IconButton({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: ReactNode; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-ink-2 transition-colors hover:bg-navy-100 hover:text-navy-900 ${pressed ? 'border-petrol-600 bg-petrol-50 text-petrol-700' : 'border-transparent'}`}
    >
      {children}
    </button>
  )
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'error'; title?: string; children: ReactNode }) {
  const styles = {
    info: 'border-petrol-600/25 bg-petrol-50 text-petrol-800',
    warn: 'border-ochre-700/25 bg-ochre-100 text-ochre-700',
    error: 'border-alert-700/25 bg-alert-100 text-alert-700',
  }[tone]
  const Icon = tone === 'info' ? Info : tone === 'warn' ? AlertTriangle : CircleAlert
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${styles}`} role={tone === 'error' ? 'alert' : 'note'}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-3xl">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.08em] text-petrol-700">{eyebrow}</p>}
        <h2 className="mt-1 font-serif text-2xl font-semibold text-navy-900 sm:text-[28px]">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-ink-2">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function SectionTitle({ children, description }: { children: ReactNode; description?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 first:mt-0">
      <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-navy-800">{children}</h3>
      {description && <p className="mt-1 max-w-3xl text-sm text-ink-2">{description}</p>}
    </div>
  )
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; disabled?: boolean }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-md border border-line-strong bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
            const enabled = options.filter((x) => !x.disabled)
            const i = enabled.findIndex((x) => x.value === value)
            const next = enabled[(i + (e.key === 'ArrowRight' ? 1 : enabled.length - 1)) % enabled.length]
            onChange(next.value)
            const parent = e.currentTarget.parentElement
            requestAnimationFrame(() => (parent?.querySelector('[aria-checked="true"]') as HTMLElement | null)?.focus())
          }}
          tabIndex={value === o.value ? 0 : -1}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${value === o.value ? 'bg-navy-800 text-white' : 'text-ink-2 hover:bg-navy-100'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SelectField({ label, value, onChange, options, className = '' }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string; group?: string }[]; className?: string }) {
  const id = useId()
  const groups = [...new Set(options.map((o) => o.group ?? ''))]
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium text-ink-2">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-w-0 rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-sm text-ink">
        {groups.map((g) =>
          g ? (
            <optgroup key={g} label={g}>
              {options.filter((o) => o.group === g).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </optgroup>
          ) : (
            options.filter((o) => !o.group).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
          ),
        )}
      </select>
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-2" role="status" aria-live="polite">
      <Loader2 className="animate-spin text-petrol-700" size={28} aria-hidden />
      <p className="text-sm">Carregando e normalizando a planilha…</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-lg px-4">
      <Notice tone="error" title="Não foi possível carregar os dados">
        <p>{message}</p>
        <p className="mt-2">Verifique se o arquivo “Base Questionarios.xlsx” está na raiz do projeto e execute novamente o build (o script <code>sync-data</code> o copia para <code>public/data</code>).</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-3 rounded-md bg-alert-700 px-3 py-1.5 text-sm font-medium text-white">Tentar novamente</button>
        )}
      </Notice>
    </div>
  )
}

export function EmptyState({ title = 'Nenhum participante corresponde aos filtros', children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-white px-6 py-12 text-center text-ink-2">
      <Inbox size={28} className="text-ink-3" aria-hidden />
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="text-sm">{children}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'navy' }: { children: ReactNode; tone?: 'navy' | 'petrol' | 'neutral' | 'warn' }) {
  const s = {
    navy: 'bg-navy-100 text-navy-800',
    petrol: 'bg-petrol-100 text-petrol-800',
    neutral: 'bg-canvas text-ink-2 border border-line',
    warn: 'bg-ochre-100 text-ochre-700',
  }[tone]
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${s}`}>{children}</span>
}

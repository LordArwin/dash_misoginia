export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-2" aria-label="Legenda">
      {items.map((it) => (
        <li key={it.label} className="flex max-w-full items-start gap-1.5">
          <span className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: it.color }} aria-hidden />
          <span>{it.label}</span>
        </li>
      ))}
    </ul>
  )
}

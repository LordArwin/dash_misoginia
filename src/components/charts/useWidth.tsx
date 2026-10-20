import { useEffect, useRef, useState } from 'react'

/** Largura do elemento, atualizada com ResizeObserver. */
export function useWidth<T extends HTMLElement>(initial = 0) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(initial)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** Quebra um texto em linhas de até `max` caracteres, por palavras. */
export function wrapText(text: string, max: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > max) {
      lines.push(cur)
      cur = w
    } else {
      cur = cur ? `${cur} ${w}` : w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

interface TickProps {
  x?: string | number
  y?: string | number
  payload?: { value?: unknown }
}

/** Rótulo de eixo com quebra de linha (o Recharts não quebra rótulos longos). */
export function wrappedTick(maxChars: number, lineH: number) {
  return function WrappedTick(props: TickProps) {
    const x = Number(props.x ?? 0)
    const y = Number(props.y ?? 0)
    const ls = wrapText(String(props.payload?.value ?? ''), maxChars)
    const offset = ((ls.length - 1) * lineH) / 2
    return (
      <text x={x - 8} y={y - offset} textAnchor="end" fontSize={12} fill="#17212c">
        {ls.map((l, i) => (
          <tspan key={i} x={x - 8} dy={i === 0 ? 4 : lineH}>{l}</tspan>
        ))}
      </text>
    )
  }
}

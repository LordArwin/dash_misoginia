import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import type { ResolvedQuestion } from '../../data/normalize'
import type { GroupedDistribution } from '../../stats/stats'
import { formatInt, formatPct } from '../../stats/format'
import { alternativeColors, textOn } from './colors'
import { useWidth, wrappedTick } from './useWidth'
import { Legend } from './Legend'

interface Props {
  question: ResolvedQuestion
  groups: GroupedDistribution[]
  /** Grupos com n abaixo deste limite recebem aviso. */
  minN?: number
}

/** Barras empilhadas 100%: distribuição das alternativas dentro de cada grupo. */
export function StackedChart({ question, groups, minN = 5 }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const colors = alternativeColors(question)
  const alts = question.alternatives.map((a) => a.label)
  const yWidth = Math.round(Math.min(220, Math.max(110, width * 0.3)))
  const maxChars = Math.max(12, Math.floor((yWidth - 12) / 6.4))

  const data = groups.map((g) => {
    const row: Record<string, string | number> = { group: `${g.group} (n=${g.n})`, n: g.n, missing: g.missing }
    g.rows.forEach((r, i) => {
      row[`a${i}`] = r.pct
      row[`c${i}`] = r.count
    })
    return row
  })
  const rowH = 46
  const height = data.length * rowH + 36

  return (
    <div ref={ref} className="w-full min-w-0 overflow-hidden">
      {width > 0 && (<>
      <BarChart
        width={Math.max(260, width)}
        height={height}
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        barCategoryGap="24%"
        accessibilityLayer
      >
        <CartesianGrid horizontal={false} stroke="#e8ebef" />
        <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11, fill: '#6b7480' }} axisLine={{ stroke: '#cbd2da' }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="group"
          width={yWidth}
          interval={0}
          axisLine={false}
          tickLine={false}
          tick={wrappedTick(maxChars, 14)}
        />
        <Tooltip cursor={{ fill: 'rgba(15,47,79,0.06)' }} content={<StackTooltip alts={alts} colors={colors} />} />
        {alts.map((a, i) => (
          <Bar
            key={a}
            dataKey={`a${i}`}
            stackId="s"
            name={a}
            fill={colors[a]}
            stroke="#ffffff"
            strokeWidth={2}
            isAnimationActive={false}
            label={(p: { x?: string | number; y?: string | number; width?: string | number; height?: string | number; index?: number }) => {
              // Em barras empilhadas o Recharts informa o valor acumulado; usa-se o valor do segmento.
              const w = Number(p.width ?? 0)
              const v = Number(data[p.index ?? 0]?.[`a${i}`] ?? 0)
              if (w < 38 || v <= 0) return <g />
              return (
                <text x={Number(p.x) + w / 2} y={Number(p.y) + Number(p.height) / 2 + 4} textAnchor="middle" fontSize={11} fill={textOn(colors[a])} className="tabular">
                  {Math.round(v)}%
                </text>
              )
            }}
          />
        ))}
      </BarChart>
      <Legend items={alts.map((a) => ({ label: a, color: colors[a] }))} />
      {groups.some((g) => g.n < minN) && (
        <p className="mt-2 text-xs text-ochre-700">
          Grupos com menos de {minN} respostas válidas: percentuais muito sensíveis a cada resposta; interprete com cautela.
        </p>
      )}
      </>)}
    </div>
  )
}

function StackTooltip({ active, payload, alts, colors }: { active?: boolean; payload?: { payload: Record<string, string | number> }[]; alts: string[]; colors: Record<string, string> }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="max-w-sm rounded-md border border-line bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-ink">{String(row.group)}</p>
      <ul className="space-y-0.5">
        {alts.map((a, i) => (
          <li key={a} className="flex items-start gap-2">
            <span className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colors[a] }} aria-hidden />
            <span className="flex-1 text-ink-2">{a}</span>
            <span className="tabular whitespace-nowrap text-ink">
              {formatPct(Number(row[`a${i}`] ?? 0))} ({formatInt(Number(row[`c${i}`] ?? 0))})
            </span>
          </li>
        ))}
      </ul>
      {Number(row.missing) > 0 && <p className="mt-1 text-ink-3">Ausentes no grupo: {formatInt(Number(row.missing))}</p>}
    </div>
  )
}

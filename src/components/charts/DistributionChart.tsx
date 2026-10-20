import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis } from 'recharts'
import type { Frequency } from '../../stats/stats'
import { formatInt, formatPct } from '../../stats/format'
import { SINGLE_SERIES, UNCERTAIN, UNEXPECTED } from './colors'
import { useWidth, wrapText, wrappedTick } from './useWidth'

interface Props {
  freq: Frequency
  /** Alternativas selecionadas como filtro (as demais ficam esmaecidas). */
  selected?: string[]
  onToggle?: (label: string) => void
  /** Rótulos alternativos para as barras (ex.: indicadores-síntese). */
  labelOverride?: Record<string, string>
  /** Denominador por barra, quando as barras vêm de perguntas diferentes. */
  validByRow?: Record<string, number>
}

interface Datum {
  label: string
  display: string
  count: number
  pct: number
  group: string
  fill: string
  dim: boolean
  valid: number
}

const CHAR_PX = 6.4
const LINE_H = 15

/** Barras horizontais com quantidade e percentual de cada alternativa. */
export function DistributionChart({ freq, selected = [], onToggle, labelOverride, validByRow }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const yWidth = Math.round(Math.min(300, Math.max(120, width * 0.42)))
  const maxChars = Math.max(14, Math.floor((yWidth - 12) / CHAR_PX))

  const data: Datum[] = freq.rows.map((r) => ({
    label: r.label,
    display: labelOverride?.[r.label] ?? r.label,
    count: r.count,
    pct: r.pct,
    group: r.groupLabel,
    fill: !r.expected ? UNEXPECTED : r.uncertain ? UNCERTAIN : SINGLE_SERIES,
    dim: selected.length > 0 && !selected.includes(r.label),
    valid: validByRow?.[r.label] ?? freq.valid,
  }))
  const lines = data.map((d) => wrapText(d.display, maxChars).length)
  const rowH = Math.max(34, Math.max(...lines, 1) * LINE_H + 14)
  const height = data.length * rowH + 32

  return (
    <div ref={ref} className="w-full min-w-0 overflow-hidden">
      {width > 0 && (<>
      <BarChart
        width={Math.max(260, width)}
        height={height}
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 92, bottom: 4, left: 4 }}
        barCategoryGap={rowH > 40 ? '30%' : '22%'}
        accessibilityLayer
      >
        <CartesianGrid horizontal={false} stroke="#e8ebef" />
        <XAxis
          type="number"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11, fill: '#6b7480' }}
          axisLine={{ stroke: '#cbd2da' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="display"
          width={yWidth}
          interval={0}
          axisLine={false}
          tickLine={false}
          tick={wrappedTick(maxChars, LINE_H)}
        />
        <Tooltip cursor={{ fill: 'rgba(15,47,79,0.06)' }} content={<DistTooltip />} />
        <Bar
          dataKey="pct"
          radius={[0, 4, 4, 0]}
          isAnimationActive={false}
          onClick={onToggle ? (_: unknown, index: number) => onToggle(data[index].label) : undefined}
          cursor={onToggle ? 'pointer' : undefined}
          minPointSize={2}
        >
          {data.map((d) => (
            <Cell key={d.label} fill={d.fill} fillOpacity={d.dim ? 0.28 : 1} />
          ))}
          <LabelList
            dataKey="pct"
            position="right"
            content={(p) => {
              const { x, y, width: w, height: h, index } = p as { x: number; y: number; width: number; height: number; index: number }
              const d = data[index]
              return (
                <text x={Number(x) + Number(w) + 6} y={Number(y) + Number(h) / 2 + 4} fontSize={12} fill="#17212c" className="tabular">
                  <tspan fontWeight={600}>{formatPct(d.pct)}</tspan>
                  <tspan fill="#6b7480"> ({formatInt(d.count)})</tspan>
                </text>
              )
            }}
          />
        </Bar>
      </BarChart>
      </>)}
    </div>
  )
}

function DistTooltip({ active, payload }: { active?: boolean; payload?: { payload: Datum }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="max-w-xs rounded-md border border-line bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-ink">{d.display}</p>
      <p className="mt-1 tabular text-ink-2">
        {formatInt(d.count)} participante(s) · <strong className="text-ink">{formatPct(d.pct)}</strong> de {formatInt(d.valid)} respostas válidas
      </p>
      {d.group && d.group !== 'Valor' && <p className="mt-1 text-ink-3">Grupo: {d.group}</p>}
    </div>
  )
}

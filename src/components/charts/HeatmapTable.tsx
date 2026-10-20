import type { Crosstab, CrossMode } from '../../stats/stats'
import { cellValue, denominatorLabel, pct } from '../../stats/stats'
import { formatInt, formatPct } from '../../stats/format'
import { heatColor } from './colors'

interface Props {
  ct: Crosstab
  mode: CrossMode
  rowTitle: string
  colTitle: string
  caption?: string
}

/** Tabela de contingência com mapa de calor (quantidade e percentual em cada célula). */
export function HeatmapTable({ ct, mode, rowTitle, colTitle, caption }: Props) {
  const maxCount = Math.max(1, ...ct.counts.flat())
  const ratio = (i: number, j: number) => (mode === 'count' ? ct.counts[i][j] / maxCount : cellValue(ct, i, j, mode) / 100)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0.5 text-xs">
        <caption className="mb-2 text-left text-xs text-ink-3">
          {caption ?? `${denominatorLabel(mode)}. Base: ${formatInt(ct.n)} participante(s) com resposta válida nas duas perguntas${ct.excluded ? `; ${formatInt(ct.excluded)} excluído(s) por ausência` : ''}.`}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="min-w-36 p-2 text-left align-bottom font-medium text-ink-3">
              <span className="block text-[11px] uppercase tracking-wide">Linhas: {rowTitle}</span>
              <span className="block text-[11px] uppercase tracking-wide">Colunas: {colTitle}</span>
            </th>
            {ct.colLabels.map((c) => (
              <th key={c} scope="col" className="min-w-24 max-w-40 p-2 text-left align-bottom font-medium text-ink-2">{c}</th>
            ))}
            <th scope="col" className="min-w-16 p-2 text-right align-bottom font-semibold text-ink">Total</th>
          </tr>
        </thead>
        <tbody>
          {ct.rowLabels.map((r, i) => (
            <tr key={r}>
              <th scope="row" className="p-2 text-left font-medium text-ink-2">{r}</th>
              {ct.colLabels.map((c, j) => {
                const { bg, fg } = heatColor(ratio(i, j))
                const count = ct.counts[i][j]
                const v = cellValue(ct, i, j, mode)
                return (
                  <td
                    key={c}
                    className="tabular rounded p-2 text-right"
                    style={{ background: bg, color: fg }}
                    title={`${r} × ${c}: ${count} participante(s)${mode !== 'count' ? ` · ${formatPct(v)}` : ''}`}
                  >
                    <span className="block font-semibold">{mode === 'count' ? formatInt(count) : formatPct(v)}</span>
                    {mode !== 'count' && <span className="block opacity-80">n={formatInt(count)}</span>}
                  </td>
                )
              })}
              <td className="tabular p-2 text-right font-semibold text-ink">
                {formatInt(ct.rowTotals[i])}
                {mode === 'total' || mode === 'col' ? <span className="block font-normal text-ink-3">{formatPct(pct(ct.rowTotals[i], ct.n))}</span> : null}
              </td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="p-2 text-left font-semibold text-ink">Total</th>
            {ct.colTotals.map((t, j) => (
              <td key={j} className="tabular p-2 text-right font-semibold text-ink">
                {formatInt(t)}
                {mode === 'total' || mode === 'row' ? <span className="block font-normal text-ink-3">{formatPct(pct(t, ct.n))}</span> : null}
              </td>
            ))}
            <td className="tabular p-2 text-right font-bold text-ink">{formatInt(ct.n)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

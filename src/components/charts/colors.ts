/**
 * Cores dos gráficos. As alternativas de cada pergunta seguem uma rampa ordinal de
 * um único matiz (azul-petrol), na ordem lógica das alternativas — sem atribuir
 * valor moral (não há "verde = bom" ou "vermelho = ruim"). Respostas de incerteza
 * recebem cinza neutro; alternativas não previstas, ocre.
 * Rampa validada (monotonicidade, separação e contraste ≥ 2:1 sobre o fundo).
 */
import type { ResolvedQuestion } from '../../data/normalize'

export const ORDINAL_RAMP = ['#0c2f4f', '#1a5a7a', '#2e7f9b', '#5aa3ba', '#7fb5c8']
export const SINGLE_SERIES = '#1a5a7a'
export const UNCERTAIN = '#a19d97'
export const UNEXPECTED = '#b0782a'

const PICKS: Record<number, number[]> = {
  1: [1],
  2: [1, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
}

/** Rampa sequencial para mapas de calor (claro = pouco, escuro = muito). */
export const HEAT_RAMP = ['#f3f7f9', '#d6e7ee', '#b0d0dd', '#82b3c7', '#5592ab', '#2f6f8b', '#164c69', '#0c2f4f']

export function heatColor(ratio: number): { bg: string; fg: string } {
  if (!(ratio > 0)) return { bg: '#f8f9fb', fg: '#6b7480' }
  const idx = Math.min(HEAT_RAMP.length - 1, Math.max(1, Math.ceil(ratio * (HEAT_RAMP.length - 1))))
  return { bg: HEAT_RAMP[idx], fg: idx >= 4 ? '#ffffff' : '#17212c' }
}

/** Cor de cada alternativa (mesma alternativa → mesma cor em todos os gráficos). */
export function alternativeColors(q: ResolvedQuestion): Record<string, string> {
  const uncertainGroups = new Set(q.groups.filter((g) => g.uncertain).map((g) => g.id))
  const ordered = q.alternatives.filter((a) => a.expected && !uncertainGroups.has(a.group))
  const picks = PICKS[Math.min(ordered.length, 5)] ?? PICKS[5]
  const out: Record<string, string> = {}
  ordered.forEach((a, i) => {
    out[a.label] = i < picks.length ? ORDINAL_RAMP[picks[i]] : ORDINAL_RAMP[ORDINAL_RAMP.length - 1]
  })
  for (const a of q.alternatives) {
    if (!a.expected) out[a.label] = UNEXPECTED
    else if (uncertainGroups.has(a.group)) out[a.label] = UNCERTAIN
  }
  return out
}

/** Texto legível sobre a cor de fundo do segmento. */
export function textOn(bg: string): string {
  const dark = ['#0c2f4f', '#1a5a7a', '#2e7f9b']
  return dark.includes(bg) ? '#ffffff' : '#17212c'
}

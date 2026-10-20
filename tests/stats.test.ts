import { describe, expect, it } from 'vitest'
import { normalizeSheet } from '../src/data/normalize'
import { QUESTIONS } from '../src/data/schema'
import { cellValue, crosstab, diffPP, distributionBy, frequency, groupShares, roundedPercents, shareOf, distinctParticipants } from '../src/stats/stats'
import { applyFilters, EMPTY_FILTERS, filterableProfileDims, toggleValue } from '../src/stats/filters'
import { formatPct, formatPP } from '../src/stats/format'
import { toCsv } from '../src/utils/csv'

const order = 'ABCDEFGHIJKLMNOPQR'
const headers = order.split('').map((l) => QUESTIONS.find((q) => q.column === l)!.header)
function r(o: Record<string, string | null>): unknown[] {
  return order.split('').map((l) => (l in o ? o[l] : 'x'))
}
// 4 participantes com perfis e respostas controladas
const ds = normalizeSheet({
  fileName: 't', sheetName: 'S', sheetNames: ['S'], range: '', headers,
  rows: [
    r({ A: '13 a 15 anos', B: 'Feminino', C: '1º ano do Ensino Médio', D: 'Sim, sei o que significa.', M: 'Sim, compreendo muito melhor.', R: 'Brasília' }),
    r({ A: '13 a 15 anos', B: 'Masculino', C: '1º ano do Ensino Médio', D: 'Nunca ouvi falar.', M: 'Sim, compreendo um pouco melhor.', R: 'Brasília' }),
    r({ A: '16 a 18 anos', B: 'Feminino', C: '2º ano do Ensino Médio', D: 'Já ouvi falar, mas não sei explicar.', M: 'Minha compreensão permaneceu a mesma.', R: 'Brasília' }),
    r({ A: '16 a 18 anos', B: 'Masculino', C: '2º ano do Ensino Médio', D: null, M: 'Sim, compreendo muito melhor.', R: 'Brasília' }),
  ],
})
const Q = (id: string) => ds.questions.find((q) => q.id === id)!
const ps = ds.participants

describe('frequência', () => {
  it('exclui ausentes do denominador e informa a quantidade', () => {
    const f = frequency(ps, Q('q1_misoginia'))
    expect(f.valid).toBe(3)
    expect(f.missing).toBe(1)
    const sum = f.rows.reduce((s, x) => s + x.pct, 0)
    expect(sum).toBeCloseTo(100)
    expect(f.rows.find((x) => x.label === 'Nunca ouvi falar.')!.pct).toBeCloseTo(33.333, 2)
  })
  it('mantém todas as alternativas, inclusive com zero respostas', () => {
    expect(frequency(ps, Q('q1_misoginia')).rows).toHaveLength(5)
  })
  it('agrupa somente pelas regras do catálogo', () => {
    const g = groupShares(ps, Q('q1_misoginia'))
    expect(g.find((x) => x.groupId === 'ouviu')!.count).toBe(1)
    expect(g.find((x) => x.groupId === 'ouviu')!.alternatives).toHaveLength(2)
  })
  it('conta participantes distintos', () => {
    expect(distinctParticipants(ps)).toBe(4)
  })
})

describe('proporções e diferenças', () => {
  it('calcula percentual de melhora percebida', () => {
    const s = shareOf(ps, 'q2_compreensao', ['Sim, compreendo muito melhor.', 'Sim, compreendo um pouco melhor.'])
    expect(s).toMatchObject({ count: 3, valid: 4, missing: 0 })
    expect(s.pct).toBe(75)
  })
  it('diferença em pontos percentuais', () => {
    expect(diffPP(75, 50)).toBe(25)
    expect(formatPP(12.345)).toBe('+12,3 p.p.')
  })
  it('arredondamento preserva 100%', () => {
    const v = roundedPercents([1, 1, 1])
    expect(v.reduce((a, b) => a + b, 0)).toBeCloseTo(100)
  })
  it('formata percentuais em pt-BR', () => {
    expect(formatPct(42.857)).toBe('42,9%')
  })
})

describe('tabela de contingência', () => {
  it('conta pares válidos e informa os excluídos', () => {
    const ct = crosstab(ps, Q('ano'), Q('q1_misoginia'))
    expect(ct.n).toBe(3)
    expect(ct.excluded).toBe(1)
    expect(ct.rowTotals).toEqual([2, 1])
    const i = ct.rowLabels.indexOf('1º ano do Ensino Médio')
    const j = ct.colLabels.indexOf('Nunca ouvi falar.')
    expect(cellValue(ct, i, j, 'count')).toBe(1)
    expect(cellValue(ct, i, j, 'row')).toBe(50)
    expect(cellValue(ct, i, j, 'col')).toBe(100)
    expect(cellValue(ct, i, j, 'total')).toBeCloseTo(33.33, 1)
  })
  it('distribuição por grupo demográfico', () => {
    const d = distributionBy(ps, Q('q2_compreensao'), Q('genero'))
    expect(d.map((g) => g.n)).toEqual([2, 2])
    expect(d[1].rows.find((x) => x.label === 'Sim, compreendo muito melhor.')!.pct).toBe(50)
  })
})

describe('filtros', () => {
  it('combinam dimensões com E e valores com OU', () => {
    let f = toggleValue(EMPTY_FILTERS, 'genero', 'Feminino')
    expect(applyFilters(ps, f)).toHaveLength(2)
    f = toggleValue(f, 'idade', '16 a 18 anos')
    expect(applyFilters(ps, f)).toHaveLength(1)
    f = toggleValue(f, 'idade', '13 a 15 anos')
    expect(applyFilters(ps, f)).toHaveLength(2)
  })
  it('não mostra dimensões constantes', () => {
    expect(filterableProfileDims(ds)).toEqual(['idade', 'genero', 'ano'])
  })
})

describe('CSV', () => {
  it('usa ponto e vírgula, BOM e escapa aspas', () => {
    expect(toCsv([['a;b', 1.25], ['"x"', 2]])).toBe('﻿"a;b";1,3\r\n"""x""";2')
  })
})

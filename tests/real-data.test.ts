/** Teste de integração com a planilha oficial do projeto. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseDataset } from '../src/data/load'
import { frequency, nesting } from '../src/stats/stats'
import { buildInsights } from '../src/stats/insights'
import { computeIndicator, INDICATORS } from '../src/stats/indicators'
import { applyFilters, filterableProfileDims } from '../src/stats/filters'

const buf = readFileSync(resolve(__dirname, '..', 'Base Questionarios.xlsx'))
const ds = parseDataset(new Uint8Array(buf), 'Base Questionarios.xlsx')
const Q = (id: string) => ds.questions.find((q) => q.id === id)!

describe('Base Questionarios.xlsx', () => {
  it('possui 50 participantes e 18 colunas', () => {
    expect(ds.participants).toHaveLength(50)
    expect(ds.source.columns).toBe(18)
    expect(ds.source.range).toBe('A1:R51')
  })
  it('todas as colunas foram associadas pelo cabeçalho; todas as alternativas estão no catálogo', () => {
    expect(ds.questions.every((q) => q.matchedBy === 'cabeçalho')).toBe(true)
    expect(ds.issues.filter((i) => i.severity === 'erro')).toHaveLength(0)
    expect(ds.issues.filter((i) => i.kind === 'inesperada')).toHaveLength(0)
    expect(ds.issues.filter((i) => i.kind === 'duplicado')).toHaveLength(0)
  })
  it('única ausência: coluna G, linha 28', () => {
    const missing = ds.issues.filter((i) => i.kind === 'ausente')
    expect(missing).toHaveLength(1)
    expect(missing[0].questionId).toBe('q1_tratamento')
    expect(ds.participants.filter((p) => p.answers.q1_tratamento === null).map((p) => p.excelRow)).toEqual([28])
  })
  it('Q2 começa na coluna M', () => {
    expect(Q('q2_compreensao').columnLetter).toBe('M')
    expect(Q('q2_percepcao').columnLetter).toBe('Q')
  })
  it('reproduz as contagens da planilha', () => {
    const count = (id: string, label: string) => frequency(ds.participants, Q(id)).rows.find((r) => r.label === label)!.count
    expect(count('escola', 'Brasília')).toBe(21)
    expect(count('escola', 'EEEFM Mariana')).toBe(29)
    expect(count('genero', 'Feminino')).toBe(28)
    expect(count('genero', 'Masculino')).toBe(22)
    expect(count('idade', '13 a 15 anos')).toBe(16)
    expect(count('idade', '19 anos ou mais')).toBe(3)
    expect(count('ano', '2º ano do Ensino Médio')).toBe(3)
    expect(count('ano', '3º ano do Ensino Médio')).toBe(28)
    expect(count('ano', 'Outro')).toBe(1)
    expect(count('q1_misoginia', 'Já ouvi falar, mas não sei explicar.')).toBe(18)
    expect(count('q1_relacao', 'Nunca havia pensado sobre isso')).toBe(5)
    expect(count('q1_presenciou', 'Sim, presenciei pessoalmente.')).toBe(17)
    expect(count('q1_silenciamento', 'Não.')).toBe(1)
    expect(count('q2_compreensao', 'Sim, compreendo muito melhor.')).toBe(27)
    expect(count('q2_compreensao', 'Não sei responder.')).toBe(2)
    expect(count('q2_identificar', 'Não sei responder.')).toBe(1)
    expect(count('q2_importancia', 'Não sei responder.')).toBe(1)
    expect(count('q2_percepcao', 'Minha percepção permaneceu a mesma.')).toBe(5)
  })
  it('cada distribuição soma o total de respostas válidas', () => {
    for (const q of ds.questions) {
      const f = frequency(ds.participants, q)
      expect(f.rows.reduce((s, r) => s + r.count, 0)).toBe(f.valid)
      expect(f.valid + f.missing).toBe(50)
    }
  })
  it('indicadores-chave', () => {
    const v = (k: keyof typeof INDICATORS) => computeIndicator(ds, ds.participants, INDICATORS[k])
    expect(v('conheceMisoginia').count).toBe(6)
    expect(v('sabeRelacao').count).toBe(7)
    expect(v('compreendeMelhor').count).toBe(47)
    expect(v('mudouPercepcao').count).toBe(42)
    expect(v('dificuldade').count).toBe(1)
    expect(v('percebeTratamento')).toMatchObject({ count: 39, valid: 49, missing: 1 })
  })
  it('escola é filtro e o recorte Brasília reproduz a base anterior (21 participantes)', () => {
    expect(filterableProfileDims(ds)).toContain('escola')
    const bsb = applyFilters(ds.participants, { questionnaire: 'todos', values: { escola: ['Brasília'] } })
    expect(bsb).toHaveLength(21)
    const v = (k: keyof typeof INDICATORS) => computeIndicator(ds, bsb, INDICATORS[k]).count
    expect(v('conheceMisoginia')).toBe(3)
    expect(v('sabeRelacao')).toBe(4)
    expect(v('compreendeMelhor')).toBe(20)
    expect(v('mudouPercepcao')).toBe(16)
  })
  it('detecta a sobreposição entre escola e série escolar', () => {
    const n = nesting(ds.participants, Q('escola'), Q('ano'))
    expect(n.nested).toBe(true)
    expect(n.byOuter).toEqual([
      { outer: 'Brasília', inner: ['1º ano do Ensino Médio', '2º ano do Ensino Médio'] },
      { outer: 'EEEFM Mariana', inner: ['3º ano do Ensino Médio', 'Outro'] },
    ])
  })
  it('gera achados baseados em regras', () => {
    const ins = buildInsights(ds, ds.participants)
    expect(ins.length).toBeGreaterThanOrEqual(3)
    expect(ins.length).toBeLessThanOrEqual(5)
    expect(ins.every((i) => i.rule.length > 0 && i.n > 0)).toBe(true)
  })
})

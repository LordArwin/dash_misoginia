/** Teste de integração com a planilha oficial do projeto. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseDataset } from '../src/data/load'
import { frequency } from '../src/stats/stats'
import { buildInsights } from '../src/stats/insights'
import { computeIndicator, INDICATORS } from '../src/stats/indicators'

const buf = readFileSync(resolve(__dirname, '..', 'Base Questionarios.xlsx'))
const ds = parseDataset(new Uint8Array(buf), 'Base Questionarios.xlsx')
const Q = (id: string) => ds.questions.find((q) => q.id === id)!

describe('Base Questionarios.xlsx', () => {
  it('possui 21 participantes e 18 colunas', () => {
    expect(ds.participants).toHaveLength(21)
    expect(ds.source.columns).toBe(18)
    expect(ds.source.range).toBe('A1:R22')
  })
  it('todas as colunas foram associadas pelo cabeçalho, sem erros nem ausências', () => {
    expect(ds.questions.every((q) => q.matchedBy === 'cabeçalho')).toBe(true)
    expect(ds.issues.filter((i) => i.severity === 'erro')).toHaveLength(0)
    expect(ds.issues.filter((i) => i.kind === 'ausente')).toHaveLength(0)
    expect(ds.issues.filter((i) => i.kind === 'inesperada')).toHaveLength(0)
  })
  it('Q2 começa na coluna M', () => {
    expect(Q('q2_compreensao').columnLetter).toBe('M')
    expect(Q('q2_percepcao').columnLetter).toBe('Q')
  })
  it('reproduz as contagens da planilha', () => {
    const count = (id: string, label: string) => frequency(ds.participants, Q(id)).rows.find((r) => r.label === label)!.count
    expect(count('genero', 'Feminino')).toBe(11)
    expect(count('genero', 'Masculino')).toBe(10)
    expect(count('idade', '13 a 15 anos')).toBe(16)
    expect(count('ano', '2º ano do Ensino Médio')).toBe(3)
    expect(count('q1_misoginia', 'Já ouvi falar, mas não sei explicar.')).toBe(9)
    expect(count('q1_presenciou', 'Sim, presenciei pessoalmente.')).toBe(6)
    expect(count('q2_compreensao', 'Sim, compreendo muito melhor.')).toBe(15)
    expect(count('q2_percepcao', 'Minha percepção permaneceu a mesma.')).toBe(4)
  })
  it('cada distribuição soma o total de respostas válidas', () => {
    for (const q of ds.questions) {
      const f = frequency(ds.participants, q)
      expect(f.rows.reduce((s, r) => s + r.count, 0)).toBe(f.valid)
    }
  })
  it('indicadores-chave', () => {
    const v = (k: keyof typeof INDICATORS) => computeIndicator(ds, ds.participants, INDICATORS[k])
    expect(v('conheceMisoginia').count).toBe(3)
    expect(v('sabeRelacao').count).toBe(4)
    expect(v('compreendeMelhor').count).toBe(20)
    expect(v('mudouPercepcao').count).toBe(16)
    expect(v('dificuldade').count).toBe(1)
  })
  it('gera achados baseados em regras', () => {
    const ins = buildInsights(ds, ds.participants)
    expect(ins.length).toBeGreaterThanOrEqual(3)
    expect(ins.length).toBeLessThanOrEqual(5)
    expect(ins.every((i) => i.rule.length > 0 && i.n > 0)).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { cleanText, matchKey, normalizeSheet, columnLetter, letterToIndex, type RawSheet } from '../src/data/normalize'
import { QUESTIONS } from '../src/data/schema'

const headers = QUESTIONS.slice().sort((a, b) => letterToIndex(a.column) - letterToIndex(b.column)).map((q) => q.header)

function row(overrides: Record<string, unknown> = {}): unknown[] {
  const base: Record<string, unknown> = {
    A: '13 a 15 anos', B: 'Feminino', C: '1º ano do Ensino Médio', D: 'Nunca ouvi falar.', E: 'Sim, sei o que significa.',
    F: 'Não sei qual é a relação.', G: 'Sim, em algumas situações.', H: 'Não, nunca presenciei.', I: 'Concordo totalmente.',
    J: 'Sim, frequentemente.', K: 'Raramente.', L: 'Sim, é muito importante.', M: 'Sim, compreendo muito melhor.',
    N: 'Sim, concordo totalmente.', O: 'Sim, com facilidade.', P: 'Muito importante.', Q: 'Não sei responder.', R: 'Brasília',
    ...overrides,
  }
  return 'ABCDEFGHIJKLMNOPQR'.split('').map((l) => base[l] ?? null)
}

const sheet = (rows: unknown[][]): RawSheet => ({ fileName: 't.xlsx', sheetName: 'S', sheetNames: ['S'], range: 'A1:R3', headers, rows })

describe('normalização de texto', () => {
  it('remove espaços excedentes e preserva o texto', () => {
    expect(cleanText('  Feminino     ')).toBe('Feminino')
    expect(cleanText('Já ouvi o termo,  mas não sei')).toBe('Já ouvi o termo, mas não sei')
    expect(cleanText(null)).toBe('')
  })
  it('chave de comparação ignora caixa e ponto final', () => {
    expect(matchKey(' Não. ')).toBe(matchKey('não'))
  })
  it('converte letras de coluna', () => {
    expect(columnLetter(0)).toBe('A')
    expect(columnLetter(12)).toBe('M')
    expect(letterToIndex('R')).toBe(17)
    expect(letterToIndex('AA')).toBe(26)
  })
})

describe('normalizeSheet', () => {
  it('associa colunas pelo cabeçalho e unifica grafias com espaços', () => {
    const ds = normalizeSheet(sheet([row({ B: ' Masculino  ' }), row({ B: 'Feminino     ' })]))
    expect(ds.participants).toHaveLength(2)
    expect(ds.participants[0].answers.genero).toBe('Masculino')
    expect(ds.participants[1].answers.genero).toBe('Feminino')
    expect(ds.questions.every((q) => q.matchedBy === 'cabeçalho')).toBe(true)
    expect(ds.issues.some((i) => i.kind === 'espaços' && i.questionId === 'genero')).toBe(true)
  })

  it('trata vazio como ausente, não como resposta negativa', () => {
    const ds = normalizeSheet(sheet([row({ D: '   ' }), row()]))
    expect(ds.participants[0].answers.q1_misoginia).toBeNull()
    expect(ds.issues.find((i) => i.kind === 'ausente' && i.questionId === 'q1_misoginia')?.count).toBe(1)
  })

  it('preserva e sinaliza alternativas inesperadas', () => {
    const ds = normalizeSheet(sheet([row({ G: 'Sim, frequentemente.' }), row()]))
    const q = ds.questions.find((x) => x.id === 'q1_tratamento')!
    expect(q.alternatives.some((a) => a.label === 'Sim, frequentemente.' && !a.expected)).toBe(true)
    expect(ds.issues.some((i) => i.kind === 'inesperada' && i.questionId === 'q1_tratamento')).toBe(true)
  })

  it('ignora linhas totalmente vazias e sinaliza registros idênticos', () => {
    const empty = Array(18).fill(null)
    const ds = normalizeSheet(sheet([row(), empty, row()]))
    expect(ds.participants).toHaveLength(2)
    expect(ds.source.emptyRowsSkipped).toBe(1)
    expect(ds.participants.map((p) => p.excelRow)).toEqual([2, 4])
    expect(ds.issues.some((i) => i.kind === 'duplicado')).toBe(true)
  })

  it('reporta erro quando uma coluna esperada não existe', () => {
    const short: RawSheet = { ...sheet([row().slice(0, 12)]), headers: headers.slice(0, 12) }
    const ds = normalizeSheet(short)
    expect(ds.issues.filter((i) => i.severity === 'erro').length).toBe(6)
  })
})

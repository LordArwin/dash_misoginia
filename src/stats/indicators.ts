/** Indicadores-chave: cada um é a proporção de um grupo documentado sobre as respostas válidas. */
import type { Dataset, Participant } from '../data/normalize'
import type { QuestionId } from '../data/schema'
import { shareOfGroup, type Share } from './stats'

export interface IndicatorDef {
  id: string
  label: string
  questionId: QuestionId
  groupId: string
}

export const INDICATORS = {
  conheceMisoginia: { id: 'conheceMisoginia', label: 'Declarou saber o significado de misoginia (antes)', questionId: 'q1_misoginia', groupId: 'conhece' },
  conheceDH: { id: 'conheceDH', label: 'Declarou saber o significado de Direitos Humanos (antes)', questionId: 'q1_dh', groupId: 'conhece' },
  sabeRelacao: { id: 'sabeRelacao', label: 'Declarou saber explicar a relação DH × misoginia (antes)', questionId: 'q1_relacao', groupId: 'sabe' },
  compreendeMelhor: { id: 'compreendeMelhor', label: 'Relatou compreender melhor a relação (após)', questionId: 'q2_compreensao', groupId: 'melhor' },
  concordaViolacao: { id: 'concordaViolacao', label: 'Concorda total ou parcialmente que a discriminação pode violar direitos', questionId: 'q2_violacao', groupId: 'concorda' },
  identifica: { id: 'identifica', label: 'Declara identificar situações com facilidade ou em algumas situações', questionId: 'q2_identificar', groupId: 'identifica' },
  dificuldade: { id: 'dificuldade', label: 'Declara ainda ter dificuldade para identificar situações', questionId: 'q2_identificar', groupId: 'dificuldade' },
  mudouPercepcao: { id: 'mudouPercepcao', label: 'Relatou mudança (significativa ou parcial) de percepção', questionId: 'q2_percepcao', groupId: 'mudou' },
  importante: { id: 'importante', label: 'Considera a educação em DH muito importante ou importante', questionId: 'q2_importancia', groupId: 'importante' },
} satisfies Record<string, IndicatorDef>

export type IndicatorId = keyof typeof INDICATORS

export function computeIndicator(ds: Dataset, ps: Participant[], def: IndicatorDef): Share & { alternatives: string[] } {
  const q = ds.questions.find((x) => x.id === def.questionId)!
  const alternatives = q.alternatives.filter((a) => a.group === def.groupId).map((a) => a.label)
  return { ...shareOfGroup(ps, q, def.groupId), alternatives }
}

export function indicatorRule(alternatives: string[]): string {
  return `Soma das alternativas ${alternatives.map((a) => `“${a}”`).join(' + ')} ÷ respostas válidas.`
}

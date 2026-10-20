/**
 * Achados gerados por regras transparentes e fixas. Cada achado informa a regra,
 * o denominador e evita qualquer linguagem causal.
 */
import type { Dataset, Participant } from '../data/normalize'
import type { QuestionId } from '../data/schema'
import { formatInt, formatPct } from './format'
import { groupShares, shareOfGroup } from './stats'

export interface Insight {
  id: string
  title: string
  text: string
  rule: string
  /** Denominador (respostas válidas) usado no achado. */
  n: number
}

export const SMALL_SAMPLE = 10

function q(ds: Dataset, id: QuestionId) {
  return ds.questions.find((x) => x.id === id)!
}

const fmt = (count: number, pctValue: number) => `${formatPct(pctValue)} (${formatInt(count)})`

export function buildInsights(ds: Dataset, ps: Participant[]): Insight[] {
  const out: Insight[] = []

  const mis = q(ds, 'q1_misoginia')
  const misG = groupShares(ps, mis)
  const misValid = misG.reduce((s, g) => s + g.count, 0)
  if (misValid > 0) {
    const g = Object.fromEntries(misG.map((x) => [x.groupId, x]))
    out.push({
      id: 'conhecimento-misoginia',
      title: 'Conhecimento prévio sobre misoginia',
      text: `Antes da apresentação, ${fmt(g.conhece.count, g.conhece.pct)} declararam saber o significado de misoginia; ${fmt(g.ouviu.count, g.ouviu.pct)} apenas ouviram falar; ${fmt(g.nunca.count, g.nunca.pct)} nunca ouviram falar e ${fmt(g.incerteza.count, g.incerteza.pct)} não tinham certeza.`,
      rule: 'Q1, coluna D. “Apenas ouviu falar” = “Já ouvi falar, mas não sei explicar.” + “Já ouvi o termo, mas não sei o que significa.”. Denominador: respostas válidas.',
      n: misValid,
    })
  }

  const before = shareOfGroup(ps, q(ds, 'q1_relacao'), 'sabe')
  const after = shareOfGroup(ps, q(ds, 'q2_compreensao'), 'melhor')
  if (before.valid > 0 && after.valid > 0) {
    out.push({
      id: 'relacao-antes-depois',
      title: 'Relação entre Direitos Humanos e misoginia',
      text: `No Questionário 01, ${fmt(before.count, before.pct)} declararam saber explicar a relação entre Direitos Humanos e o enfrentamento à misoginia. No Questionário 02, ${fmt(after.count, after.pct)} relataram compreender melhor essa relação (muito ou um pouco melhor). As perguntas medem coisas diferentes (conhecimento declarado × melhora percebida) e não constituem medida objetiva de aprendizagem.`,
      rule: 'Q1 coluna F, alternativa “Sim, sei explicar essa relação.”; Q2 coluna M, “Sim, compreendo muito melhor.” + “Sim, compreendo um pouco melhor.”. Denominadores próprios de cada pergunta.',
      n: Math.min(before.valid, after.valid),
    })
  }

  const esp = shareOfGroup(ps, q(ds, 'q1_espacos'), 'afirmativa')
  const sil = shareOfGroup(ps, q(ds, 'q1_silenciamento'), 'afirmativa')
  if (esp.valid > 0 && sil.valid > 0) {
    out.push({
      id: 'percepcao-desigualdade',
      title: 'Percepção de desigualdade de gênero',
      text: `${fmt(esp.count, esp.pct)} percebem que mulheres e meninas enfrentam mais dificuldades ou preconceitos em espaços tradicionalmente considerados “masculinos”, e ${fmt(sil.count, sil.pct)} percebem que elas têm suas opiniões silenciadas ou desconsideradas (frequentemente ou algumas vezes).`,
      rule: 'Q1 colunas J e K. Afirmativa = “Sim, frequentemente.” + “Sim, algumas vezes.”. “Raramente.” é classificado à parte (baixa frequência).',
      n: Math.min(esp.valid, sil.valid),
    })
  }

  const exp = q(ds, 'q1_presenciou')
  const pres = shareOfGroup(ps, exp, 'presenciou')
  const rel = shareOfGroup(ps, exp, 'relatos')
  if (pres.valid > 0) {
    out.push({
      id: 'experiencias',
      title: 'Experiências relatadas',
      text: `${fmt(pres.count, pres.pct)} relataram ter presenciado situação que consideraram violência ou discriminação de gênero (pessoalmente ou envolvendo outra pessoa) e ${fmt(rel.count, rel.pct)} disseram ter ouvido relatos sem presenciar. Trata-se de percepção relatada, não de medida de incidência.`,
      rule: 'Q1 coluna H. Presenciou = “Sim, presenciei pessoalmente.” + “Sim, presenciei envolvendo outra pessoa.”.',
      n: pres.valid,
    })
  }

  const per = q(ds, 'q2_percepcao')
  const mud = shareOfGroup(ps, per, 'mudou')
  const mesma = shareOfGroup(ps, per, 'mesma')
  if (mud.valid > 0) {
    out.push({
      id: 'mudanca-percepcao',
      title: 'Mudança de percepção relatada',
      text: `Após a apresentação, ${fmt(mud.count, mud.pct)} relataram que passaram a perceber de forma diferente situações de desigualdade ou discriminação de gênero (significativa ou parcialmente), enquanto ${fmt(mesma.count, mesma.pct)} disseram que a percepção permaneceu a mesma. É uma autoavaliação; não permite afirmar efeito causal da apresentação.`,
      rule: 'Q2 coluna Q. Mudou = “Sim, minha percepção mudou significativamente.” + “Sim, minha percepção mudou parcialmente.”.',
      n: mud.valid,
    })
  }

  return out
}

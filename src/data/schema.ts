/**
 * Catálogo dos campos da planilha "Base Questionarios.xlsx".
 *
 * Estrutura identificada (aba "Página1", intervalo A1:R22):
 *  - Linha 1: cabeçalhos; linhas 2–22: 21 participantes (uma linha = um participante).
 *  - Colunas A–C: perfil (idade, gênero, ano escolar).
 *  - Colunas D–L: Questionário 01 (diagnóstico inicial).
 *  - Colunas M–Q: Questionário 02 (avaliação após a apresentação).
 *  - Coluna R: "Escola" — metadado de perfil, registrado após o Q2 na planilha.
 *
 * As alternativas abaixo reproduzem o texto original das respostas encontradas no
 * arquivo (apenas sem espaços excedentes). O formulário original não foi fornecido;
 * por isso o catálogo contém somente alternativas observadas. Qualquer valor novo
 * é preservado e sinalizado como "alternativa inesperada" na página de qualidade.
 *
 * `groups` define agrupamentos analíticos explícitos e documentados. Eles nunca
 * substituem a distribuição completa das alternativas; servem apenas para
 * indicadores (cartões) e para a classificação afirmativa/negativa/neutra/incerteza.
 */

export type Questionnaire = 'perfil' | 'q1' | 'q2'

export type QuestionId =
  | 'idade' | 'genero' | 'ano' | 'escola'
  | 'q1_misoginia' | 'q1_dh' | 'q1_relacao' | 'q1_tratamento' | 'q1_presenciou'
  | 'q1_igualdade' | 'q1_espacos' | 'q1_silenciamento' | 'q1_discutir'
  | 'q2_compreensao' | 'q2_violacao' | 'q2_identificar' | 'q2_importancia' | 'q2_percepcao'

export interface GroupDef {
  id: string
  label: string
  /** Respostas de incerteza recebem cor neutra (cinza) nos gráficos. */
  uncertain?: boolean
}

export interface AlternativeDef {
  label: string
  group: string
}

export interface QuestionDef {
  id: QuestionId
  questionnaire: Questionnaire
  /** Coluna esperada na planilha (usada como alternativa se o cabeçalho não for encontrado). */
  column: string
  /** Texto do cabeçalho na planilha (comparado após normalização de espaços). */
  header: string
  /** Rótulo curto para menus e eixos. */
  short: string
  /** Tema da pergunta (usado para organizar páginas). */
  theme: 'perfil' | 'conhecimento' | 'percepcao' | 'experiencia' | 'avaliacao'
  /** Classificação dos grupos: tipo de dimensão que o agrupamento expressa. */
  groupKind?: string
  groups: GroupDef[]
  /** Alternativas na ordem lógica de apresentação. */
  alternatives: AlternativeDef[]
}

const KNOWLEDGE_GROUPS: GroupDef[] = [
  { id: 'conhece', label: 'Declara saber o significado' },
  { id: 'ouviu', label: 'Apenas ouviu falar' },
  { id: 'nunca', label: 'Nunca ouviu falar' },
  { id: 'incerteza', label: 'Não tem certeza', uncertain: true },
]

const KNOWLEDGE_ALTERNATIVES: AlternativeDef[] = [
  { label: 'Sim, sei o que significa.', group: 'conhece' },
  { label: 'Já ouvi falar, mas não sei explicar.', group: 'ouviu' },
  { label: 'Já ouvi o termo, mas não sei o que significa.', group: 'ouviu' },
  { label: 'Nunca ouvi falar.', group: 'nunca' },
  { label: 'Não tenho certeza.', group: 'incerteza' },
]

const POLARITY = {
  afirmativa: { id: 'afirmativa', label: 'Afirmativa' },
  ressalva: { id: 'ressalva', label: 'Afirmativa com ressalva ou parcial' },
  baixa: { id: 'baixa', label: 'Baixa frequência' },
  neutra: { id: 'neutra', label: 'Neutra' },
  negativa: { id: 'negativa', label: 'Negativa' },
  incerteza: { id: 'incerteza', label: 'Incerteza / não sabe', uncertain: true },
} satisfies Record<string, GroupDef>

export const QUESTIONS: QuestionDef[] = [
  // ---------------------------------------------------------------- Perfil
  {
    id: 'idade', questionnaire: 'perfil', column: 'A', header: 'IDADE', short: 'Faixa etária', theme: 'perfil',
    groups: [{ id: 'v', label: 'Valor' }],
    alternatives: [
      { label: '13 a 15 anos', group: 'v' },
      { label: '16 a 18 anos', group: 'v' },
    ],
  },
  {
    id: 'genero', questionnaire: 'perfil', column: 'B', header: 'GENERO', short: 'Gênero declarado', theme: 'perfil',
    groups: [{ id: 'v', label: 'Valor' }],
    alternatives: [
      { label: 'Feminino', group: 'v' },
      { label: 'Masculino', group: 'v' },
    ],
  },
  {
    id: 'ano', questionnaire: 'perfil', column: 'C', header: 'ANO_ESCOLAR', short: 'Ano/série escolar', theme: 'perfil',
    groups: [{ id: 'v', label: 'Valor' }],
    alternatives: [
      { label: '1º ano do Ensino Médio', group: 'v' },
      { label: '2º ano do Ensino Médio', group: 'v' },
    ],
  },
  {
    id: 'escola', questionnaire: 'perfil', column: 'R', header: 'Escola', short: 'Escola', theme: 'perfil',
    groups: [{ id: 'v', label: 'Valor' }],
    alternatives: [{ label: 'Brasília', group: 'v' }],
  },

  // ---------------------------------------------------------- Questionário 01
  {
    id: 'q1_misoginia', questionnaire: 'q1', column: 'D', theme: 'conhecimento', groupKind: 'Nível de conhecimento declarado',
    header: 'Você já ouviu falar sobre misoginia?',
    short: 'Conhecimento do termo misoginia',
    groups: KNOWLEDGE_GROUPS,
    alternatives: KNOWLEDGE_ALTERNATIVES,
  },
  {
    id: 'q1_dh', questionnaire: 'q1', column: 'E', theme: 'conhecimento', groupKind: 'Nível de conhecimento declarado',
    header: 'Você já ouviu falar sobre Direitos Humanos?',
    short: 'Conhecimento sobre Direitos Humanos',
    groups: KNOWLEDGE_GROUPS,
    alternatives: KNOWLEDGE_ALTERNATIVES,
  },
  {
    id: 'q1_relacao', questionnaire: 'q1', column: 'F', theme: 'conhecimento', groupKind: 'Compreensão declarada da relação',
    header: 'Você sabe qual é a relação entre os Direitos Humanos e o enfrentamento à misoginia?',
    short: 'Relação DH × enfrentamento à misoginia (antes)',
    groups: [
      { id: 'sabe', label: 'Declara saber explicar' },
      { id: 'ideia', label: 'Tem uma ideia parcial' },
      { id: 'ouviu', label: 'Ouviu falar, sem saber qual é' },
      { id: 'nao_sabe', label: 'Não sabe qual é a relação' },
    ],
    alternatives: [
      { label: 'Sim, sei explicar essa relação.', group: 'sabe' },
      { label: 'Tenho uma ideia, mas não sei explicar completamente.', group: 'ideia' },
      { label: 'Já ouvi falar sobre essa relação, mas não sei exatamente qual é.', group: 'ouviu' },
      { label: 'Não sei qual é a relação.', group: 'nao_sabe' },
    ],
  },
  {
    id: 'q1_tratamento', questionnaire: 'q1', column: 'G', theme: 'percepcao', groupKind: 'Tipo de resposta',
    header: 'Na sua percepção, homens e mulheres recebem tratamento diferente em razão do seu gênero?',
    short: 'Tratamento diferente por gênero',
    groups: [POLARITY.afirmativa, POLARITY.negativa, POLARITY.incerteza],
    alternatives: [
      { label: 'Sim, em algumas situações.', group: 'afirmativa' },
      { label: 'Não, recebem o mesmo tratamento, independentemente do gênero.', group: 'negativa' },
      { label: 'Não sei responder.', group: 'incerteza' },
    ],
  },
  {
    id: 'q1_presenciou', questionnaire: 'q1', column: 'H', theme: 'experiencia', groupKind: 'Tipo de experiência relatada',
    header: 'Você já presenciou alguma situação que considerou uma forma de violência ou discriminação relacionada ao gênero?',
    short: 'Presenciou violência ou discriminação de gênero',
    groups: [
      { id: 'presenciou', label: 'Relata ter presenciado (pessoalmente ou envolvendo outra pessoa)' },
      { id: 'relatos', label: 'Ouviu relatos, sem presenciar' },
      { id: 'nunca', label: 'Nunca presenciou' },
      { id: 'incerteza', label: 'Não tem certeza de como classificar', uncertain: true },
    ],
    alternatives: [
      { label: 'Sim, presenciei pessoalmente.', group: 'presenciou' },
      { label: 'Sim, presenciei envolvendo outra pessoa.', group: 'presenciou' },
      { label: 'Já ouvi relatos sobre situações desse tipo, mas não presenciei.', group: 'relatos' },
      { label: 'Não, nunca presenciei.', group: 'nunca' },
      { label: 'Não tenho certeza se a situação que presenciei pode ser considerada violência ou discriminação de gênero.', group: 'incerteza' },
    ],
  },
  {
    id: 'q1_igualdade', questionnaire: 'q1', column: 'I', theme: 'percepcao', groupKind: 'Tipo de resposta',
    header: 'Na sua opinião, todas as pessoas devem ter os mesmos direitos e receber tratamento igualitário, independentemente de gênero, raça, cor ou religião?',
    short: 'Mesmos direitos e tratamento igualitário',
    groups: [POLARITY.afirmativa, POLARITY.ressalva, POLARITY.neutra, POLARITY.incerteza],
    alternatives: [
      { label: 'Concordo totalmente.', group: 'afirmativa' },
      { label: 'Concordo parcialmente.', group: 'ressalva' },
      { label: 'Nem concordo nem discordo.', group: 'neutra' },
      { label: 'Não sei responder.', group: 'incerteza' },
    ],
  },
  {
    id: 'q1_espacos', questionnaire: 'q1', column: 'J', theme: 'percepcao', groupKind: 'Tipo de resposta',
    header: 'Na sua percepção, mulheres e meninas enfrentam mais dificuldades ou preconceitos ao participar de atividades ou ocupar espaços tradicionalmente considerados “masculinos”?',
    short: 'Dificuldades em espaços “masculinos”',
    groups: [POLARITY.afirmativa, POLARITY.baixa, POLARITY.negativa, POLARITY.incerteza],
    alternatives: [
      { label: 'Sim, frequentemente.', group: 'afirmativa' },
      { label: 'Sim, algumas vezes.', group: 'afirmativa' },
      { label: 'Raramente.', group: 'baixa' },
      { label: 'Não.', group: 'negativa' },
      { label: 'Nunca pensei sobre isso.', group: 'incerteza' },
    ],
  },
  {
    id: 'q1_silenciamento', questionnaire: 'q1', column: 'K', theme: 'percepcao', groupKind: 'Tipo de resposta',
    header: 'Na sua percepção, mulheres e meninas têm suas opiniões silenciadas, desconsideradas ou recebem menos espaço para se expressar em determinadas situações?',
    short: 'Silenciamento de mulheres e meninas',
    groups: [POLARITY.afirmativa, POLARITY.baixa],
    alternatives: [
      { label: 'Sim, frequentemente.', group: 'afirmativa' },
      { label: 'Sim, algumas vezes.', group: 'afirmativa' },
      { label: 'Raramente.', group: 'baixa' },
    ],
  },
  {
    id: 'q1_discutir', questionnaire: 'q1', column: 'L', theme: 'percepcao', groupKind: 'Tipo de resposta',
    header: 'Na sua opinião, discutir as diferenças entre as pessoas e abordar situações de discriminação de gênero é importante para promover uma sociedade mais igualitária?',
    short: 'Importância de discutir discriminação de gênero',
    groups: [POLARITY.afirmativa, POLARITY.ressalva, POLARITY.incerteza],
    alternatives: [
      { label: 'Sim, é muito importante.', group: 'afirmativa' },
      { label: 'Sim, é importante, mas não é suficiente por si só.', group: 'ressalva' },
      { label: 'Não sei responder.', group: 'incerteza' },
    ],
  },

  // ---------------------------------------------------------- Questionário 02
  {
    id: 'q2_compreensao', questionnaire: 'q2', column: 'M', theme: 'avaliacao', groupKind: 'Compreensão declarada',
    header: 'Após a apresentação, você considera que compreende melhor a relação entre Direitos Humanos e misoginia?',
    short: 'Compreensão da relação DH × misoginia (após)',
    groups: [
      { id: 'melhor', label: 'Relata compreender melhor (muito ou um pouco)' },
      { id: 'mesma', label: 'Compreensão permaneceu a mesma' },
    ],
    alternatives: [
      { label: 'Sim, compreendo muito melhor.', group: 'melhor' },
      { label: 'Sim, compreendo um pouco melhor.', group: 'melhor' },
      { label: 'Minha compreensão permaneceu a mesma.', group: 'mesma' },
    ],
  },
  {
    id: 'q2_violacao', questionnaire: 'q2', column: 'N', theme: 'avaliacao', groupKind: 'Concordância',
    header: 'Você considera que situações de discriminação e violência de gênero podem representar uma violação de direitos?',
    short: 'Discriminação como violação de direitos',
    groups: [
      { id: 'concorda', label: 'Concorda total ou parcialmente' },
      { id: 'discorda', label: 'Discorda (parcialmente)' },
    ],
    alternatives: [
      { label: 'Sim, concordo totalmente.', group: 'concorda' },
      { label: 'Concordo parcialmente.', group: 'concorda' },
      { label: 'Discordo parcialmente.', group: 'discorda' },
    ],
  },
  {
    id: 'q2_identificar', questionnaire: 'q2', column: 'O', theme: 'avaliacao', groupKind: 'Capacidade declarada de identificação',
    header: 'Você acredita que consegue identificar com mais facilidade situações de misoginia e discriminação de gênero no cotidiano?',
    short: 'Identificação de situações de misoginia',
    groups: [
      { id: 'identifica', label: 'Declara identificar (com facilidade ou em algumas situações)' },
      { id: 'dificuldade', label: 'Declara ainda ter dificuldade' },
      { id: 'sem_mudanca', label: 'Não percebeu mudança na capacidade' },
    ],
    alternatives: [
      { label: 'Sim, com facilidade.', group: 'identifica' },
      { label: 'Sim, em algumas situações.', group: 'identifica' },
      { label: 'Ainda tenho dificuldade para identificá-las.', group: 'dificuldade' },
      { label: 'Não percebi mudança na minha capacidade de identificar essas situações.', group: 'sem_mudanca' },
    ],
  },
  {
    id: 'q2_importancia', questionnaire: 'q2', column: 'P', theme: 'avaliacao', groupKind: 'Importância atribuída',
    header: 'Como você avalia a importância da educação em Direitos Humanos para o combate à discriminação de gênero?',
    short: 'Importância da educação em Direitos Humanos',
    groups: [
      { id: 'importante', label: 'Muito importante ou importante' },
      { id: 'pouco', label: 'Pouco importante' },
    ],
    alternatives: [
      { label: 'Muito importante.', group: 'importante' },
      { label: 'Importante.', group: 'importante' },
      { label: 'Pouco importante.', group: 'pouco' },
    ],
  },
  {
    id: 'q2_percepcao', questionnaire: 'q2', column: 'Q', theme: 'avaliacao', groupKind: 'Mudança de percepção relatada',
    header: 'Você considera que passou a perceber de forma diferente situações relacionadas à desigualdade ou discriminação de gênero?',
    short: 'Mudança de percepção sobre desigualdade',
    groups: [
      { id: 'mudou', label: 'Relata mudança (significativa ou parcial)' },
      { id: 'mesma', label: 'Percepção permaneceu a mesma' },
      { id: 'incerteza', label: 'Não sabe responder', uncertain: true },
    ],
    alternatives: [
      { label: 'Sim, minha percepção mudou significativamente.', group: 'mudou' },
      { label: 'Sim, minha percepção mudou parcialmente.', group: 'mudou' },
      { label: 'Minha percepção permaneceu a mesma.', group: 'mesma' },
      { label: 'Não sei responder.', group: 'incerteza' },
    ],
  },
]

export const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Record<QuestionId, QuestionDef>

export const PROFILE_IDS: QuestionId[] = ['idade', 'genero', 'ano', 'escola']
export const Q1_IDS = QUESTIONS.filter((q) => q.questionnaire === 'q1').map((q) => q.id)
export const Q2_IDS = QUESTIONS.filter((q) => q.questionnaire === 'q2').map((q) => q.id)

export const QUESTIONNAIRE_LABEL: Record<Questionnaire, string> = {
  perfil: 'Perfil',
  q1: 'Questionário 01',
  q2: 'Questionário 02',
}

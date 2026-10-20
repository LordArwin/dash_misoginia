import { LayoutDashboard, Users, BookOpen, Scale, MessageSquareWarning, ClipboardCheck, Grid3x3, FileSearch, type LucideIcon } from 'lucide-react'

export interface RouteDef {
  path: string
  label: string
  icon: LucideIcon
  /** Questionário ao qual a página pertence (para o filtro "Questionário"). */
  scope: 'q1' | 'q2' | 'ambos' | 'perfil'
}

export const ROUTES: RouteDef[] = [
  { path: '/', label: 'Visão geral', icon: LayoutDashboard, scope: 'ambos' },
  { path: '/perfil', label: 'Perfil dos participantes', icon: Users, scope: 'perfil' },
  { path: '/conhecimento', label: 'Conhecimento prévio', icon: BookOpen, scope: 'q1' },
  { path: '/percepcoes', label: 'Percepções sobre desigualdade', icon: Scale, scope: 'q1' },
  { path: '/experiencias', label: 'Experiências relatadas', icon: MessageSquareWarning, scope: 'q1' },
  { path: '/avaliacao', label: 'Avaliação após a apresentação', icon: ClipboardCheck, scope: 'q2' },
  { path: '/cruzamentos', label: 'Cruzamentos', icon: Grid3x3, scope: 'ambos' },
  { path: '/metodologia', label: 'Metodologia e qualidade', icon: FileSearch, scope: 'ambos' },
]

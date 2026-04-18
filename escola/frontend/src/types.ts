// ============================================================
//  types.ts — Tipos TypeScript alinhados ao banco SQLite (PHP)
// ============================================================

// Mantido apenas a declaração numérica, que é a utilizada pelas funções de permissão
export type Cargo = 1 | 2 | 3 | 4 // 1=Admin 2=Diretor 3=Secretaria 4=Professor

export const CARGO_NOMES: Record<Cargo, string> = {
  1: 'Administrador',
  2: 'Diretor',
  3: 'Secretaria',
  4: 'Professor',
}

export const CARGO_CORES: Record<Cargo, string> = {
  1: '#f59e0b',
  2: '#6366f1',
  3: '#10b981',
  4: '#3b82f6',
}

// ── Entidades ────────────────────────────────────────────────

export interface User {
  id: number
  login: string
  nome: string
  email?: string
  cargo: Cargo
  ativo: number
  foto?: string
  created_at: string
  updated_at?: string
  ultimo_acesso?: string
}

export interface Aluno {
  id: number
  matricula: string
  nome: string
  email?: string
  telefone?: string
  data_nascimento?: string
  turma?: string
  serie?: string
  turno?: string
  responsavel?: string
  tel_responsavel?: string
  endereco?: string
  observacoes?: string
  ativo: number
  created_at: string
  updated_at: string
}

export interface Professor {
  id: number
  registro: string
  usuario_id?: number
  nome: string
  email?: string
  telefone?: string
  disciplina?: string
  formacao?: string
  turmas?: string
  ativo: number
  created_at: string
  updated_at: string
}

export interface Nota {
  id: number
  aluno_id: number
  professor_id?: number
  disciplina: string
  bimestre: number
  nota: number
  tipo: string
  observacao?: string
  data_lancamento: string
  created_at: string
  // Joined
  aluno_nome?: string
  matricula?: string
  turma?: string
  prof_nome?: string
}

export interface MediaBoletim {
  aluno_id: number
  nome: string
  matricula: string
  turma: string
  disciplina: string
  b1?: number
  b2?: number
  b3?: number
  b4?: number
  media: number
}

export interface Presenca {
  id: number
  aluno_id: number
  professor_id?: number
  disciplina: string
  data: string
  status: 'Presente' | 'Ausente' | 'Justificado'
  observacao?: string
  created_at: string
  // Joined
  aluno_nome?: string
  matricula?: string
  turma?: string
}

export interface FrequenciaAluno {
  nome: string
  matricula: string
  turma: string
  total: number
  presentes: number
  ausentes: number
  justificados: number
}

export interface Token {
  id: number
  nome: string
  servico: string
  token?: string   // não retornado pela API para segurança
  descricao?: string
  ativo: number
  ultimo_uso?: string
  created_at: string
  criado_por_nome?: string
}

export interface Relatorio {
  id: number
  titulo: string
  tipo: string
  periodo_inicio: string
  periodo_fim: string
  dados: {
    periodo: { inicio: string; fim: string }
    frequencia: { presentes: number; ausentes: number; total: number }
    notas: Array<{ disciplina: string; media: number; cnt: number }>
    novos_alunos: number
    total_aulas: number
    analise_ia?: string
  }
  gerado_por?: number
  gerado_por_nome?: string
  enviado_nuvem: number
  created_at: string
}

export interface DashboardData {
  totais: {
    alunos: number
    professores: number
    usuarios: number
    media_geral: number
    relatorios: number
    pct_presenca: number
  }
  presenca_semana: {
    presente: number
    ausente: number
    justificado: number
    total: number
    pct: number
  }
  notas_disciplinas: Array<{ disciplina: string; media: number; cnt: number }>
  logs_recentes: Array<{
    id: number
    acao: string
    entidade: string
    nome?: string
    cargo?: Cargo
    created_at: string
    ip: string
  }>
  alunos_recentes: Array<Aluno>
  relatorios_recentes: Array<Relatorio>
}

// ── Resposta padrão da API ───────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T | null
}

// ── Permissões ───────────────────────────────────────────────

export function canEdit(cargo: Cargo): boolean  { return cargo <= 3 }
export function canDelete(cargo: Cargo): boolean { return cargo <= 2 }
export function isAdmin(cargo: Cargo): boolean   { return cargo === 1 }
export function isDiretor(cargo: Cargo): boolean { return cargo <= 2 }
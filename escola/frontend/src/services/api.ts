// ============================================================
//  services/api.ts — Camada de fetch para o backend PHP
// ============================================================
import type { ApiResponse } from '../types'

const BASE = 'http://localhost:8080/escola/escola/api'

// ── Core fetch ───────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',            // envia cookies de sessão PHP
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })

  const json: ApiResponse<T> = await res.json()
  if (!json.success) throw new Error(json.message ?? 'Erro desconhecido.')
  return json
}

const get  = <T>(path: string) => request<T>(path, { method: 'GET' })
const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) })
const put  = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',  body: JSON.stringify(body) })
const del  = <T>(path: string, body?: unknown) => request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined })

// ── Auth ─────────────────────────────────────────────────────

export const authApi = {
  me:     ()                             => get('/auth.php?action=me'),
  login:  (login: string, senha: string) => post('/auth.php', { login, senha }),
  logout: ()                             => get('/auth.php?action=logout'),
}

// ── Dashboard ────────────────────────────────────────────────

export const dashboardApi = {
  get: () => get('/dashboard.php'),
}

// ── Alunos ───────────────────────────────────────────────────

export const alunosApi = {
  list:   (params?: { q?: string; turma?: string; serie?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string> ?? {}).toString()
    return get(`/alunos.php${qs ? '?' + qs : ''}`)
  },
  get:    (id: number) => get(`/alunos.php?id=${id}`),
  create: (data: Record<string, string>) => post('/alunos.php', data),
  update: (data: Record<string, unknown>) => put('/alunos.php', data),
  delete: (id: number) => del(`/alunos.php?id=${id}`),
}

// ── Professores ──────────────────────────────────────────────

export const professoresApi = {
  list:   (q?: string) => get(`/professores.php${q ? '?q=' + encodeURIComponent(q) : ''}`),
  create: (data: Record<string, string>) => post('/professores.php', data),
  update: (data: Record<string, unknown>) => put('/professores.php', data),
  delete: (id: number) => del(`/professores.php?id=${id}`),
}

// ── Notas ────────────────────────────────────────────────────

export const notasApi = {
  list: (params?: { aluno_id?: number; disciplina?: string; bimestre?: number }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))
    ).toString()
    return get(`/notas.php${qs ? '?' + qs : ''}`)
  },
  boletim: () => get('/notas.php?boletim=1'),
  create:  (data: Record<string, unknown>) => post('/notas.php', data),
  update:  (data: Record<string, unknown>) => put('/notas.php', data),
  delete:  (id: number) => del(`/notas.php?id=${id}`),
}

// ── Presença ─────────────────────────────────────────────────

export const presencaApi = {
  turmas:     () => get('/presenca.php?action=turmas'),
  frequencia: () => get('/presenca.php?action=frequencia'),
  historico:  (params?: { aluno_id?: number; disciplina?: string; data?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))
    ).toString()
    return get(`/presenca.php${qs ? '?' + qs : ''}`)
  },
  salvar: (disciplina: string, data: string, presencas: Array<{ aluno_id: number; status: string; observacao?: string }>) =>
    post('/presenca.php', { disciplina, data, presencas }),
}

// ── Relatórios ───────────────────────────────────────────────

export const relatoriosApi = {
  list:   () => get('/relatorios.php'),
  get:    (id: number) => get(`/relatorios.php?id=${id}`),
  gerar:  (tipo: string, periodo_inicio: string, periodo_fim: string) =>
    post('/relatorios.php', { acao: 'gerar', tipo, periodo_inicio, periodo_fim }),
  nuvem:  (relatorio_id: number) => post('/relatorios.php', { acao: 'marcar_nuvem', relatorio_id }),
}

// ── Usuários ─────────────────────────────────────────────────

export const usuariosApi = {
  list:   () => get('/usuarios.php'),
  create: (data: Record<string, unknown>) => post('/usuarios.php', data),
  update: (data: Record<string, unknown>) => put('/usuarios.php', data),
  toggle: (id: number, ativo: number) => put('/usuarios.php', { id, ativo }),
}

// ── Tokens ───────────────────────────────────────────────────

export const tokensApi = {
  list:   () => get('/tokens.php'),
  create: (data: Record<string, string>) => post('/tokens.php', { acao: 'criar', ...data }),
  toggle: (id: number) => post('/tokens.php', { acao: 'toggle', id }),
  testar: (id: number) => post('/tokens.php', { acao: 'testar', id }),
  delete: (id: number) => del(`/tokens.php?id=${id}`),
}

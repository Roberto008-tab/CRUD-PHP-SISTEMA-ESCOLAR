// ============================================================
//  pages/Dashboard.tsx — Dashboard com dados reais do PHP
// ============================================================
import { useState, useEffect } from 'react'
import { dashboardApi } from '../services/api'
import { DashboardData, CARGO_CORES } from '../types'
import { useAuth } from '../context/AuthContext'

function StatCard({ icon, value, label, change, color }: { icon: string; value: string | number; label: string; change?: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color }}>{icon}</div>
      <div className="stat-info">
        <div className="value">{value}</div>
        <div className="label">{label}</div>
        {change && <div className="change">{change}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    dashboardApi.get()
      .then(res => setData(res.data as DashboardData))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Carregando dashboard…</p></div>
  if (error)   return <div className="alert alert-error">⚠️ {error}</div>
  if (!data)   return null

  const { totais, presenca_semana: ps, notas_disciplinas: nd, logs_recentes, alunos_recentes } = data

  return (
    <>
      {/* STATS */}
      <div className="stats-grid">
        <StatCard icon="👨‍🎓" value={totais.alunos}      label="Alunos Ativos"     change="↑ Matriculados"        color="rgba(16,185,129,.12)" />
        <StatCard icon="👨‍🏫" value={totais.professores} label="Professores"       change="Corpo docente"         color="rgba(99,102,241,.12)" />
        <StatCard icon="📝" value={totais.media_geral || '—'} label="Média Geral" change="Todas disciplinas"     color="rgba(240,165,0,.12)" />
        <StatCard icon="📅" value={`${totais.pct_presenca}%`} label="Presença Semanal" change={`${ps.ausente} ausências`} color="rgba(59,130,246,.12)" />
        <StatCard icon="📊" value={totais.relatorios}   label="Relatórios"        change="Gerados no sistema"    color="rgba(244,63,94,.12)" />
        <StatCard icon="👥" value={totais.usuarios}     label="Usuários"          change="4 níveis de acesso"   color="rgba(240,165,0,.12)" />
      </div>

      {/* ROW 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Médias por disciplina */}
        <div className="card">
          <div className="card-header"><span className="card-title">📊 Médias por Disciplina</span></div>
          {nd.length ? (
            <div className="bar-chart">
              {nd.map(d => {
                const pct   = (d.media / 10) * 100
                const color = d.media >= 7 ? 'var(--emerald)' : d.media >= 5 ? 'var(--gold)' : 'var(--rose)'
                return (
                  <div className="bar-row" key={d.disciplina}>
                    <span className="bar-label">{d.disciplina.slice(0, 10)}</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
                    <span className="bar-val">{d.media.toFixed(1)}</span>
                  </div>
                )
              })}
            </div>
          ) : <div className="empty-state"><div className="icon">📝</div><p>Nenhuma nota lançada ainda.</p></div>}
        </div>

        {/* Presença semanal */}
        <div className="card">
          <div className="card-header"><span className="card-title">📅 Presença — Últimos 7 dias</span></div>
          {(['Presente', 'Ausente', 'Justificado'] as const).map(status => {
            const val    = status === 'Presente' ? ps.presente : status === 'Ausente' ? ps.ausente : ps.justificado
            const pct    = ps.total ? (val / ps.total) * 100 : 0
            const colors = { Presente: 'var(--emerald)', Ausente: 'var(--rose)', Justificado: 'var(--gold)' }
            return (
              <div className="bar-row" key={status} style={{ marginBottom: '.6rem' }}>
                <span className="bar-label">{status}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: colors[status] }} /></div>
                <span className="bar-val">{val}</span>
              </div>
            )
          })}
          <hr className="sep" />
          <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
            Total: <strong style={{ color: 'var(--text)' }}>{ps.total}</strong>
            &nbsp;·&nbsp; Frequência: <strong style={{ color: 'var(--emerald)' }}>{ps.pct}%</strong>
          </div>
        </div>
      </div>

      {/* ROW 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Alunos recentes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">👨‍🎓 Alunos Recentes</span>
            <a href="/alunos" className="btn btn-ghost btn-sm">Ver todos →</a>
          </div>
          {alunos_recentes.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Matrícula</th><th>Nome</th><th>Turma</th><th>Série</th></tr></thead>
                <tbody>
                  {alunos_recentes.map(a => (
                    <tr key={a.id}>
                      <td className="td-code">{a.matricula}</td>
                      <td className="td-name">{a.nome}</td>
                      <td>{a.turma}</td>
                      <td>{a.serie}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="empty-state"><div className="icon">👨‍🎓</div><p>Nenhum aluno cadastrado.</p></div>}
        </div>

        {/* Logs recentes */}
        <div className="card">
          <div className="card-header"><span className="card-title">🕒 Atividade Recente</span></div>
          {logs_recentes.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {logs_recentes.map(l => {
                const cor = CARGO_CORES[(l.cargo ?? 4)] ?? '#888'
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.5rem', background: 'var(--bg3)', borderRadius: 6, fontSize: '.78rem' }}>
                    <div className="avatar" style={{ width: 26, height: 26, fontSize: '.65rem', background: cor, flexShrink: 0 }}>
                      {(l.nome ?? '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong>{l.nome ?? 'Sistema'}</strong>
                      <span style={{ color: 'var(--muted)' }}> · {l.acao} {l.entidade}</span>
                    </div>
                    <span style={{ color: 'var(--muted)', fontSize: '.7rem', whiteSpace: 'nowrap' }}>
                      {l.created_at.slice(11, 16)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : <div className="empty-state"><div className="icon">🕒</div><p>Nenhuma atividade.</p></div>}
        </div>
      </div>

      {/* Boas-vindas */}
      {user && (
        <div style={{ marginTop: '1rem', padding: '.75rem 1rem', background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 8, fontSize: '.8rem', color: 'var(--muted)' }}>
          👋 Bem-vindo(a), <strong style={{ color: 'var(--text)' }}>{user.nome}</strong>! Hoje é {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}.
        </div>
      )}
    </>
  )
}

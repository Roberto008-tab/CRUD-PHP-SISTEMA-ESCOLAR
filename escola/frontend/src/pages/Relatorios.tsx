// ============================================================
//  pages/Relatorios.tsx
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { relatoriosApi } from '../services/api'
import { Relatorio } from '../types'
import { useAuth } from '../context/AuthContext'
import { isDiretor } from '../types'

const TIPOS = ['Semanal', 'Mensal', 'Bimestral', 'Anual']

export default function Relatorios() {
  const { user } = useAuth()
  const cargo    = user?.cargo ?? 4

  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [verRel, setVerRel]         = useState<Relatorio | null>(null)
  const [modal, setModal]           = useState(false)
  const [loading, setLoading]       = useState(true)
  const [msg, setMsg]   = useState('')
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    tipo: 'Semanal',
    periodo_inicio: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    periodo_fim:    new Date().toISOString().split('T')[0],
  })

  // Linha 29: Mudamos o tipo para 'number'
const ref = useRef<number | null>(null)

const showMsg = (m: string, e = false) => {
  e ? (setErro(m), setMsg('')) : (setMsg(m), setErro(''))
  
  // Linha 32: Usamos window.clearTimeout e window.setTimeout
  if (ref.current) window.clearTimeout(ref.current);
  ref.current = window.setTimeout(() => { setMsg(''); setErro('') }, 6000)
}

  useEffect(() => {
    relatoriosApi.list()
      .then(res => setRelatorios(res.data as Relatorio[]))
      .catch(e => showMsg((e as Error).message, true))
      .finally(() => setLoading(false))
  }, [])

  const handleGerar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await relatoriosApi.gerar(form.tipo, form.periodo_inicio, form.periodo_fim)
      const novo = res.data as Relatorio
      setRelatorios(p => [novo, ...p])
      showMsg(`✅ Relatório "${novo.titulo}" gerado!`)
      setModal(false)
    } catch (err: unknown) { showMsg((err as Error).message, true) }
  }

  const handleNuvem = async (id: number) => {
    try {
      await relatoriosApi.nuvem(id)
      setRelatorios(p => p.map(r => r.id === id ? { ...r, enviado_nuvem: 1 } : r))
      if (verRel?.id === id) setVerRel(r => r ? { ...r, enviado_nuvem: 1 } : r)
      showMsg('☁️ Relatório sincronizado com Supabase Cloud!')
    } catch (err: unknown) { showMsg((err as Error).message, true) }
  }

  const abrirRel = async (id: number) => {
    try {
      const res = await relatoriosApi.get(id)
      setVerRel(res.data as Relatorio)
    } catch (err: unknown) { showMsg((err as Error).message, true) }
  }

 const handleEnviarEmail = async (id: number) => {
  const emailDestino = window.prompt("Digite o e-mail do destinatário:")
  if (!emailDestino) return

  try {
    // Usamos 'withCredentials: true' para enviar o login pro PHP
    const res = await fetch('http://localhost:8080/escola/escola/api/relatorios.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'enviar_email', relatorio_id: id, email: emailDestino }),
      // 👇 ESSA LINHA É FUNDAMENTAL 👇
      credentials: 'include' 
    })
    
    const data = await res.json()
    
    if (data.success) {
      showMsg('📧 E-mail enviado com sucesso!')
    } else {
      // Se o PHP responder erro do SendGrid, ele vai aparecer aqui
      showMsg(data.message || 'Erro ao enviar e-mail', true)
    }
  } catch (err: unknown) { 
    showMsg('Erro de conexão ao enviar e-mail', true) 
  }
}

  // Tela de detalhe
  if (verRel) {
    const d    = verRel.dados ?? {}
    const freq = d.frequencia ?? {}
    const pct  = freq.total ? Math.round((freq.presentes ?? 0) / freq.total * 100) : 0

    return (
      <>
        {msg  && <div className="alert alert-success">{msg}</div>}
        {erro && <div className="alert alert-error">⚠️ {erro}</div>}

        <div className="flex items-center gap-2 mb-4">
          <button className="btn btn-ghost btn-sm" onClick={() => setVerRel(null)}>← Voltar</button>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem' }}>{verRel.titulo}</h2>
          {!!verRel.enviado_nuvem && <span className="badge badge-success">☁️ Na Nuvem</span>}
        </div>

        <div className="stats-grid">
          {[
            { icon: '📅', value: `${pct}%`,          label: 'Taxa de Presença',    color: 'rgba(16,185,129,.12)' },
            { icon: '❌', value: freq.ausentes ?? 0,   label: 'Ausências',           color: 'rgba(244,63,94,.12)' },
            { icon: '📝', value: (d.notas ?? []).length, label: 'Disciplinas',       color: 'rgba(59,130,246,.12)' },
            { icon: '👨‍🎓', value: d.novos_alunos ?? 0, label: 'Novos Alunos',       color: 'rgba(240,165,0,.12)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
              <div className="stat-info"><div className="value">{s.value}</div><div className="label">{s.label}</div></div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card">
            <div className="card-header"><span className="card-title">📊 Médias por Disciplina</span></div>
            {(d.notas ?? []).length ? (
              <div className="bar-chart">
                {(d.notas ?? []).map((n: { disciplina: string; media: number }) => {
                  const pct2 = n.media / 10 * 100
                  const col  = n.media >= 7 ? 'var(--emerald)' : n.media >= 5 ? 'var(--gold)' : 'var(--rose)'
                  return (
                    <div className="bar-row" key={n.disciplina}>
                      <span className="bar-label">{n.disciplina.slice(0, 12)}</span>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${pct2}%`, background: col }} /></div>
                      <span className="bar-val">{n.media.toFixed(1)}</span>
                    </div>
                  )
                })}
              </div>
            ) : <p style={{ color: 'var(--muted)', fontSize: '.83rem' }}>Nenhuma nota no período.</p>}
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">📅 Frequência do Período</span></div>
            {(['Presentes', 'Ausentes'] as const).map(label => {
              const val  = label === 'Presentes' ? (freq.presentes ?? 0) : (freq.ausentes ?? 0)
              const pct3 = freq.total ? Math.round(val / freq.total * 100) : 0
              const col  = label === 'Presentes' ? 'var(--emerald)' : 'var(--rose)'
              return (
                <div className="bar-row" key={label} style={{ marginBottom: '.7rem' }}>
                  <span className="bar-label">{label}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${pct3}%`, background: col }} /></div>
                  <span className="bar-val">{val}</span>
                </div>
              )
            })}
            <hr className="sep" />
            <p style={{ fontSize: '.8rem', color: 'var(--muted)' }}>Total: <strong style={{ color: 'var(--text)' }}>{freq.total ?? 0}</strong></p>
          </div>
        </div>

        {d.analise_ia && (
          <div className="card mb-4" style={{ borderColor: 'var(--indigo)' }}>
            <div className="card-header"><span className="card-title">🤖 Análise de IA</span></div>
            <p style={{ fontSize: '.85rem', lineHeight: 1.7 }}>{d.analise_ia}</p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {!verRel.enviado_nuvem && isDiretor(cargo) && (
            <button className="btn btn-gold" onClick={() => handleNuvem(verRel.id)}>☁️ Enviar para Supabase</button>
          )}
          
          {/* 👇 Novo Botão de E-mail 👇 */}
          {isDiretor(cargo) && (
            <button 
              className="btn" 
              style={{ backgroundColor: 'var(--indigo)', color: 'white', border: 'none' }} 
              onClick={() => handleEnviarEmail(verRel.id)}
            >
              📧 Enviar por E-mail
            </button>
          )}
          {/* 👆 Fim do Novo Botão 👆 */}

          <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Imprimir</button>
        </div>
      </>
    )
  }

  return (
    <>
      {msg  && <div className="alert alert-success">{msg}</div>}
      {erro && <div className="alert alert-error">⚠️ {erro}</div>}

      <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
        <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{relatorios.length} relatório(s)</div>
        {isDiretor(cargo) && <button className="btn btn-primary" onClick={() => setModal(true)}>+ Gerar Relatório</button>}
      </div>

      {loading ? (
        <div className="empty-state"><div className="icon">⏳</div><p>Carregando…</p></div>
      ) : relatorios.length ? (
        <div className="report-grid">
          {relatorios.map(r => {
            const freq = r.dados?.frequencia ?? {}
            const pct  = freq.total ? Math.round((freq.presentes ?? 0) / freq.total * 100) : 0
            return (
              <div key={r.id} className="report-card" onClick={() => abrirRel(r.id)}>
                <div className="rtype">{r.tipo}{r.enviado_nuvem ? ' · ☁️ Cloud' : ''}</div>
                <div className="rtitle">{r.titulo}</div>
                <div className="rmeta">
                  Frequência: <strong style={{ color: pct >= 75 ? 'var(--emerald)' : 'var(--rose)' }}>{pct}%</strong>
                  &nbsp;·&nbsp; {r.gerado_por_nome ?? 'Sistema'}
                  &nbsp;·&nbsp; {new Date(r.created_at).toLocaleString('pt-BR')}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state card">
          <div className="icon">📊</div>
          <p>Nenhum relatório gerado ainda.<br />Clique em "+ Gerar Relatório" para começar.</p>
        </div>
      )}

      {/* Modal Gerar */}
      {modal && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">📊 Gerar Novo Relatório</span><button className="modal-close" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <form onSubmit={handleGerar}>
                <div className="form-grid">
                  <div className="form-group"><label>Tipo</label>
                    <select className="form-control" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                      {TIPOS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group" />
                  <div className="form-group"><label>Início</label><input type="date" className="form-control" value={form.periodo_inicio} onChange={e => setForm(p => ({ ...p, periodo_inicio: e.target.value }))} /></div>
                  <div className="form-group"><label>Fim</label><input type="date" className="form-control" value={form.periodo_fim} onChange={e => setForm(p => ({ ...p, periodo_fim: e.target.value }))} /></div>
                </div>
                <div className="alert alert-info mt-2" style={{ fontSize: '.78rem' }}>
                  ℹ️ O relatório consolida dados de presença, notas e matrículas do período selecionado.
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">📊 Gerar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
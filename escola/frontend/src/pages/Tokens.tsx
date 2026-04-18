// ============================================================
//  pages/Tokens.tsx — Gerenciamento de Tokens de API (Admin)
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { tokensApi } from '../services/api'
import { Token } from '../types'

const SERVICOS = ['Supabase','OpenAI','SendGrid','Firebase','AWS S3','Google Cloud','Slack Webhook','Discord Webhook','Custom REST']

const SVC_ICON: Record<string, string> = {
  Supabase: '☁️', OpenAI: '🤖', SendGrid: '📧', Firebase: '🔥',
  'AWS S3': '🟠', 'Google Cloud': '🟡', 'Slack Webhook': '🔔', 'Discord Webhook': '🔔', 'Custom REST': '🔑',
}

const INTEGRACOES = [
  { icon: '☁️', nome: 'Supabase',  desc: 'Banco de dados e armazenamento em nuvem. Usado para backup de relatórios.', cor: 'var(--emerald)' },
  { icon: '🤖', nome: 'OpenAI',    desc: 'Análise inteligente de relatórios e insights pedagógicos com GPT.',           cor: 'var(--indigo2)' },
  { icon: '📧', nome: 'SendGrid',  desc: 'Envio automático de relatórios por e-mail para responsáveis.',               cor: 'var(--blue)' },
  { icon: '🔔', nome: 'Webhooks',  desc: 'Notificações em tempo real para Slack, Discord ou sistemas próprios.',        cor: 'var(--gold)' },
]

export default function Tokens() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [msg, setMsg]   = useState('')
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ nome: '', servico: 'Supabase', token: '', descricao: '' })
  const [show, setShow] = useState<Record<number, boolean>>({})
  const ref = useRef<ReturnType<typeof setTimeout>>()

  const showMsg = (m: string, e = false) => {
    e ? (setErro(m), setMsg('')) : (setMsg(m), setErro(''))
    clearTimeout(ref.current); ref.current = setTimeout(() => { setMsg(''); setErro('') }, 5000)
  }

  useEffect(() => {
    tokensApi.list()
      .then(res => setTokens(res.data as Token[]))
      .catch(e => showMsg((e as Error).message, true))
      .finally(() => setLoading(false))
  }, [])

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await tokensApi.create(form)
      const novo = res.data as Token
      setTokens(p => [novo, ...p])
      showMsg(`✅ Token ${form.nome} adicionado.`)
      setModal(false); setForm({ nome: '', servico: 'Supabase', token: '', descricao: '' })
    } catch (err: unknown) { showMsg((err as Error).message, true) }
  }

  const handleToggle = async (id: number) => {
    try {
      const res = await tokensApi.toggle(id)
      const d   = res.data as { ativo: boolean }
      setTokens(p => p.map(t => t.id === id ? { ...t, ativo: d.ativo ? 1 : 0 } : t))
    } catch (err: unknown) { showMsg((err as Error).message, true) }
  }

  const handleTestar = async (id: number) => {
    try {
      const res = await tokensApi.testar(id)
      showMsg(res.message)
      setTokens(p => p.map(t => t.id === id ? { ...t, ultimo_uso: new Date().toISOString() } : t))
    } catch (err: unknown) { showMsg((err as Error).message, true) }
  }

  const handleDeletar = async (id: number) => {
    if (!confirm('Remover este token?')) return
    try {
      await tokensApi.delete(id)
      setTokens(p => p.filter(t => t.id !== id))
      showMsg('🗑️ Token removido.')
    } catch (err: unknown) { showMsg((err as Error).message, true) }
  }

  return (
    <>
      {msg  && <div className="alert alert-success">{msg}</div>}
      {erro && <div className="alert alert-error">⚠️ {erro}</div>}

      <div className="alert alert-info mb-4">
        🔑 <strong>Gerenciamento de Tokens de API</strong> — Área restrita ao Administrador.
        Os tokens são usados para integrar com serviços de nuvem (Supabase, OpenAI, SendGrid).
      </div>

      <div className="flex justify-between items-center mb-4">
        <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{tokens.length} token(s) configurado(s)</div>
        <button className="btn btn-gold" onClick={() => setModal(true)}>+ Adicionar Token</button>
      </div>

      {/* Cards de integração */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '.8rem', marginBottom: '1.5rem' }}>
        {INTEGRACOES.map(i => (
          <div key={i.nome} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', borderTop: `3px solid ${i.cor}` }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '.3rem' }}>{i.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{i.nome}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '.2rem' }}>{i.desc}</div>
          </div>
        ))}
      </div>

      {/* Lista de tokens */}
      <div className="card">
        <div className="card-header"><span className="card-title">🔑 Tokens Configurados</span></div>
        {loading ? <div className="empty-state"><div className="icon">⏳</div><p>Carregando…</p></div> :
        tokens.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
            {tokens.map(tk => (
              <div key={tk.id} className="token-card">
                <div style={{ fontSize: '1.6rem' }}>{SVC_ICON[tk.servico] ?? '🔑'}</div>
                <div className="token-info" style={{ flex: 1 }}>
                  <div className="svc">{tk.servico}</div>
                  <div className="name">{tk.nome}</div>
                  <div className="token-value">
                    {show[tk.id] ? (tk.token ?? '[token oculto]') : '••••••••••••'}
                  </div>
                  {tk.descricao && <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '.2rem' }}>{tk.descricao}</div>}
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '.3rem' }}>
                    Criado por {tk.criado_por_nome ?? 'Sistema'} · {new Date(tk.created_at).toLocaleDateString('pt-BR')}
                    {tk.ultimo_uso && ` · Último uso: ${new Date(tk.ultimo_uso).toLocaleString('pt-BR')}`}
                  </div>
                </div>
                <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                  <span className={`badge ${tk.ativo ? 'badge-success' : 'badge-danger'}`}>{tk.ativo ? 'Ativo' : 'Inativo'}</span>
                  <button className="btn btn-ghost btn-xs" onClick={() => setShow(p => ({ ...p, [tk.id]: !p[tk.id] }))}>👁</button>
                  <button className="btn btn-ghost btn-xs" onClick={() => handleTestar(tk.id)}>🔌 Testar</button>
                  <button className="btn btn-ghost btn-xs" onClick={() => handleToggle(tk.id)}>{tk.ativo ? '⏸' : '▶'}</button>
                  <button className="btn btn-danger btn-xs" onClick={() => handleDeletar(tk.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="empty-state"><div className="icon">🔑</div><p>Nenhum token configurado.</p></div>}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">🔑 Adicionar Token de API</span><button className="modal-close" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="alert alert-warn mb-3">⚠️ Mantenha tokens em segurança. Nunca compartilhe com usuários sem permissão.</div>
              <form onSubmit={handleCriar}>
                <div className="form-grid">
                  <div className="form-group"><label>Nome *</label><input type="text" className="form-control" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Supabase Produção" /></div>
                  <div className="form-group"><label>Serviço *</label>
                    <select className="form-control" value={form.servico} onChange={e => setForm(p => ({ ...p, servico: e.target.value }))}>
                      {SERVICOS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Token / Chave de API *</label><input type="password" className="form-control" required value={form.token} onChange={e => setForm(p => ({ ...p, token: e.target.value }))} placeholder="sk-... ou eyJ..." /></div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Descrição</label><textarea className="form-control" value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Para que este token é usado?" /></div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-gold">🔑 Salvar Token</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

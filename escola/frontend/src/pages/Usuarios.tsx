// ============================================================
//   pages/Usuarios.tsx — Gestão de usuários (Admin only)
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { usuariosApi } from '../services/api'
import { User, CARGO_NOMES, CARGO_CORES, Cargo } from '../types'
import { useAuth } from '../context/AuthContext'

const CARGOS_LIST = [
  { id: 1, nome: 'Administrador', icon: '👑', desc: 'Acesso total ao sistema.', cor: '#f59e0b' },
  { id: 2, nome: 'Diretor',       icon: '🏫', desc: 'Gestão geral e relatórios.', cor: '#6366f1' },
  { id: 3, nome: 'Secretaria',    icon: '📋', desc: 'Cadastro de alunos e professores.', cor: '#10b981' },
  { id: 4, nome: 'Professor',     icon: '📚', desc: 'Notas e chamadas das suas turmas.', cor: '#3b82f6' },
]

export default function Usuarios() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading]   = useState(true)
  const [msg, setMsg]   = useState('')
  const [erro, setErro] = useState('')
  const [modalCriar, setModalCriar] = useState(false)
  const [modalEdit,  setModalEdit]  = useState(false)
  const [form,      setForm]     = useState({ login: '', senha: '', nome: '', email: '', cargo: 4 })
  const [editForm, setEditForm] = useState({ id: 0, nome: '', email: '', cargo: 4, nova_senha: '' })
  
  const ref = useRef<number | null>(null)

  const showMsg = (m: string, isError = false) => {
    if (isError) {
      setErro(m); setMsg('');
    } else {
      setMsg(m); setErro('');
    }
    if (ref.current) window.clearTimeout(ref.current);
    ref.current = window.setTimeout(() => { setMsg(''); setErro('') }, 5000)
  }

  const carregarUsuarios = async () => {
    try {
      const res = await usuariosApi.list()
      // Garante que 'res' e 'res.data' existem antes de tentar ler
      if (res && res.data) {
        const data = res.data as any
        // Se 'data' for um array, usa direto. Se for um objeto com a propriedade 'usuarios', usa ela. Senão, array vazio.
        setUsuarios(Array.isArray(data) ? data : (data.usuarios || []))
      } else {
         setUsuarios([]) // Evita erro se a API não retornar nada
      }
    } catch (e) {
      showMsg((e as Error).message, true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await usuariosApi.create(form as Record<string, unknown>)
      showMsg(`✅ Usuário ${form.nome} criado.`)
      setModalCriar(false)
      setForm({ login: '', senha: '', nome: '', email: '', cargo: 4 })
      carregarUsuarios()
    } catch (err: unknown) { showMsg((err as Error).message, true) }
  }

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await usuariosApi.update(editForm as Record<string, unknown>)
      showMsg('✅ Usuário atualizado.')
      setModalEdit(false)
      carregarUsuarios()
    } catch (err: unknown) { showMsg((err as Error).message, true) }
  }

  const handleToggle = async (u: User) => {
    if (u.id === user?.id) { showMsg('Você não pode desativar sua própria conta.', true); return }
    try {
      await usuariosApi.toggle(u.id, u.ativo)
      setUsuarios(p => p.map(x => x.id === u.id ? { ...x, ativo: u.ativo ? 0 : 1 } : x))
      showMsg(`Status de ${u.nome} alterado.`)
    } catch (err: unknown) { showMsg((err as Error).message, true) }
  }

  return (
    <>
      {msg  && <div className="alert alert-success">{msg}</div>}
      {erro && <div className="alert alert-error">⚠️ {erro}</div>}

      <div className="card mb-4">
        <div className="card-header"><span className="card-title">🏛️ Hierarquia de Cargos</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.8rem', textAlign: 'center' }}>
          {CARGOS_LIST.map(c => (
            <div key={c.id} style={{ background: 'var(--bg3)', border: `1px solid var(--border)`, borderTop: `3px solid ${c.cor}`, borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>{c.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '.85rem', margin: '.3rem 0', color: c.cor }}>{c.nome}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{c.desc}</div>
              <div style={{ marginTop: '.5rem', fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--border)' }}>Nível {c.id}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{usuarios.length} usuário(s)</div>
        <button className="btn btn-primary" onClick={() => setModalCriar(true)}>+ Novo Usuário</button>
      </div>

      <div className="card">
        {loading ? <div className="empty-state"><div className="icon">⏳</div><p>Carregando…</p></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Login</th><th>E-mail</th><th>Cargo</th><th>Status</th><th>Criado em</th><th>Ações</th></tr></thead>
              <tbody>
                {usuarios.length > 0 ? usuarios.map(u => {
                  const cor = CARGO_CORES[u.cargo as Cargo] ?? '#888'
                  const nom = CARGO_NOMES[u.cargo as Cargo] ?? '?'
                  return (
                    <tr key={u.id}>
                      <td className="td-name">{u.nome}</td>
                      <td className="td-code">{u.login}</td>
                      <td style={{ fontSize: '.8rem' }}>{u.email || '—'}</td>
                      <td><span className="badge" style={{ background: cor }}>{nom}</span></td>
                      <td><span className={`badge ${u.ativo ? 'badge-success' : 'badge-danger'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span></td>
                      <td className="td-code">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                      <td><div className="flex gap-2">
                        <button className="btn btn-ghost btn-xs" onClick={() => { setEditForm({ id: u.id, nome: u.nome, email: u.email ?? '', cargo: u.cargo, nova_senha: '' }); setModalEdit(true) }}>✏️</button>
                        {u.id !== user?.id && <button className="btn btn-ghost btn-xs" onClick={() => handleToggle(u)}>{u.ativo ? '⏸' : '▶'}</button>}
                      </div></td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum usuário encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalCriar && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">👤 Novo Usuário</span>
              <button className="modal-close" onClick={() => setModalCriar(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCriar}>
                <div className="form-grid">
                  <div className="form-group"><label>Nome *</label><input type="text" className="form-control" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
                  <div className="form-group"><label>Login *</label><input type="text" className="form-control" required value={form.login} onChange={e => setForm(p => ({ ...p, login: e.target.value }))} /></div>
                  <div className="form-group"><label>E-mail</label><input type="email" className="form-control" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className="form-group"><label>Senha *</label><input type="password" className="form-control" required value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} /></div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Cargo</label>
                    <select className="form-control" value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: +e.target.value }))}>
                      {CARGOS_LIST.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setModalCriar(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">💾 Criar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {modalEdit && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">✏️ Editar Usuário</span>
              <button className="modal-close" onClick={() => setModalEdit(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditar}>
                <div className="form-grid">
                  <div className="form-group"><label>Nome *</label><input type="text" className="form-control" required value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} /></div>
                  <div className="form-group"><label>E-mail</label><input type="email" className="form-control" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className="form-group"><label>Cargo</label>
                    <select className="form-control" value={editForm.cargo} onChange={e => setEditForm(p => ({ ...p, cargo: +e.target.value }))}>
                      {CARGOS_LIST.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Nova Senha (opcional)</label><input type="password" className="form-control" value={editForm.nova_senha} onChange={e => setEditForm(p => ({ ...p, nova_senha: e.target.value }))} /></div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setModalEdit(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">💾 Salvar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
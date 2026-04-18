// ============================================================
//  pages/Professores.tsx — CRUD via API PHP
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { professoresApi } from '../services/api'
import { Professor } from '../types'
import { useAuth } from '../context/AuthContext'
import { canEdit, canDelete } from '../types'

const EMPTY: Partial<Professor> = { nome:'', email:'', telefone:'', disciplina:'', formacao:'', turmas:'' }

export default function Professores() {
  const { user } = useAuth()
  const cargo    = user?.cargo ?? 4

  const [profs, setProfs]     = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')
  const [erro, setErro]       = useState('')
  const [q, setQ]             = useState('')
  const [modalCriar, setModalCriar] = useState(false)
  const [modalEdit,  setModalEdit]  = useState(false)
  const [form, setForm]             = useState<Partial<Professor>>(EMPTY)
  const ref = useRef<ReturnType<typeof setTimeout>>()

  const showMsg = (m: string, e = false) => {
    e ? (setErro(m), setMsg('')) : (setMsg(m), setErro(''))
    clearTimeout(ref.current); ref.current = setTimeout(() => { setMsg(''); setErro('') }, 5000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await professoresApi.list(q)
      const d   = res.data as { professores: Professor[] }
      setProfs(d.professores)
    } catch (e: unknown) { showMsg((e as Error).message, true) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [q])

  const f = (k: keyof Professor) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: ev.target.value }))

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await professoresApi.create(form as Record<string, string>)
      const novo = res.data as Professor
      setProfs(p => [novo, ...p])
      showMsg(`✅ Professor ${novo.nome} cadastrado (${novo.registro}).`)
      setModalCriar(false); setForm(EMPTY)
    } catch (e: unknown) { showMsg((e as Error).message, true) }
  }

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await professoresApi.update(form as Record<string, unknown>)
      const upd = res.data as Professor
      setProfs(p => p.map(x => x.id === upd.id ? upd : x))
      showMsg('✅ Professor atualizado.')
      setModalEdit(false)
    } catch (e: unknown) { showMsg((e as Error).message, true) }
  }

  const handleDeletar = async (id: number, nome: string) => {
    if (!confirm(`Remover "${nome}"?`)) return
    try {
      await professoresApi.delete(id)
      setProfs(p => p.filter(x => x.id !== id))
      showMsg('🗑️ Professor removido.')
    } catch (e: unknown) { showMsg((e as Error).message, true) }
  }

  return (
    <>
      {msg  && <div className="alert alert-success" dangerouslySetInnerHTML={{ __html: msg }} />}
      {erro && <div className="alert alert-error">⚠️ {erro}</div>}

      <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
        <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{profs.length} professor(es)</div>
        {canEdit(cargo) && <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModalCriar(true) }}>+ Novo Professor</button>}
      </div>

      <div className="card mb-4">
        <div className="flex gap-2 flex-wrap items-center">
          <input type="text" className="form-control" placeholder="🔍 Nome, registro, disciplina..." value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 320 }} />
          {q && <button className="btn btn-ghost" onClick={() => setQ('')}>Limpar</button>}
        </div>
      </div>

      <div className="card">
        {loading ? <div className="empty-state"><div className="icon">⏳</div><p>Carregando…</p></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Registro</th><th>Nome</th><th>Disciplina</th><th>Formação</th><th>Turmas</th><th>Contato</th>
                {canEdit(cargo) && <th>Ações</th>}
              </tr></thead>
              <tbody>
                {profs.length ? profs.map(p => (
                  <tr key={p.id}>
                    <td className="td-code">{p.registro}</td>
                    <td className="td-name">{p.nome}</td>
                    <td><span className="badge badge-info">{p.disciplina || '—'}</span></td>
                    <td style={{ fontSize: '.78rem' }}>{p.formacao || '—'}</td>
                    <td style={{ fontSize: '.78rem', fontFamily: 'var(--font-mono)' }}>{p.turmas || '—'}</td>
                    <td style={{ fontSize: '.78rem' }}>{p.email || '—'}</td>
                    {canEdit(cargo) && (
                      <td><div className="flex gap-2">
                        <button className="btn btn-ghost btn-xs" onClick={() => { setForm({ ...p }); setModalEdit(true) }}>✏️ Editar</button>
                        {canDelete(cargo) && <button className="btn btn-danger btn-xs" onClick={() => handleDeletar(p.id, p.nome)}>🗑️</button>}
                      </div></td>
                    )}
                  </tr>
                )) : <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Nenhum professor encontrado</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar */}
      {modalCriar && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">👨‍🏫 Novo Professor</span><button className="modal-close" onClick={() => setModalCriar(false)}>✕</button></div>
            <div className="modal-body"><form onSubmit={handleCriar}><ProfForm form={form} f={f} />
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalCriar(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">💾 Cadastrar</button>
              </div>
            </form></div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modalEdit && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">✏️ Editar Professor</span><button className="modal-close" onClick={() => setModalEdit(false)}>✕</button></div>
            <div className="modal-body"><form onSubmit={handleEditar}><ProfForm form={form} f={f} />
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalEdit(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">💾 Salvar</button>
              </div>
            </form></div>
          </div>
        </div>
      )}
    </>
  )
}

function ProfForm({ form, f }: { form: Partial<Professor>; f: (k: keyof Professor) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void }) {
  return (
    <div className="form-grid">
      <div className="form-group"><label>Nome Completo *</label><input type="text" className="form-control" value={form.nome ?? ''} onChange={f('nome')} required /></div>
      <div className="form-group"><label>E-mail</label><input type="email" className="form-control" value={form.email ?? ''} onChange={f('email')} /></div>
      <div className="form-group"><label>Telefone</label><input type="text" className="form-control" value={form.telefone ?? ''} onChange={f('telefone')} /></div>
      <div className="form-group"><label>Disciplina</label><input type="text" className="form-control" value={form.disciplina ?? ''} onChange={f('disciplina')} placeholder="Ex: Matemática" /></div>
      <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Formação Acadêmica</label><input type="text" className="form-control" value={form.formacao ?? ''} onChange={f('formacao')} placeholder="Ex: Lic. Matemática - USP" /></div>
      <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Turmas (vírgula)</label><input type="text" className="form-control" value={form.turmas ?? ''} onChange={f('turmas')} placeholder="7A,8A,9B" /></div>
    </div>
  )
}

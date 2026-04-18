// ============================================================
//  pages/Alunos.tsx — CRUD completo via API PHP
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { alunosApi } from '../services/api'
import { Aluno } from '../types'
import { useAuth } from '../context/AuthContext'
import { canEdit, canDelete } from '../types'

const SERIES   = ['6º Ano','7º Ano','8º Ano','9º Ano','1º EM','2º EM','3º EM']
const TURNOS   = ['Matutino','Vespertino','Noturno']
const EMPTY: Partial<Aluno> = { nome:'', email:'', telefone:'', data_nascimento:'', turma:'', serie:'6º Ano', turno:'Matutino', responsavel:'', tel_responsavel:'', endereco:'', observacoes:'' }

export default function Alunos() {
  const { user } = useAuth()
  const cargo    = user?.cargo ?? 4

  const [alunos, setAlunos]   = useState<Aluno[]>([])
  const [turmas, setTurmas]   = useState<string[]>([])
  const [series, setSeries]   = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')
  const [erro, setErro]       = useState('')

  // Filtros
  const [q, setQ]           = useState('')
  const [fTurma, setFTurma] = useState('')
  const [fSerie, setFSerie] = useState('')

  // Modais
  const [modalCriar, setModalCriar] = useState(false)
  const [modalEdit,  setModalEdit]  = useState(false)
  const [form,       setForm]       = useState<Partial<Aluno>>(EMPTY)

  const msgRef = useRef<ReturnType<typeof setTimeout>>()

  const showMsg = (m: string, isErr = false) => {
    if (isErr) { setErro(m); setMsg('') } else { setMsg(m); setErro('') }
    clearTimeout(msgRef.current)
    msgRef.current = setTimeout(() => { setMsg(''); setErro('') }, 5000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await alunosApi.list({ q, turma: fTurma, serie: fSerie })
      const d   = res.data as { alunos: Aluno[]; turmas: string[]; series: string[] }
      setAlunos(d.alunos)
      setTurmas(d.turmas)
      setSeries(d.series)
    } catch (e: unknown) { showMsg((e as Error).message, true) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [q, fTurma, fSerie])

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await alunosApi.create(form as Record<string, string>)
      const novo = res.data as Aluno
      setAlunos(p => [novo, ...p])
      showMsg(`✅ Aluno ${novo.nome} cadastrado (matrícula ${novo.matricula}).`)
      setModalCriar(false)
      setForm(EMPTY)
    } catch (e: unknown) { showMsg((e as Error).message, true) }
  }

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await alunosApi.update(form as Record<string, unknown>)
      const upd = res.data as Aluno
      setAlunos(p => p.map(a => a.id === upd.id ? upd : a))
      showMsg('✅ Dados atualizados.')
      setModalEdit(false)
    } catch (e: unknown) { showMsg((e as Error).message, true) }
  }

  const handleDeletar = async (id: number, nome: string) => {
    if (!confirm(`Remover o aluno "${nome}"?`)) return
    try {
      await alunosApi.delete(id)
      setAlunos(p => p.filter(a => a.id !== id))
      showMsg(`🗑️ Aluno removido.`)
    } catch (e: unknown) { showMsg((e as Error).message, true) }
  }

  const openEdit = (a: Aluno) => { setForm({ ...a }); setModalEdit(true) }
  const f = (k: keyof Aluno) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <>
      {msg  && <div className="alert alert-success" dangerouslySetInnerHTML={{ __html: msg }} />}
      {erro && <div className="alert alert-error">⚠️ {erro}</div>}

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
        <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{alunos.length} aluno(s) encontrado(s)</div>
        {canEdit(cargo) && <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModalCriar(true) }}>+ Novo Aluno</button>}
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="flex gap-2 flex-wrap items-center">
          <input type="text" className="form-control" placeholder="🔍 Nome, matrícula..." value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 260 }} />
          <select className="form-control" style={{ maxWidth: 120 }} value={fTurma} onChange={e => setFTurma(e.target.value)}>
            <option value="">Turma</option>
            {turmas.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="form-control" style={{ maxWidth: 140 }} value={fSerie} onChange={e => setFSerie(e.target.value)}>
            <option value="">Série</option>
            {series.map(s => <option key={s}>{s}</option>)}
          </select>
          {(q || fTurma || fSerie) && <button className="btn btn-ghost" onClick={() => { setQ(''); setFTurma(''); setFSerie('') }}>Limpar</button>}
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="icon">⏳</div><p>Carregando…</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Matrícula</th><th>Nome</th><th>Turma</th><th>Série</th>
                  <th>Turno</th><th>Responsável</th><th>Status</th>
                  {canEdit(cargo) && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {alunos.length ? alunos.map(a => (
                  <tr key={a.id}>
                    <td className="td-code">{a.matricula}</td>
                    <td className="td-name">{a.nome}</td>
                    <td>{a.turma}</td>
                    <td>{a.serie}</td>
                    <td><span className="badge badge-info">{a.turno}</span></td>
                    <td style={{ fontSize: '.8rem' }}>{a.responsavel || '—'}</td>
                    <td><span className="badge badge-success">Ativo</span></td>
                    {canEdit(cargo) && (
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-xs" onClick={() => openEdit(a)}>✏️ Editar</button>
                          {canDelete(cargo) && (
                            <button className="btn btn-danger btn-xs" onClick={() => handleDeletar(a.id, a.nome)}>🗑️</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={canEdit(cargo) ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Nenhum aluno encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar */}
      {modalCriar && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">👨‍🎓 Novo Aluno</span>
              <button className="modal-close" onClick={() => setModalCriar(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCriar}>
                <AlunoFormFields form={form} f={f} series={SERIES} turnos={TURNOS} />
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setModalCriar(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">💾 Cadastrar Aluno</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modalEdit && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">✏️ Editar Aluno</span>
              <button className="modal-close" onClick={() => setModalEdit(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditar}>
                <AlunoFormFields form={form} f={f} series={SERIES} turnos={TURNOS} />
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setModalEdit(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">💾 Salvar Alterações</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Form Fields reutilizável ─────────────────────────────────
function AlunoFormFields({ form, f, series, turnos }: {
  form: Partial<Aluno>
  f: (k: keyof Aluno) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  series: string[]; turnos: string[]
}) {
  return (
    <div className="form-grid">
      <div className="form-group"><label>Nome Completo *</label><input type="text" className="form-control" value={form.nome ?? ''} onChange={f('nome')} required /></div>
      <div className="form-group"><label>E-mail</label><input type="email" className="form-control" value={form.email ?? ''} onChange={f('email')} /></div>
      <div className="form-group"><label>Telefone</label><input type="text" className="form-control" value={form.telefone ?? ''} onChange={f('telefone')} placeholder="(11) 9999-0000" /></div>
      <div className="form-group"><label>Nascimento</label><input type="date" className="form-control" value={form.data_nascimento ?? ''} onChange={f('data_nascimento')} /></div>
      <div className="form-group"><label>Turma</label><input type="text" className="form-control" value={form.turma ?? ''} onChange={f('turma')} placeholder="A, B, C..." /></div>
      <div className="form-group"><label>Série</label>
        <select className="form-control" value={form.serie ?? '6º Ano'} onChange={f('serie')}>
          {series.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-group"><label>Turno</label>
        <select className="form-control" value={form.turno ?? 'Matutino'} onChange={f('turno')}>
          {turnos.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="form-group"><label>Responsável</label><input type="text" className="form-control" value={form.responsavel ?? ''} onChange={f('responsavel')} /></div>
      <div className="form-group"><label>Tel. Responsável</label><input type="text" className="form-control" value={form.tel_responsavel ?? ''} onChange={f('tel_responsavel')} /></div>
      <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Endereço</label><input type="text" className="form-control" value={form.endereco ?? ''} onChange={f('endereco')} /></div>
      <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Observações</label><textarea className="form-control" value={form.observacoes ?? ''} onChange={f('observacoes')} /></div>
    </div>
  )
}

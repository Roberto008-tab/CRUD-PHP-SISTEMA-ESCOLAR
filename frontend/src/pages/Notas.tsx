// ============================================================
//  pages/Notas.tsx — Lançamentos + Boletim via API PHP
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { notasApi } from '../services/api'
import { Nota, MediaBoletim, Aluno } from '../types'
import { useAuth } from '../context/AuthContext'
import { canDelete } from '../types'

const TIPOS     = ['Prova','Trabalho','Atividade','Projeto','Recuperação']
const BIMESTRES = [1, 2, 3, 4]

function notaClass(n: number) {
  if (n >= 8) return 'nota-a'
  if (n >= 6) return 'nota-b'
  if (n >= 5) return 'nota-c'
  return 'nota-d'
}

export default function Notas() {
  const { user } = useAuth()
  const cargo    = user?.cargo ?? 4

  const [tab, setTab]         = useState<'lancamentos' | 'boletim'>('lancamentos')
  const [notas, setNotas]     = useState<Nota[]>([])
  const [boletim, setBoletim] = useState<MediaBoletim[]>([])
  const [alunos, setAlunos]   = useState<Aluno[]>([])
  const [discs, setDiscs]     = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')
  const [erro, setErro]       = useState('')

  // Filtros
  const [fAluno, setFAluno] = useState(0)
  const [fDisc, setFDisc]   = useState('')
  const [fBim, setFBim]     = useState(0)

  // Modal criar
  const [modal, setModal]     = useState(false)
  const [modalEdit, setModalEdit] = useState(false)
  const [form, setForm] = useState({ aluno_id: 0, disciplina: '', bimestre: 1, nota: '', tipo: 'Prova', observacao: '' })
  const [editForm, setEditForm] = useState({ id: 0, nota: '', observacao: '' })

  const ref = useRef<ReturnType<typeof setTimeout>>()
  const showMsg = (m: string, e = false) => {
    e ? (setErro(m), setMsg('')) : (setMsg(m), setErro(''))
    clearTimeout(ref.current); ref.current = setTimeout(() => { setMsg(''); setErro('') }, 5000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await notasApi.list({ aluno_id: fAluno || undefined, disciplina: fDisc || undefined, bimestre: fBim || undefined })
      const d   = res.data as { notas: Nota[]; alunos: Aluno[]; disciplinas: string[] }
      setNotas(d.notas); setAlunos(d.alunos); setDiscs(d.disciplinas)
    } catch (e: unknown) { showMsg((e as Error).message, true) }
    finally { setLoading(false) }
  }

  const loadBoletim = async () => {
    try {
      const res = await notasApi.boletim()
      setBoletim(res.data as MediaBoletim[])
    } catch (e: unknown) { showMsg((e as Error).message, true) }
  }

  useEffect(() => { load() }, [fAluno, fDisc, fBim])
  useEffect(() => { if (tab === 'boletim') loadBoletim() }, [tab])

  const handleLancar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await notasApi.create({ ...form, nota: parseFloat(form.nota), aluno_id: form.aluno_id })
      const nova = res.data as Nota
      setNotas(p => [nova, ...p])
      showMsg(`✅ Nota ${form.nota} lançada.`)
      setModal(false)
      setForm({ aluno_id: 0, disciplina: '', bimestre: 1, nota: '', tipo: 'Prova', observacao: '' })
    } catch (e: unknown) { showMsg((e as Error).message, true) }
  }

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await notasApi.update({ id: editForm.id, nota: parseFloat(editForm.nota), observacao: editForm.observacao })
      setNotas(p => p.map(n => n.id === editForm.id ? { ...n, nota: parseFloat(editForm.nota), observacao: editForm.observacao } : n))
      showMsg('✅ Nota atualizada.')
      setModalEdit(false)
    } catch (e: unknown) { showMsg((e as Error).message, true) }
  }

  const handleDeletar = async (id: number) => {
    if (!confirm('Remover esta nota?')) return
    try {
      await notasApi.delete(id)
      setNotas(p => p.filter(n => n.id !== id))
      showMsg('🗑️ Nota removida.')
    } catch (e: unknown) { showMsg((e as Error).message, true) }
  }

  return (
    <>
      {msg  && <div className="alert alert-success" dangerouslySetInnerHTML={{ __html: msg }} />}
      {erro && <div className="alert alert-error">⚠️ {erro}</div>}

      <div className="tabs">
        <button className={`tab ${tab === 'lancamentos' ? 'active' : ''}`} onClick={() => setTab('lancamentos')}>📝 Lançamentos</button>
        <button className={`tab ${tab === 'boletim' ? 'active' : ''}`} onClick={() => setTab('boletim')}>📋 Boletim</button>
      </div>

      {/* ABA LANÇAMENTOS */}
      {tab === 'lancamentos' && (
        <>
          <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
            <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{notas.length} lançamentos</div>
            <button className="btn btn-primary" onClick={() => setModal(true)}>+ Lançar Nota</button>
          </div>

          <div className="card mb-4">
            <div className="flex gap-2 flex-wrap items-center">
              <select className="form-control" style={{ maxWidth: 200 }} value={fAluno} onChange={e => setFAluno(+e.target.value)}>
                <option value={0}>Todos os alunos</option>
                {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
              <select className="form-control" style={{ maxWidth: 160 }} value={fDisc} onChange={e => setFDisc(e.target.value)}>
                <option value="">Disciplina</option>
                {discs.map(d => <option key={d}>{d}</option>)}
              </select>
              <select className="form-control" style={{ maxWidth: 130 }} value={fBim} onChange={e => setFBim(+e.target.value)}>
                <option value={0}>Bimestre</option>
                {BIMESTRES.map(b => <option key={b} value={b}>{b}º Bimestre</option>)}
              </select>
              {(fAluno || fDisc || fBim) && <button className="btn btn-ghost" onClick={() => { setFAluno(0); setFDisc(''); setFBim(0) }}>Limpar</button>}
            </div>
          </div>

          <div className="card">
            {loading ? <div className="empty-state"><div className="icon">⏳</div><p>Carregando…</p></div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Aluno</th><th>Matrícula</th><th>Disciplina</th><th>Bim.</th><th>Nota</th><th>Tipo</th><th>Data</th><th>Ações</th></tr></thead>
                  <tbody>
                    {notas.length ? notas.map(n => (
                      <tr key={n.id}>
                        <td className="td-name">{n.aluno_nome}</td>
                        <td className="td-code">{n.matricula}</td>
                        <td>{n.disciplina}</td>
                        <td style={{ textAlign: 'center' }}>{n.bimestre}º</td>
                        <td style={{ textAlign: 'center' }}><span className={`nota-chip ${notaClass(n.nota)}`}>{n.nota.toFixed(1)}</span></td>
                        <td><span className="badge badge-info">{n.tipo}</span></td>
                        <td className="td-code">{n.data_lancamento}</td>
                        <td><div className="flex gap-2">
                          <button className="btn btn-ghost btn-xs" onClick={() => { setEditForm({ id: n.id, nota: String(n.nota), observacao: n.observacao ?? '' }); setModalEdit(true) }}>✏️</button>
                          {canDelete(cargo) && <button className="btn btn-danger btn-xs" onClick={() => handleDeletar(n.id)}>🗑️</button>}
                        </div></td>
                      </tr>
                    )) : <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Nenhuma nota encontrada</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ABA BOLETIM */}
      {tab === 'boletim' && (
        <div className="card">
          <div className="card-header"><span className="card-title">📋 Boletim Geral por Disciplina</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Aluno</th><th>Matrícula</th><th>Disciplina</th><th>1º</th><th>2º</th><th>3º</th><th>4º</th><th>Média</th><th>Situação</th></tr></thead>
              <tbody>
                {boletim.map((m, i) => {
                  const media = m.media ?? 0
                  const [sit, cls] = media >= 6 ? ['Aprovado','badge-success'] : media >= 5 ? ['Recuperação','badge-warn'] : ['Reprovado','badge-danger']
                  return (
                    <tr key={i}>
                      <td className="td-name">{m.nome}</td>
                      <td className="td-code">{m.matricula}</td>
                      <td>{m.disciplina}</td>
                      {([m.b1, m.b2, m.b3, m.b4]).map((v, bi) => (
                        <td key={bi} style={{ textAlign: 'center' }}>
                          {v != null ? <span className={`nota-chip ${notaClass(v)}`}>{v.toFixed(1)}</span> : '—'}
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{media.toFixed(1)}</td>
                      <td><span className={`badge ${cls}`}>{sit}</span></td>
                    </tr>
                  )
                })}
                {!boletim.length && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Nenhum dado disponível</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Lançar */}
      {modal && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">📝 Lançar Nota</span><button className="modal-close" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <form onSubmit={handleLancar}>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Aluno *</label>
                    <select className="form-control" required value={form.aluno_id} onChange={e => setForm(p => ({ ...p, aluno_id: +e.target.value }))}>
                      <option value={0}>— Selecione —</option>
                      {alunos.map(a => <option key={a.id} value={a.id}>{a.nome} ({a.matricula})</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Disciplina *</label><input type="text" className="form-control" required value={form.disciplina} onChange={e => setForm(p => ({ ...p, disciplina: e.target.value }))} placeholder="Ex: Matemática" /></div>
                  <div className="form-group"><label>Nota (0–10) *</label><input type="number" className="form-control" required step="0.1" min="0" max="10" value={form.nota} onChange={e => setForm(p => ({ ...p, nota: e.target.value }))} /></div>
                  <div className="form-group"><label>Bimestre</label>
                    <select className="form-control" value={form.bimestre} onChange={e => setForm(p => ({ ...p, bimestre: +e.target.value }))}>
                      {BIMESTRES.map(b => <option key={b} value={b}>{b}º Bimestre</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Tipo</label>
                    <select className="form-control" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                      {TIPOS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Observação</label><textarea className="form-control" rows={2} value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} /></div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">💾 Lançar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Nota */}
      {modalEdit && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">✏️ Editar Nota</span><button className="modal-close" onClick={() => setModalEdit(false)}>✕</button></div>
            <div className="modal-body">
              <form onSubmit={handleEditar}>
                <div className="form-grid">
                  <div className="form-group"><label>Nota (0–10)</label><input type="number" className="form-control" step="0.1" min="0" max="10" value={editForm.nota} onChange={e => setEditForm(p => ({ ...p, nota: e.target.value }))} /></div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Observação</label><textarea className="form-control" value={editForm.observacao} onChange={e => setEditForm(p => ({ ...p, observacao: e.target.value }))} /></div>
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

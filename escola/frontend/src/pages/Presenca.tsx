// ============================================================
//  pages/Presenca.tsx — Chamada, Histórico e Frequência
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { presencaApi } from '../services/api'
// Correção: Apelidando o tipo Presenca para PresencaType
import { Presenca as PresencaType, FrequenciaAluno, Aluno } from '../types' 

type Status = 'Presente' | 'Ausente' | 'Justificado'

interface ChamadaItem { aluno: Aluno; status: Status; obs: string }

export default function Presenca() {
  const [tab, setTab] = useState<'chamada' | 'historico' | 'frequencia'>('chamada')

  // Chamada
  const [allAlunos, setAllAlunos]  = useState<Aluno[]>([])
  const [turmas, setTurmas]        = useState<string[]>([])
  const [cfgDisc, setCfgDisc]      = useState('')
  const [cfgData, setCfgData]      = useState(new Date().toISOString().split('T')[0])
  const [cfgTurma, setCfgTurma]    = useState('')
  const [lista, setLista]          = useState<ChamadaItem[]>([])
  const [chamadaAberta, setChamadaAberta] = useState(false)

  // Histórico (Usando PresencaType aqui)
  const [historico, setHistorico]  = useState<PresencaType[]>([]) 
  const [discsHist, setDiscsHist]  = useState<string[]>([])
  const [fAluno, setFAluno]        = useState(0)
  const [fDisc, setFDisc]          = useState('')
  const [fData, setFData]          = useState('')

  // Frequência
  const [frequencia, setFrequencia] = useState<FrequenciaAluno[]>([])

  const [msg, setMsg]   = useState('')
  const [erro, setErro] = useState('')
  const ref = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)  
  const showMsg = (m: string, e = false) => {
    e ? (setErro(m), setMsg('')) : (setMsg(m), setErro(''))
    clearTimeout(ref.current); ref.current = setTimeout(() => { setMsg(''); setErro('') }, 5000)
  }

  useEffect(() => {
    presencaApi.turmas().then(res => {
      const d = res.data as { alunos: Aluno[]; turmas: string[]; disciplinas: string[] }
      setAllAlunos(d.alunos); setTurmas(d.turmas); setDiscsHist(d.disciplinas)
    }).catch(e => showMsg((e as Error).message, true))
  }, [])

  useEffect(() => {
    if (tab === 'historico') {
      presencaApi.historico({ aluno_id: fAluno || undefined, disciplina: fDisc || undefined, data: fData || undefined })
        // Usando PresencaType aqui também
        .then(res => setHistorico(res.data as PresencaType[])) 
        .catch(e => showMsg((e as Error).message, true))
    }
    if (tab === 'frequencia') {
      presencaApi.frequencia()
        .then(res => setFrequencia(res.data as FrequenciaAluno[]))
        .catch(e => showMsg((e as Error).message, true))
    }
  }, [tab, fAluno, fDisc, fData])

  const carregarChamada = () => {
    if (!cfgDisc || !cfgData) { showMsg('Preencha disciplina e data.', true); return }
    const filtrados = cfgTurma ? allAlunos.filter(a => a.turma === cfgTurma) : allAlunos
    if (!filtrados.length) { showMsg('Nenhum aluno encontrado para esta turma.', true); return }
    setLista(filtrados.map(a => ({ aluno: a, status: 'Presente', obs: '' })))
    setChamadaAberta(true)
  }

  const marcarTodos = (status: Status) => setLista(p => p.map(i => ({ ...i, status })))

  const setStatus = (alunoId: number, status: Status) =>
    setLista(p => p.map(i => i.aluno.id === alunoId ? { ...i, status } : i))

  const setObs = (alunoId: number, obs: string) =>
    setLista(p => p.map(i => i.aluno.id === alunoId ? { ...i, obs } : i))

  const salvarChamada = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await presencaApi.salvar(cfgDisc, cfgData, lista.map(i => ({ aluno_id: i.aluno.id, status: i.status, observacao: i.obs })))
      showMsg(`✅ Chamada registrada: ${cfgDisc} em ${cfgData}.`)
      setChamadaAberta(false); setLista([])
    } catch (err: unknown) { showMsg((err as Error).message, true) }
  }

  const dotColor = (s: Status) => s === 'Presente' ? 'var(--emerald)' : s === 'Ausente' ? 'var(--rose)' : 'var(--gold)'

  return (
    <>
      {msg  && <div className="alert alert-success">{msg}</div>}
      {erro && <div className="alert alert-error">⚠️ {erro}</div>}

      <div className="tabs">
        <button className={`tab ${tab === 'chamada' ? 'active' : ''}`} onClick={() => setTab('chamada')}>📋 Fazer Chamada</button>
        <button className={`tab ${tab === 'historico' ? 'active' : ''}`} onClick={() => setTab('historico')}>🕒 Histórico</button>
        <button className={`tab ${tab === 'frequencia' ? 'active' : ''}`} onClick={() => setTab('frequencia')}>📊 Frequência</button>
      </div>

      {/* ABA CHAMADA */}
      {tab === 'chamada' && (
        <>
          <div className="card mb-4">
            <div className="card-header"><span className="card-title">⚙️ Configurar Chamada</span></div>
            <div className="form-grid">
              <div className="form-group"><label>Disciplina</label><input type="text" className="form-control" value={cfgDisc} onChange={e => setCfgDisc(e.target.value)} placeholder="Ex: Matemática" /></div>
              <div className="form-group"><label>Data</label><input type="date" className="form-control" value={cfgData} onChange={e => setCfgData(e.target.value)} /></div>
              <div className="form-group">
                <label>Turma (opcional)</label>
                <select className="form-control" value={cfgTurma} onChange={e => setCfgTurma(e.target.value)}>
                  <option value="">Todas</option>
                  {turmas.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                <button className="btn btn-primary w-full" onClick={carregarChamada}>📋 Carregar Alunos</button>
              </div>
            </div>
          </div>

          {chamadaAberta && (
            <form onSubmit={salvarChamada}>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">👨‍🎓 {lista.length} aluno(s) — {cfgDisc} · {cfgData}</span>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => marcarTodos('Presente')}>✅ Todos Presentes</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => marcarTodos('Ausente')}>❌ Todos Ausentes</button>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Matrícula</th><th>Nome</th><th>Turma</th><th>Status</th><th>Obs.</th></tr></thead>
                    <tbody>
                      {lista.map((item, i) => (
                        <tr key={item.aluno.id}>
                          <td className="td-code">{i + 1}</td>
                          <td className="td-code">{item.aluno.matricula}</td>
                          <td className="td-name">{item.aluno.nome}</td>
                          <td>{item.aluno.turma}</td>
                          <td>
                            {(['Presente','Ausente','Justificado'] as Status[]).map(s => (
                              <label key={s} style={{ marginRight: '.5rem', fontSize: '.8rem', cursor: 'pointer' }}>
                                <input type="radio" name={`s_${item.aluno.id}`} checked={item.status === s} onChange={() => setStatus(item.aluno.id, s)} />
                                {' '}{s === 'Presente' ? '✅' : s === 'Ausente' ? '❌' : '📋'} {s}
                              </label>
                            ))}
                          </td>
                          <td><input type="text" className="form-control" style={{ maxWidth: 160 }} placeholder="Obs..." value={item.obs} onChange={e => setObs(item.aluno.id, e.target.value)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary">💾 Salvar Chamada</button>
                </div>
              </div>
            </form>
          )}
        </>
      )}

      {/* ABA HISTÓRICO */}
      {tab === 'historico' && (
        <>
          <div className="card mb-4">
            <div className="flex gap-2 flex-wrap items-center">
              <select className="form-control" style={{ maxWidth: 200 }} value={fAluno} onChange={e => setFAluno(+e.target.value)}>
                <option value={0}>Todos os alunos</option>
                {allAlunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
              <select className="form-control" style={{ maxWidth: 160 }} value={fDisc} onChange={e => setFDisc(e.target.value)}>
                <option value="">Disciplina</option>
                {discsHist.map(d => <option key={d}>{d}</option>)}
              </select>
              <input type="date" className="form-control" style={{ maxWidth: 160 }} value={fData} onChange={e => setFData(e.target.value)} />
              {(fAluno || fDisc || fData) && <button className="btn btn-ghost" onClick={() => { setFAluno(0); setFDisc(''); setFData('') }}>Limpar</button>}
            </div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Data</th><th>Aluno</th><th>Matrícula</th><th>Turma</th><th>Disciplina</th><th>Status</th><th>Observação</th></tr></thead>
                <tbody>
                  {historico.length ? historico.map(h => (
                    <tr key={h.id}>
                      <td className="td-code">{new Date(h.data + 'T00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="td-name">{h.aluno_nome}</td>
                      <td className="td-code">{h.matricula}</td>
                      <td>{h.turma}</td>
                      <td>{h.disciplina}</td>
                      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor(h.status), display: 'inline-block' }} />
                        {h.status}
                      </span></td>
                      <td style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{h.observacao}</td>
                    </tr>
                  )) : <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Nenhum registro encontrado</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ABA FREQUÊNCIA */}
      {tab === 'frequencia' && (
        <div className="card">
          <div className="card-header"><span className="card-title">📊 Frequência por Aluno</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Aluno</th><th>Matrícula</th><th>Turma</th><th>Total</th><th>Presentes</th><th>Ausentes</th><th>Justific.</th><th>Frequência</th><th>Situação</th></tr></thead>
              <tbody>
                {frequencia.length ? frequencia.map((s, i) => {
                  const freq = s.total ? Math.round(s.presentes / s.total * 100) : 0
                  const [sit, cls] = freq >= 75 ? ['Regular','badge-success'] : ['Atenção','badge-danger']
                  return (
                    <tr key={i}>
                      <td className="td-name">{s.nome}</td>
                      <td className="td-code">{s.matricula}</td>
                      <td>{s.turma}</td>
                      <td style={{ textAlign: 'center' }}>{s.total}</td>
                      <td style={{ textAlign: 'center', color: 'var(--emerald)' }}>{s.presentes}</td>
                      <td style={{ textAlign: 'center', color: 'var(--rose)' }}>{s.ausentes}</td>
                      <td style={{ textAlign: 'center', color: 'var(--gold)' }}>{s.justificados}</td>
                      <td>
                        <div className="bar-track" style={{ width: 100, display: 'inline-block' }}>
                          <div className="bar-fill" style={{ width: `${freq}%`, background: freq >= 75 ? 'var(--emerald)' : 'var(--rose)' }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.75rem', marginLeft: '.4rem' }}>{freq}%</span>
                      </td>
                      <td><span className={`badge ${cls}`}>{sit}</span></td>
                    </tr>
                  )
                }) : <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Nenhum dado disponível</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
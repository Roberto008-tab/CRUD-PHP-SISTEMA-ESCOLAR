// ============================================================
//  pages/Login.tsx — Login conectado ao backend PHP
// ============================================================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [loginVal, setLoginVal]   = useState('')
  const [senha, setSenha]         = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  useEffect(() => { if (isAuthenticated) navigate('/dashboard') }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await login(loginVal, senha)
    if (res.success) {
      navigate('/dashboard')
    } else {
      setError(res.error ?? 'Credenciais inválidas.')
    }
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      {/* Lado esquerdo — branding */}
      <div className="login-left">
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 340 }}>
          <div className="hero-icon">🎓</div>
          <h1>EduGestor</h1>
          <p>Sistema completo de gerenciamento escolar com backend PHP + interface React</p>
          <div className="features">
            {[
              ['👨‍🎓', 'Gestão de alunos e matrículas'],
              ['📝',   'Controle de notas por bimestre'],
              ['📅',   'Registro de presença digital'],
              ['📊',   'Relatórios automáticos'],
              ['☁️',   'Sincronização com Supabase Cloud'],
              ['🔑',   'Gestão de tokens de API'],
              ['🤖',   'Análise com IA (OpenAI)'],
              ['🔐',   'RBAC com 4 níveis de acesso'],
            ].map(([ic, label]) => (
              <div className="feature-item" key={label}><span>{ic}</span>{label}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="login-right">
        <div className="login-box">
          <h2>Bem-vindo de volta</h2>
          <p className="subtitle">Faça login para acessar o painel escolar</p>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group mb-3">
              <label>Login</label>
              <input
                type="text" className="form-control"
                placeholder="Digite seu login"
                value={loginVal} onChange={e => setLoginVal(e.target.value)}
                required autoFocus
              />
            </div>
            <div className="form-group mb-3">
              <label>Senha</label>
              <div className="input-wrap">
                <input
                  type={showPwd ? 'text' : 'password'} className="form-control"
                  placeholder="••••••••"
                  value={senha} onChange={e => setSenha(e.target.value)}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                >
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: '.7rem' }}
              disabled={loading}
            >
              {loading ? '⏳ Entrando…' : '🔐 Entrar no Sistema'}
            </button>
          </form>
          <details className="credential-hints">
            <summary>Ver logins de demonstração</summary>
            <table className="cred-table">
              <thead><tr><th>Cargo</th><th>Login</th><th>Senha</th></tr></thead>
              <tbody>
                {[
                  { cargo: 'Admin',      cor: '#f59e0b', login: 'admin',      senha: 'admin123' },
                  { cargo: 'Diretor',    cor: '#6366f1', login: 'diretor',    senha: 'diretor123' },
                  { cargo: 'Secretaria', cor: '#10b981', login: 'secretaria', senha: 'sec123' },
                  { cargo: 'Professor',  cor: '#3b82f6', login: 'professor',  senha: 'prof123' },
                ].map(u => (
                  <tr key={u.login} style={{ cursor: 'pointer' }} onClick={() => { setLoginVal(u.login); setSenha(u.senha) }}>
                    <td><span className="badge" style={{ background: u.cor }}>{u.cargo}</span></td>
                    <td><code>{u.login}</code></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{u.senha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: '.5rem' }}>
              Clique na linha para preencher automaticamente.
            </p>
          </details>

          <p style={{ fontSize: '.7rem', color: 'var(--muted)', textAlign: 'center', marginTop: '2rem' }}>
            EduGestor v3.0 Unified · PHP + React
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
//  components/Layout.tsx — Sidebar + Topbar (espelho do PHP)
// ============================================================
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CARGO_NOMES, CARGO_CORES } from '../types'

const NAV = [
  { section: 'Principal',       items: [{ to: '/dashboard', icon: '🏠', label: 'Dashboard' }] },
  { section: 'Acadêmico',       items: [
    { to: '/alunos',      icon: '👨‍🎓', label: 'Alunos' },
    { to: '/professores', icon: '👨‍🏫', label: 'Professores' },
    { to: '/notas',       icon: '📝', label: 'Notas' },
    { to: '/presenca',    icon: '📅', label: 'Presença' },
  ]},
  { section: 'Relatórios',      items: [{ to: '/relatorios', icon: '📊', label: 'Relatórios' }] },
]
const NAV_ADMIN = { section: 'Administração', items: [
  { to: '/usuarios', icon: '👥', label: 'Usuários' },
  { to: '/tokens',   icon: '🔑', label: 'Tokens de API' },
]}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const cargo   = user?.cargo ?? 4
  const nomeC   = CARGO_NOMES[cargo]
  const corC    = CARGO_CORES[cargo]
  const initial = (user?.nome ?? '?').slice(0, 1).toUpperCase()
  const nav     = cargo === 1 ? [...NAV, NAV_ADMIN] : NAV

  const isActive = (to: string) => location.pathname === to

  return (
    <div className="app">
      {/* Backdrop mobile */}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 99 }} />}

      {/* SIDEBAR */}
      <aside className={`sidebar${open ? ' open' : ''}`} id="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🎓</div>
          <div>
            <h1>EduGestor</h1>
            <span>v3.0 · Unified</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="avatar" style={{ background: corC }}>{initial}</div>
          <div className="info">
            <div className="name">{user?.nome}</div>
            <div className="role" style={{ color: corC }}>{nomeC}</div>
          </div>
        </div>

        <nav>
          {nav.map(group => (
            <div className="nav-section" key={group.section}>
              <div className="nav-label">{group.section}</div>
              {group.items.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-item${isActive(item.to) ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <span>🚪</span> Sair do sistema
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setOpen(o => !o)}>☰</button>
            <div>
              <h2>{location.pathname.replace('/', '').replace(/^\w/, c => c.toUpperCase()) || 'Dashboard'}</h2>
              <div className="breadcrumb">EduGestor · {nomeC}</div>
            </div>
          </div>
          <div className="topbar-right">
            <span className="badge" style={{ background: corC }}>{nomeC}</span>
            <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
              {new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </header>

        <div className="content fade-in">
          {children}
        </div>
      </div>
    </div>
  )
}

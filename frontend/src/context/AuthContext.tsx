// ============================================================
//  context/AuthContext.tsx — Autenticação real via API PHP
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User } from '../types'
import { authApi } from '../services/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (login: string, senha: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Verificar sessão PHP existente ao carregar
  useEffect(() => {
    authApi.me()
      .then(res => setUser(res.data as User))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (loginStr: string, senha: string) => {
    try {
      const res = await authApi.login(loginStr, senha)
      setUser(res.data as User)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro de autenticação.' }
    }
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignora */ }
    setUser(null)
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0d1117', color: '#8b949e', fontSize: '0.9rem',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎓</div>
          <div>Carregando EduGestor…</div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

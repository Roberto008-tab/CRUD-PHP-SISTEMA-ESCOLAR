// ============================================================
//  App.tsx — Rotas protegidas, conectadas ao backend PHP
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'

import Login       from './pages/Login'
import Dashboard   from './pages/Dashboard'
import Alunos      from './pages/Alunos'
import Professores from './pages/Professores'
import Notas       from './pages/Notas'
import Presenca    from './pages/Presenca'
import Relatorios  from './pages/Relatorios'
import Usuarios    from './pages/Usuarios'
import Tokens      from './pages/Tokens'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.cargo !== 1) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={
        <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
      } />
      <Route path="/alunos" element={
        <PrivateRoute><Layout><Alunos /></Layout></PrivateRoute>
      } />
      <Route path="/professores" element={
        <PrivateRoute><Layout><Professores /></Layout></PrivateRoute>
      } />
      <Route path="/notas" element={
        <PrivateRoute><Layout><Notas /></Layout></PrivateRoute>
      } />
      <Route path="/presenca" element={
        <PrivateRoute><Layout><Presenca /></Layout></PrivateRoute>
      } />
      <Route path="/relatorios" element={
        <PrivateRoute><Layout><Relatorios /></Layout></PrivateRoute>
      } />
      <Route path="/usuarios" element={
        <AdminRoute><Layout><Usuarios /></Layout></AdminRoute>
      } />
      <Route path="/tokens" element={
        <AdminRoute><Layout><Tokens /></Layout></AdminRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

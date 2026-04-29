import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AgentConfig from './pages/AgentConfig'
import Plans from './pages/Plans'
import Admin from './pages/Admin'
import PrivacyPolicy from './pages/PrivacyPolicy'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  return user ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  return user.role === 'admin' ? children : <Navigate to="/dashboard" />
}

function AppRoutes() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/config" element={<PrivateRoute><AgentConfig /></PrivateRoute>} />
          <Route path="/plans" element={<PrivateRoute><Plans /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 sm:mb-0">
            &copy; {new Date().getFullYear()} Pivot Soluciones. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6">
            <a href="/privacyPolicy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Política de Privacidad
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

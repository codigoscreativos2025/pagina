import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AgentConfig from './pages/AgentConfig'
import Plans from './pages/Plans'
import Admin from './pages/Admin'
import CRM from './pages/CRM'
import Automations from './pages/Automations'
import Integrations from './pages/Integrations'
import MetaAds from './pages/MetaAds'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Account from './pages/Account'
import Templates from './pages/Templates'
import TemplateEditor from './pages/TemplateEditor'
import Funnels from './pages/Funnels'
import TikTokAds from './pages/TikTokAds'
import OnboardingWizard from './pages/OnboardingWizard'
import Results from './pages/Results'
import Recipes from './pages/Recipes'

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
  const location = useLocation()
  const isChatPage = location.pathname === '/crm'

  return (
    <div className={`flex flex-col min-h-screen bg-gray-50 ${isChatPage ? 'h-screen overflow-hidden' : ''}`}>
      <main className={isChatPage ? 'flex-1 overflow-hidden' : 'flex-grow'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<PrivateRoute><OnboardingWizard /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/config/:id" element={<PrivateRoute><AgentConfig /></PrivateRoute>} />
          <Route path="/config" element={<Navigate to="/dashboard" />} />
          <Route path="/crm" element={<PrivateRoute><CRM /></PrivateRoute>} />
          <Route path="/automations" element={<PrivateRoute><Automations /></PrivateRoute>} />
          <Route path="/templates" element={<PrivateRoute><Templates /></PrivateRoute>} />
          <Route path="/template-editor" element={<PrivateRoute><TemplateEditor /></PrivateRoute>} />
          <Route path="/funnels" element={<PrivateRoute><Funnels /></PrivateRoute>} />
          <Route path="/integrations" element={<PrivateRoute><Integrations /></PrivateRoute>} />
          <Route path="/meta-ads" element={<PrivateRoute><MetaAds /></PrivateRoute>} />
          <Route path="/tiktok-ads" element={<PrivateRoute><TikTokAds /></PrivateRoute>} />
          <Route path="/results" element={<PrivateRoute><Results /></PrivateRoute>} />
          <Route path="/recipes" element={<PrivateRoute><Recipes /></PrivateRoute>} />
          <Route path="/plans" element={<PrivateRoute><Plans /></PrivateRoute>} />
          <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
      
      {!isChatPage && (
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 sm:mb-0">
            &copy; {new Date().getFullYear()} Pivot Soluciones. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6">
            <Link to="/automations" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Automatizaciones
            </Link>
            <a href="/privacyPolicy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Política de Privacidad
            </a>
          </div>
        </div>
      </footer>
      )}
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

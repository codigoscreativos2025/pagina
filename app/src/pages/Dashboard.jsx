import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [agent, setAgent] = useState(null)
  const [stats, setStats] = useState({ messages: 0, conversations: 0, active: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [agentRes, statsRes] = await Promise.all([
        api.get('/agents'),
        api.get('/agents/stats')
      ])
      if (agentRes.data.length > 0) {
        setAgent(agentRes.data[0])
      }
      setStats(statsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold text-slate-800">
            <span className="text-brand-600">Pivot</span><span className="text-accent">.AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">{user?.name}</span>
            <button onClick={logout} className="text-slate-500 hover:text-slate-700 text-sm">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600 mb-8">Gestiona tu agente de IA</p>

        {!agent && (
          <div className="bg-gradient-to-r from-brand-50 to-accent/10 border border-brand-200 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2">¡Configura tu Agente!</h2>
            <p className="text-slate-600 mb-4">Crea tu asistente de IA personalizado para tu negocio</p>
            <Link to="/config" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700">
              Comenzar Configuración
            </Link>
          </div>
        )}

        {agent && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center text-2xl">💬</div>
                  <div>
                    <p className="text-slate-500 text-sm">Mensajes</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.messages}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-2xl">👥</div>
                  <div>
                    <p className="text-slate-500 text-sm">Conversaciones</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.conversations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${agent.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
                    {agent.is_active ? '✅' : '⏸️'}
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Estado</p>
                    <p className="text-2xl font-bold text-slate-900">{agent.is_active ? 'Activo' : 'Inactivo'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">Información del Agente</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-500 text-sm">Nombre</p>
                    <p className="text-slate-900 font-medium">{agent.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">WhatsApp</p>
                    <p className="text-slate-900 font-medium">{agent.whatsapp_config?.phone ? '✅ Conectado' : '❌ No configurado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Google Sheets</p>
                    <p className="text-slate-900 font-medium">{agent.google_sheets_config?.sheet_id ? '✅ Conectado' : '❌ No configurado'}</p>
                  </div>
                </div>
                <Link to="/config" className="mt-4 inline-block text-brand-600 hover:text-brand-700 font-medium">
                  Editar Configuración →
                </Link>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">Tu Plan</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-500 text-sm">Plan actual</p>
                    <p className="text-slate-900 font-medium">{user?.plan?.name || 'Gratis'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Mensajes este mes</p>
                    <p className="text-slate-900 font-medium">{stats.messages} / {user?.plan?.messages_limit || 50}</p>
                  </div>
                </div>
                <Link to="/plans" className="mt-4 inline-block text-brand-600 hover:text-brand-700 font-medium">
                  Cambiar Plan →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

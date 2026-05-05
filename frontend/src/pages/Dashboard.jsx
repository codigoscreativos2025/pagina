import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [stats, setStats] = useState({ messages: 0, conversations: 0 })
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
      setAgents(agentRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = async () => {
    try {
      setLoading(true)
      const res = await api.post('/agents', { name: `Nuevo Agente ${agents.length + 1}` })
      navigate(`/config/${res.data.id}`)
    } catch (err) {
      console.error('Error creando agente', err)
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
          <div className="flex items-center gap-6">
            <Link to="/automations" className="text-slate-600 hover:text-brand-600 font-medium transition-colors text-sm flex items-center gap-2">
              <span>⚡</span> Automatizaciones
            </Link>
            <Link to="/crm" className="text-slate-600 hover:text-brand-600 font-medium transition-colors text-sm flex items-center gap-2">
              <span>📊</span> CRM / Chats
            </Link>
            <Link to="/integrations" className="text-slate-600 hover:text-brand-600 font-medium transition-colors text-sm flex items-center gap-2">
              <span>🔌</span> Integraciones
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">{user?.name}</span>
            <button onClick={logout} className="text-slate-500 hover:text-slate-700 text-sm">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Gestiona tus agentes de IA</p>
          </div>
          <button 
            onClick={handleCreateAgent}
            disabled={loading}
            className="px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50"
          >
            + Crear Nuevo Agente
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center text-2xl">💬</div>
              <div>
                <p className="text-slate-500 text-sm">Mensajes Totales</p>
                <p className="text-2xl font-bold text-slate-900">{stats.messages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-2xl">👥</div>
              <div>
                <p className="text-slate-500 text-sm">Conversaciones Totales</p>
                <p className="text-2xl font-bold text-slate-900">{stats.conversations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-2xl">🤖</div>
              <div>
                <p className="text-slate-500 text-sm">Agentes Creados</p>
                <p className="text-2xl font-bold text-slate-900">{agents.length}</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-4">Mis Agentes</h2>
        
        {agents.length === 0 ? (
          <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No tienes agentes todavía</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">Crea tu primer asistente de IA personalizado para comenzar a atender clientes automáticamente.</p>
            <button 
              onClick={handleCreateAgent}
              disabled={loading}
              className="px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700"
            >
              Crear mi primer Agente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <div key={agent.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-brand-300 transition-colors flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">{agent.name || 'Agente sin nombre'}</h3>
                  <div className={`w-3 h-3 rounded-full ${agent.is_active ? 'bg-green-500' : 'bg-red-500'}`} title={agent.is_active ? 'Activo' : 'Inactivo'}></div>
                </div>
                
                <div className="space-y-3 flex-1 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">WhatsApp</span>
                    <span className="font-medium text-slate-900">
                      {agent.whatsapp_config?.phone ? '✅ Conectado' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Google Sheets</span>
                    <span className="font-medium text-slate-900">
                      {agent.google_sheets_config?.sheet_id ? '✅ Conectado' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Instagram</span>
                    <span className="font-medium text-slate-900">
                      {agent.instagram_config?.page_id ? '✅ Conectado' : '❌ No'}
                    </span>
                  </div>
                </div>
                
                <Link 
                  to={`/config/${agent.id}`} 
                  className="w-full block text-center py-2 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 text-brand-600 rounded-lg font-medium transition-colors"
                >
                  Configurar Agente
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

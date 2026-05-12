import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [stats, setStats] = useState({ messages: 0, conversations: 0 })
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creatingAgent, setCreatingAgent] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

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
      
      // Load analytics separately (may fail if not connected)
      try {
        const analyticsRes = await api.get('/analytics/meta-ads')
        if (analyticsRes.data.success) setAnalytics(analyticsRes.data.metrics)
      } catch (e) { /* Analytics optional */ }
      
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = async (e) => {
    e.preventDefault()
    if (!newAgentName.trim()) return
    try {
      setCreatingAgent(true)
      const res = await api.post('/agents', { name: newAgentName.trim() })
      navigate(`/config/${res.data.id}`)
    } catch (err) {
      console.error('Error creando agente', err)
      setCreatingAgent(false)
    }
  }

  const conversionRate = analytics?.crm?.conversion_rate || '—'
  const metaConnected = analytics?.meta?.connected

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
            <Link to="/templates" className="text-slate-600 hover:text-brand-600 font-medium transition-colors text-sm flex items-center gap-2">
              <span>📋</span> Plantillas
            </Link>
            <Link to="/integrations" className="text-slate-600 hover:text-brand-600 font-medium transition-colors text-sm flex items-center gap-2">
              <span>🔌</span> Integraciones
            </Link>
            {metaConnected && (
              <Link to="/meta-ads" className="text-slate-600 hover:text-brand-600 font-medium transition-colors text-sm flex items-center gap-2">
                <span>📣</span> Meta Ads
              </Link>
            )}
            <span className="text-slate-300">|</span>
            <Link to="/account" className="text-slate-600 font-medium hover:text-brand-600 transition-colors text-sm flex items-center gap-2">
              <span className="bg-slate-100 px-2 py-1 rounded text-xs">👤</span> {user?.name}
            </Link>
            <button onClick={logout} className="text-slate-500 hover:text-slate-700 text-sm">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
            <p className="text-slate-500 text-sm">Bienvenido, {user?.name}. Aquí tienes un resumen de tu operación.</p>
          </div>
          <button
            onClick={() => { setNewAgentName(''); setShowCreateModal(true) }}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
          >
            <span className="text-lg leading-none">+</span> Nuevo Agente
          </button>
        </div>

        {/* KPI Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-xl">💬</div>
            <div>
              <p className="text-slate-500 text-xs">Mensajes</p>
              <p className="text-2xl font-bold text-slate-900">{stats.messages}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-xl">👥</div>
            <div>
              <p className="text-slate-500 text-xs">Contactos</p>
              <p className="text-2xl font-bold text-slate-900">{stats.conversations}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">🤖</div>
            <div>
              <p className="text-slate-500 text-xs">Agentes</p>
              <p className="text-2xl font-bold text-slate-900">{agents.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-xl">📈</div>
            <div>
              <p className="text-slate-500 text-xs">Conversión</p>
              <p className="text-2xl font-bold text-slate-900">{conversionRate}</p>
            </div>
          </div>
        </div>



        {/* Agents Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Mis Agentes de IA</h2>
          <span className="text-sm text-slate-500">{agents.length} agente{agents.length !== 1 ? 's' : ''}</span>
        </div>
        
        {agents.length === 0 ? (
          <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No tienes agentes todavía</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto text-sm">Crea tu primer asistente de IA personalizado para comenzar a atender clientes automáticamente.</p>
            <button
              onClick={() => { setNewAgentName(''); setShowCreateModal(true) }}
              className="px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700"
            >
              Crear mi primer Agente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map(agent => (
              <div key={agent.id} className="bg-white rounded-xl p-5 border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-lg">
                      {agent.name?.charAt(0)?.toUpperCase() || '🤖'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{agent.name || 'Agente sin nombre'}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${agent.is_active ? 'bg-green-500' : 'bg-red-400'}`}></span>
                        <span className="text-xs text-slate-500">{agent.is_active ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 flex-1 mb-5">
                  {[
                    { label: 'WhatsApp', ok: agent.whatsapp_config?.phone },
                    { label: 'Google Sheets', ok: agent.google_sheets_config?.sheet_id },
                    { label: 'Instagram', ok: agent.instagram_config?.page_id },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">{item.label}</span>
                      <span className={`font-semibold ${item.ok ? 'text-green-600' : 'text-slate-400'}`}>
                        {item.ok ? '✅ Conectado' : '○ No configurado'}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Link 
                  to={`/config/${agent.id}`}
                  className="w-full block text-center py-2 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 text-brand-600 rounded-lg font-medium transition-colors text-sm"
                >
                  Configurar Agente →
                </Link>
              </div>
            ))}
            
            {/* Quick Add Card */}
            <button
              onClick={() => { setNewAgentName(''); setShowCreateModal(true) }}
              className="bg-white rounded-xl p-5 border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50 transition-all flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-brand-600 min-h-[180px] group"
            >
              <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">+</div>
              <span className="font-semibold text-sm">Añadir Agente</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Crear Nuevo Agente</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <form onSubmit={handleCreateAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Agente</label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={e => setNewAgentName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="Ej: Agente Ventas, Soporte Premium..."
                  autoFocus
                  required
                />
                <p className="text-xs text-slate-400 mt-1.5">Podrás cambiar esto en cualquier momento desde su configuración.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={creatingAgent || !newAgentName.trim()} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors">
                  {creatingAgent ? 'Creando...' : 'Crear Agente →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

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
    const interval = setInterval(loadData, 15000) // Poll for live metrics
    return () => clearInterval(interval)
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
    <div className="min-h-screen bg-[#0f172a] font-sans selection:bg-brand-500 selection:text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-600/20 blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-accent/20 blur-[150px] mix-blend-screen animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <nav className="relative z-10 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent flex items-center justify-center shadow-lg shadow-brand-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <span>Pivot<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent">.AI</span></span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/integrations" className="text-slate-300 hover:text-white font-medium transition-all hover:scale-105 text-sm flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-white/5">🔌</span> Integraciones
            </Link>
            <Link to="/crm" className="text-slate-300 hover:text-white font-medium transition-all hover:scale-105 text-sm flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-white/5">📊</span> CRM / Chats
            </Link>
            <div className="w-px h-6 bg-white/10"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-500/20 border border-white/20">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button onClick={logout} className="text-slate-400 hover:text-red-400 text-sm font-medium transition-colors">
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent">Center</span></h1>
            <p className="text-slate-400 text-lg">Monitoreo en tiempo real de tu ecosistema de ventas.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-400 text-sm font-semibold tracking-wide">SISTEMA EN LÍNEA</span>
          </div>
        </div>

        {!agent && (
          <div className="relative overflow-hidden rounded-3xl bg-slate-800/50 backdrop-blur-xl border border-white/10 p-10 mb-8 group hover:border-brand-500/50 transition-all duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-500/20 to-transparent rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-3">¡Configura tu Agente! 🤖</h2>
              <p className="text-slate-300 text-lg mb-8 max-w-xl">Crea tu asistente de IA personalizado y comienza a capturar leads en piloto automático.</p>
              <Link to="/config" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-1 transition-all">
                Configurar Ahora <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </Link>
            </div>
          </div>
        )}

        {agent && (
          <div className="space-y-8">
            {/* Live Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-slate-800/60 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-2xl shadow-inner">💬</div>
                  <h3 className="text-slate-400 font-medium">Mensajes Totales</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-white">{stats.messages}</p>
                  <span className="text-green-400 text-sm font-semibold flex items-center">↑ 12%</span>
                </div>
              </div>

              <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-slate-800/60 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner">👥</div>
                  <h3 className="text-slate-400 font-medium">Conversaciones</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-white">{stats.conversations}</p>
                  <span className="text-green-400 text-sm font-semibold flex items-center">↑ 8%</span>
                </div>
              </div>

              <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-slate-800/60 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-2xl shadow-inner">⚡</div>
                  <h3 className="text-slate-400 font-medium">Respuestas IA</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-white">{Math.floor(stats.messages * 0.45)}</p>
                  <span className="text-slate-500 text-sm">Esta semana</span>
                </div>
              </div>

              <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-slate-800/60 transition-colors relative overflow-hidden group">
                <div className={`absolute inset-0 opacity-10 ${agent.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${agent.is_active ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                      {agent.is_active ? '🤖' : '💤'}
                    </div>
                    <h3 className="text-slate-400 font-medium">Estado del Bot</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-3xl font-black ${agent.is_active ? 'text-green-400' : 'text-red-400'}`}>
                      {agent.is_active ? 'Activo' : 'Pausado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Section: Meta Ads & System Config */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Meta Ads Panel */}
              <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </div>
                
                <div className="relative z-10 flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="text-blue-500">📈</span> Rendimiento Meta Ads
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Conecta tu Business Manager para ver el ROI en vivo.</p>
                  </div>
                  <button className="px-5 py-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 border border-blue-500/30 rounded-lg font-semibold transition-all text-sm flex items-center gap-2">
                    Conectar Cuenta Publicitaria
                  </button>
                </div>

                {/* Mock Data for now since connection is pending */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Inversión (7d)</p>
                    <p className="text-2xl font-semibold text-white">$0.00</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Costo x Lead</p>
                    <p className="text-2xl font-semibold text-white">$0.00</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Impresiones</p>
                    <p className="text-2xl font-semibold text-white">0</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Clics (CTR)</p>
                    <p className="text-2xl font-semibold text-white">0%</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center py-10 bg-slate-900/30 rounded-xl border border-white/5 border-dashed">
                  <p className="text-slate-500 font-medium">Vincula tu cuenta para poblar estas métricas.</p>
                </div>
              </div>

              {/* Agent Profile */}
              <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-white/10 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-6">Perfil del Agente</h3>
                
                <div className="flex-1 space-y-5">
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Nombre</p>
                      <p className="text-white font-medium mt-1">{agent.name}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">🤖</div>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Canales Activos</p>
                      <div className="flex gap-2 mt-2">
                        {agent.whatsapp_config?.phone ? <span className="w-6 h-6 rounded bg-green-500/20 text-green-500 flex items-center justify-center text-xs border border-green-500/30" title="WhatsApp">WA</span> : <span className="w-6 h-6 rounded bg-slate-800 text-slate-500 flex items-center justify-center text-xs opacity-50 border border-white/10">WA</span>}
                        {agent.instagram_config?.page_id ? <span className="w-6 h-6 rounded bg-pink-500/20 text-pink-500 flex items-center justify-center text-xs border border-pink-500/30" title="Instagram">IG</span> : <span className="w-6 h-6 rounded bg-slate-800 text-slate-500 flex items-center justify-center text-xs opacity-50 border border-white/10">IG</span>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Consumo del Plan</p>
                      <p className="text-white font-medium mt-1">{stats.messages} <span className="text-slate-500 text-sm">/ {user?.plan?.messages_limit || 50} msjs</span></p>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-brand-500 h-full rounded-full" style={{ width: `${Math.min((stats.messages / (user?.plan?.messages_limit || 50)) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <Link to="/config" className="w-full py-3 mt-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold text-center transition-colors">
                  Ajustes Avanzados
                </Link>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}


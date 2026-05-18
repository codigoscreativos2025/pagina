import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const fmt = (n) => n ? Number(n).toLocaleString('es-ES') : '0'

export default function Results() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trafficLight, setTrafficLight] = useState('green')
  const [trafficMessage, setTrafficMessage] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [resultsRes, metaAdsRes] = await Promise.all([
        api.get('/analytics/results'),
        api.get('/analytics/meta-ads').catch(() => ({ data: { success: false } }))
      ])
      if (resultsRes.data.success) {
        setData({ ...resultsRes.data, meta_ads: metaAdsRes.data.success ? metaAdsRes.data.metrics.meta : null })
        // Calculate traffic light
        const leadsThisWeek = res.data.leads_this_week || 0
        const leadsLastWeek = res.data.leads_last_week || 0
        if (leadsLastWeek === 0) {
          setTrafficLight('green')
          setTrafficMessage('¡Empezando! Tu agente está listo para recibir leads.')
        } else if (leadsThisWeek > leadsLastWeek * 1.1) {
          setTrafficLight('green')
          const pct = Math.round(((leadsThisWeek - leadsLastWeek) / leadsLastWeek) * 100)
          setTrafficMessage(`¡Excelente! Tus leads subieron un ${pct}%. Sigue así.`)
        } else if (leadsThisWeek < leadsLastWeek * 0.9) {
          setTrafficLight('red')
          const pct = Math.round(((leadsLastWeek - leadsThisWeek) / leadsLastWeek) * 100)
          setTrafficMessage(`Tus leads bajaron un ${pct}%. Revisa si tu agente está activo.`)
        } else {
          setTrafficLight('yellow')
          setTrafficMessage('Estable. Tip: Responde más rápido para convertir más.')
        }
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando resultados...</div>

  const d = data || {}
  const conversations = d.conversations_this_week || 0
  const leads = d.leads_this_week || 0
  const timeSaved = d.time_saved_hours || 0
  const messages = d.messages_total || 0

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">← Dashboard</button>
          <h1 className="text-xl font-bold text-slate-800">📊 Tus Resultados</h1>
          <button onClick={loadData} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200">🔄 Actualizar</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Traffic Light */}
        <div className={`rounded-2xl p-6 mb-8 border-2 ${
          trafficLight === 'green' ? 'bg-green-50 border-green-200' :
          trafficLight === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className="text-4xl">
              {trafficLight === 'green' ? '🟢' : trafficLight === 'yellow' ? '🟡' : '🔴'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Semana actual</h2>
              <p className={`text-sm ${
                trafficLight === 'green' ? 'text-green-700' :
                trafficLight === 'yellow' ? 'text-yellow-700' :
                'text-red-700'
              }`}>{trafficMessage}</p>
            </div>
          </div>
        </div>

        {/* 3 Big Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <div className="text-5xl mb-3">💬</div>
            <div className="text-5xl font-bold text-slate-900 mb-2">{fmt(conversations)}</div>
            <div className="text-sm text-slate-500">Conversaciones esta semana</div>
            <div className="text-xs text-slate-400 mt-2">Tu agente habló con {fmt(conversations)} personas</div>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <div className="text-5xl mb-3">👥</div>
            <div className="text-5xl font-bold text-brand-600 mb-2">{fmt(leads)}</div>
            <div className="text-sm text-slate-500">Leads nuevos esta semana</div>
            <div className="text-xs text-slate-400 mt-2">Conseguiste {fmt(leads)} contactos nuevos</div>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <div className="text-5xl mb-3">⏰</div>
            <div className="text-5xl font-bold text-emerald-600 mb-2">{fmt(timeSaved)}h</div>
            <div className="text-sm text-slate-500">Tiempo ahorrado esta semana</div>
            <div className="text-xs text-slate-400 mt-2">Tu agente te ahorró {fmt(timeSaved)} horas de trabajo</div>
          </div>
        </div>

        {/* Extra stats */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Resumen general</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{fmt(messages)}</div>
              <div className="text-xs text-slate-500">Mensajes totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{d.conversion_rate || '0%'}</div>
              <div className="text-xs text-slate-500">Tasa de conversión</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{d.channels_active || 0}</div>
              <div className="text-xs text-slate-500">Canales activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{d.response_time_avg || '—'}</div>
              <div className="text-xs text-slate-500">Tiempo respuesta</div>
            </div>
          </div>
        </div>

        {/* Meta Ads Metrics */}
        {d.meta_ads && d.meta_ads.connected && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">📈 Meta Ads (últimos 7 días)</h2>
              <button 
                onClick={() => navigate('/meta-ads')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver dashboard completo →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">Alcance</div>
                <div className="text-2xl font-bold text-blue-600">{fmt(d.meta_ads.reach)}</div>
                <div className="text-[10px] text-slate-400">personas alcanzadas</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">Impresiones</div>
                <div className="text-2xl font-bold text-indigo-600">{fmt(d.meta_ads.impressions)}</div>
                <div className="text-[10px] text-slate-400">veces mostrado</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">Clics</div>
                <div className="text-2xl font-bold text-purple-600">{fmt(d.meta_ads.clicks)}</div>
                <div className="text-[10px] text-slate-400">clics recibidos</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">Inversión</div>
                <div className="text-2xl font-bold text-emerald-600">${fmt(d.meta_ads.spend)}</div>
                <div className="text-[10px] text-slate-400">gasto total</div>
              </div>
            </div>
            {d.meta_ads.clicks > 0 && d.leads_this_week > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200 text-center">
                <div className="text-sm text-slate-600">
                  Tasa de conversión de ads: <span className="font-bold text-blue-700">
                    {((d.leads_this_week / d.meta_ads.clicks) * 100).toFixed(2)}%
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    ({d.leads_this_week} leads de {fmt(d.meta_ads.clicks)} clics)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

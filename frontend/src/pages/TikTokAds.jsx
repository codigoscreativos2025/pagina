import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const fmt = (n) => n ? Number(n).toLocaleString('es-ES') : '0'
const fmtMoney = (n) => n ? `$${Number(n).toFixed(2)}` : '$0.00'
const fmtPct = (n) => n ? `${Number(n).toFixed(2)}%` : '0%'

export default function TikTokAds() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/integrations/tiktok/campaigns')
      if (res.data.success) setData(res.data)
      else setError(res.data.error || 'Error cargando datos')
    } catch (err) { setError('No se pudo conectar con TikTok Ads') }
    finally { setLoading(false) }
  }

  const statusColor = (s) => {
    if (s === 'CAMPAIGN_STATUS_ACTIVE') return 'bg-green-100 text-green-700'
    if (s === 'CAMPAIGN_STATUS_PAUSE') return 'bg-yellow-100 text-yellow-700'
    return 'bg-slate-100 text-slate-600'
  }

  const statusLabel = (s) => {
    if (s === 'CAMPAIGN_STATUS_ACTIVE') return 'Activa'
    if (s === 'CAMPAIGN_STATUS_PAUSE') return 'Pausada'
    return s?.replace('CAMPAIGN_STATUS_', '') || '—'
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando métricas de TikTok Ads...</div>

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">🎵</p>
        <h2 className="text-xl font-bold text-slate-800 mb-2">TikTok Ads no disponible</h2>
        <p className="text-slate-500 mb-4">{error}</p>
        <button onClick={() => navigate('/integrations')} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">Configurar en Integraciones</button>
      </div>
    </div>
  )

  const s = data?.summary || {}
  const campaigns = data?.campaigns || []
  const crmLeads = data?.crm_leads_30d || 0

  const kpis = [
    { label: 'Impresiones', value: fmt(s.impressions || s.stat_cost), icon: '👁️', color: 'bg-purple-50 text-purple-700' },
    { label: 'Clics', value: fmt(s.clicks), icon: '👆', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'CTR', value: fmtPct(s.ctr), icon: '📈', color: 'bg-amber-50 text-amber-700' },
    { label: 'CPC', value: fmtMoney(s.cpc), icon: '💰', color: 'bg-orange-50 text-orange-700' },
    { label: 'Gasto Total', value: fmtMoney(s.cost || s.stat_cost), icon: '💸', color: 'bg-red-50 text-red-700' },
  ]

  const costPerLead = crmLeads > 0 && (s.cost || s.stat_cost) ? (Number(s.cost || s.stat_cost) / crmLeads).toFixed(2) : null

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">← Dashboard</button>
          <h1 className="text-xl font-bold text-slate-800">🎵 TikTok Ads — Rendimiento</h1>
          <button onClick={loadData} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200">🔄 Actualizar</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Account info */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm text-slate-500">Cuenta:</span>
          <span className="font-bold text-slate-800">{data?.account?.name || data?.account?.id}</span>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Últimos 30 días</span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {kpis.map(k => (
            <div key={k.label} className={`rounded-xl p-4 ${k.color}`}>
              <div className="text-2xl mb-1">{k.icon}</div>
              <div className="text-2xl font-bold">{k.value}</div>
              <div className="text-xs font-medium opacity-70">{k.label}</div>
            </div>
          ))}
        </div>

        {/* CRM Correlation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Leads en CRM (30 días)</div>
            <div className="text-3xl font-bold text-brand-600">{crmLeads}</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Costo por Lead</div>
            <div className="text-3xl font-bold text-emerald-600">{costPerLead ? `$${costPerLead}` : '—'}</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Campañas activas</div>
            <div className="text-3xl font-bold text-blue-600">{campaigns.filter(c => c.status === 'CAMPAIGN_STATUS_ACTIVE').length}</div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Campañas ({campaigns.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Campaña</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-600">Clics</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-600">CTR</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-600">CPC</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-600">Gasto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map(c => (
                  <tr key={c.campaign_id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-800">{c.campaign_name}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor(c.status)}`}>{statusLabel(c.status)}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{fmt(c.insights?.clicks)}</td>
                    <td className="px-3 py-3 text-right">{fmtPct(c.insights?.ctr)}</td>
                    <td className="px-3 py-3 text-right">{fmtMoney(c.insights?.cpc)}</td>
                    <td className="px-5 py-3 text-right font-bold">{fmtMoney(c.insights?.cost || c.insights?.stat_cost)}</td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr><td colSpan="6" className="px-5 py-8 text-center text-slate-400">No se encontraron campañas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Account() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [integrations, setIntegrations] = useState({})
  const [plans, setPlans] = useState([])
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [profileRes, intRes, plansRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users/integrations-status'),
        api.get('/plans')
      ])
      setProfile(profileRes.data)
      setName(profileRes.data.name || '')
      setIntegrations(intRes.data)
      setPlans(plansRes.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    try {
      await api.put('/users/me', { name })
      setEditing(false)
      loadData()
    } catch (err) { alert('Error guardando') }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando...</div>

  const intList = [
    { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { key: 'instagram', label: 'Instagram', icon: '📸' },
    { key: 'google', label: 'Google', icon: '🔵' },
    { key: 'meta_ads', label: 'Meta Ads', icon: '📣' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">← Dashboard</button>
          <h1 className="text-xl font-bold text-slate-800">👤 Mi Cuenta</h1>
          <div />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Profile */}
        <section className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Información Personal</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
              {editing ? (
                <div className="flex gap-2">
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" />
                  <button onClick={handleSave} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">Guardar</button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium">Cancelar</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-medium">{profile?.name || '—'}</span>
                  <button onClick={() => setEditing(true)} className="text-sm text-brand-600 font-medium hover:text-brand-700">Editar</button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
              <span className="text-slate-800">{profile?.email}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Miembro desde</label>
              <span className="text-slate-800">{new Date(profile?.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </section>

        {/* Plan */}
        <section className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">📋 Plan Actual</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-2xl font-bold text-brand-600">{profile?.plan_name || 'Gratis'}</span>
              {profile?.price > 0 && <span className="text-slate-500 ml-2">${profile.price}/mes</span>}
            </div>
            <Link to="/plans" className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 text-sm">Cambiar Plan →</Link>
          </div>
          <div className="text-sm text-slate-500">
            Límite de mensajes: <strong>{profile?.messages_limit?.toLocaleString() || '50'}</strong>/mes
          </div>
        </section>

        {/* Integrations */}
        <section className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">🔌 Integraciones</h2>
          <div className="grid grid-cols-2 gap-3">
            {intList.map(i => (
              <div key={i.key} className={`rounded-xl p-4 border-2 ${integrations[i.key] ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{i.icon}</span>
                  <span className="font-medium text-slate-800">{i.label}</span>
                </div>
                <span className={`text-xs font-bold mt-1 block ${integrations[i.key] ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {integrations[i.key] ? '✅ Conectado' : '○ No conectado'}
                </span>
              </div>
            ))}
          </div>
          <Link to="/integrations" className="block text-center mt-4 text-sm text-brand-600 font-medium hover:text-brand-700">Gestionar integraciones →</Link>
        </section>

        {/* Logout */}
        <button onClick={logout} className="w-full py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors">
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Admin() {
  const [tab, setTab] = useState('users') // users | models
  const [users, setUsers] = useState([])
  const [models, setModels] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Models form
  const [editingModel, setEditingModel] = useState(null)
  const [modelForm, setModelForm] = useState({ name: '', api_model: '', api_provider: 'openai', is_active: true })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [usersRes, statsRes, modelsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
        api.get('/admin/models')
      ])
      setUsers(usersRes.data)
      setStats(statsRes.data)
      setModels(modelsRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}`, { is_active: !currentStatus })
      loadData()
    } catch (err) { alert('Error al cambiar estado') }
  }

  const handleSaveModel = async (e) => {
    e.preventDefault()
    try {
      if (editingModel) {
        await api.put(`/admin/models/${editingModel.id}`, modelForm)
      } else {
        await api.post('/admin/models', modelForm)
      }
      setEditingModel(null)
      loadData()
    } catch (err) { alert('Error guardando modelo') }
  }

  const handleDeleteModel = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar este modelo?')) return
    try {
      await api.delete(`/admin/models/${id}`)
      loadData()
    } catch (err) { alert('Error eliminando modelo') }
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-xl font-bold">
              <span className="text-brand-400">Pivot</span><span className="text-accent">.AI</span> Admin
            </Link>
            <div className="flex gap-2">
              <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Usuarios & SaaS</button>
              <button onClick={() => setTab('models')} className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === 'models' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Modelos IA</button>
            </div>
          </div>
          <Link to="/dashboard" className="text-slate-400 hover:text-white text-sm font-medium">
            ← Volver al CRM
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Usuarios', value: stats.total_users, color: 'text-blue-600' },
            { label: 'Usr Activos', value: stats.active_users, color: 'text-emerald-600' },
            { label: 'Nuevos (7d)', value: stats.new_users_week, color: 'text-purple-600' },
            { label: 'Agentes Activos', value: stats.active_agents, color: 'text-amber-600' },
            { label: 'Mensajes Totales', value: stats.total_messages?.toLocaleString(), color: 'text-slate-700' },
            { label: 'MRR Estimado', value: `$${stats.monthly_revenue?.toFixed(2)}`, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-200 text-center shadow-sm">
              <div className={`text-2xl font-bold mb-1 ${s.color}`}>{s.value || 0}</div>
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {tab === 'users' ? (
          <div>
            {/* Buscador */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 mb-6 flex justify-between items-center gap-4 shadow-sm">
              <input type="text" placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 text-sm" />
              <div className="text-sm text-slate-500 font-medium">{filteredUsers.length} resultados</div>
            </div>

            {/* Tabla de usuarios */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left font-bold text-slate-700">Usuario</th>
                    <th className="px-5 py-3 text-center font-bold text-slate-700">Plan</th>
                    <th className="px-5 py-3 text-center font-bold text-slate-700">Estado</th>
                    <th className="px-5 py-3 text-center font-bold text-slate-700">Métricas</th>
                    <th className="px-5 py-3 text-center font-bold text-slate-700">Registro</th>
                    <th className="px-5 py-3 text-right font-bold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="6" className="px-5 py-8 text-center text-slate-500">Cargando...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="6" className="px-5 py-8 text-center text-slate-500">No se encontraron usuarios</td></tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{u.name} <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-2">ID: {u.id}</span></div>
                          <div className="text-xs text-slate-500">{u.email} {u.role === 'admin' && <span className="text-red-500 font-bold ml-1">(Admin)</span>}</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-block px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg font-bold text-xs">{u.plan_name || 'Gratis'}</span>
                          {u.price > 0 && <div className="text-[10px] text-slate-400 mt-1">${u.price}/m</div>}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {u.is_active ? 'Activo' : 'Suspendido'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="text-xs text-slate-600"><strong className="text-slate-900">{u.agents_count}</strong> agentes</div>
                          <div className="text-xs text-slate-600"><strong className="text-slate-900">{u.leads_count}</strong> leads</div>
                        </td>
                        <td className="px-5 py-4 text-center text-xs text-slate-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => toggleUserStatus(u.id, u.is_active)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${u.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                            {u.is_active ? 'Suspender' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="font-bold text-slate-800">Modelos Configurables</h2>
                  <button onClick={() => { setEditingModel(null); setModelForm({ name: '', api_model: '', api_provider: 'openai', is_active: true }) }} className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700">+ Nuevo Modelo</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {models.map(m => (
                    <div key={m.id} className="p-4 hover:bg-slate-50 flex items-center justify-between group">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">{m.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${m.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{m.is_active ? 'Activo' : 'Inactivo'}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">ID: {m.api_model} <span className="text-slate-300 mx-1">•</span> Proveedor: {m.api_provider}</div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingModel(m); setModelForm(m) }} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300">Editar</button>
                        <button onClick={() => handleDeleteModel(m.id)} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200">Eliminar</button>
                      </div>
                    </div>
                  ))}
                  {models.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No hay modelos configurados</div>}
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm sticky top-6">
                <h3 className="font-bold text-slate-900 mb-4">{editingModel ? 'Editar Modelo' : 'Crear Modelo'}</h3>
                <form onSubmit={handleSaveModel} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Nombre Público</label>
                    <input type="text" required value={modelForm.name} onChange={e => setModelForm(p => ({...p, name: e.target.value}))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-500" placeholder="Ej: Pivot Pro" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">ID API (Modelo)</label>
                    <input type="text" required value={modelForm.api_model} onChange={e => setModelForm(p => ({...p, api_model: e.target.value}))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-500 font-mono" placeholder="Ej: gpt-4o-mini" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Proveedor</label>
                    <select required value={modelForm.api_provider} onChange={e => setModelForm(p => ({...p, api_provider: e.target.value}))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-500">
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="meta">Meta (Llama)</option>
                      <option value="google">Google (Gemini)</option>
                      <option value="custom">Custom (OpenClaw)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-2">
                    <input type="checkbox" checked={modelForm.is_active} onChange={e => setModelForm(p => ({...p, is_active: e.target.checked}))} className="rounded text-brand-600 w-4 h-4" />
                    <span className="text-sm font-medium text-slate-700">Modelo Activo</span>
                  </label>
                  <div className="pt-4 border-t border-slate-100 flex gap-2">
                    <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700">Guardar</button>
                    {editingModel && <button type="button" onClick={() => { setEditingModel(null); setModelForm({ name: '', api_model: '', api_provider: 'openai', is_active: true }) }} className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300">Cancelar</button>}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

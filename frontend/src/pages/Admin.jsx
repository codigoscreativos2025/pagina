import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, messages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats')
      ])
      setUsers(usersRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}`, { is_active: !currentStatus })
      loadData()
    } catch (err) {
      alert('Error al cambiar estado')
    }
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-800 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold">
            <span className="text-brand-400">Pivot</span><span className="text-accent">.AI</span> Admin
          </Link>
          <Link to="/dashboard" className="text-slate-300 hover:text-white text-sm">
            ← Volver al Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-slate-500 text-sm">Total Usuarios</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-slate-500 text-sm">Usuarios Activos</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-slate-500 text-sm">Mensajes Totales</p>
            <p className="text-3xl font-bold text-brand-600">{stats.messages}</p>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Cargando...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No se encontraron usuarios</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {user.plan_name || 'Gratis'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className="text-sm text-brand-600 hover:text-brand-700"
                      >
                        {user.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

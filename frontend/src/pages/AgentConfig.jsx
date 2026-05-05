import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function AgentConfig() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [agent, setAgent] = useState(null)
  const [saved, setSaved] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    business_info: {
      nombre: '',
      horario: '',
      direccion: '',
      telefono: '',
      metodos_pago: [],
      redes_sociales: ''
    },
    system_prompt: '',
    permissions: [],
    is_active: true
  })

  useEffect(() => {
    loadAgent()
  }, [])

  const parseJSON = (data, defaultData) => {
    if (!data) return defaultData;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch (e) {
      return defaultData;
    }
  };

  const loadAgent = async () => {
    try {
      const res = await api.get(`/agents/${id}`)
      const existingAgent = res.data
      setAgent(existingAgent)
      setFormData({
        name: existingAgent.name || '',
        business_info: parseJSON(existingAgent.business_info, formData.business_info),
        system_prompt: existingAgent.system_prompt || '',
        permissions: parseJSON(existingAgent.permissions, formData.permissions),
        is_active: existingAgent.is_active
      })
    } catch (err) {
      console.error(err)
      if (err.response?.status === 404) navigate('/dashboard')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    try {
      await api.put(`/agents/${id}`, formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const testPrompt = async () => {
    try {
      const res = await api.post('/agents/test-prompt', {
        system_prompt: formData.system_prompt,
        test_message: 'Hola, ¿qué servicios ofrecen?'
      })
      alert('Respuesta: ' + res.data.response)
    } catch (err) {
      alert('Error probando el prompt')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">
            ← Volver
          </button>
          <h1 className="text-xl font-bold text-slate-800">Configurar Agente</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {saved && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✅ Configuración guardada exitosamente
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información del Negocio */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">🏢 Información del Negocio</h2>
            <div className="mb-4">
              <label className="block text-slate-600 text-sm font-medium mb-2">Nombre del Agente en el CRM</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange(null, 'name', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 font-bold"
                placeholder="Ej: Agente Principal"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={formData.business_info.nombre}
                  onChange={(e) => handleChange('business_info', 'nombre', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="Mi Negocio C.A."
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Horario de Atención</label>
                <input
                  type="text"
                  value={formData.business_info.horario}
                  onChange={(e) => handleChange('business_info', 'horario', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="Lun-Vie 9am-6pm"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Dirección</label>
                <input
                  type="text"
                  value={formData.business_info.direccion}
                  onChange={(e) => handleChange('business_info', 'direccion', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="Av. Principal #123"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="text"
                  value={formData.business_info.telefono}
                  onChange={(e) => handleChange('business_info', 'telefono', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="+584120000000"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-600 text-sm font-medium mb-2">Métodos de Pago</label>
                <div className="flex flex-wrap gap-2">
                  {['Efectivo', 'Transferencia', 'Yape', 'Plin', 'MercadoPago'].map(mp => (
                    <label key={mp} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.business_info.metodos_pago.includes(mp)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...formData.business_info.metodos_pago, mp]
                            : formData.business_info.metodos_pago.filter(p => p !== mp)
                          handleChange('business_info', 'metodos_pago', updated)
                        }}
                        className="rounded border-slate-300 text-brand-600"
                      />
                      <span className="text-slate-700">{mp}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Prompt del Agente */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">🧠 Prompt del Agente</h2>
              <button
                type="button"
                onClick={testPrompt}
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                Probar Prompt
              </button>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Define cómo se comporta tu agente. Incluye información importante como métodos de pago, políticas, etc.
            </p>
            <textarea
              value={formData.system_prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 h-48 font-mono text-sm"
              placeholder="Eres el asistente virtual de [Nombre del Negocio]. Horario: [horario]. Métodos de pago: [métodos]. Siempre salute amablemente..."
            />
          </section>

          {/* Integraciones de Canales */}
          {/* Permisos y Habilidades */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">🔑 Permisos y Habilidades</h2>
            <p className="text-slate-600 text-sm mb-4">
              Selecciona qué integraciones globales puede utilizar este agente. (Configura los tokens en la pestaña "Integraciones").
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'whatsapp_reply', label: 'Responder mensajes de WhatsApp', icon: '📱' },
                { id: 'instagram_reply', label: 'Responder mensajes de Instagram', icon: '📸' },
                { id: 'telegram_notify', label: 'Enviar notificaciones por Telegram', icon: '✈️' },
                { id: 'google_sheets_read', label: 'Consultar datos de Google Sheets', icon: '📊' },
                { id: 'google_sheets_write', label: 'Escribir datos en Google Sheets', icon: '📝' }
              ].map(perm => (
                <label key={perm.id} className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(perm.id)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...formData.permissions, perm.id]
                        : formData.permissions.filter(p => p !== perm.id)
                      handleChange(null, 'permissions', updated)
                    }}
                    className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{perm.icon}</span>
                    <span className="font-medium text-slate-800">{perm.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Estado */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">⚡ Estado del Agente</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-5 h-5 rounded border-slate-300 text-brand-600"
              />
              <span className="text-slate-700 font-medium">Agente activo</span>
            </label>
            <p className="text-slate-500 text-sm mt-2">
              Cuando está activo, el agente responderá automáticamente a los mensajes de WhatsApp.
            </p>
          </section>

          {/* Botón guardar */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function AgentConfig() {
  const { user } = useAuth()
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
    whatsapp_config: {
      phone_number_id: '',
      access_token: ''
    },
    google_sheets_config: {
      sheet_id: '',
      hoja_productos: 'Productos',
      hoja_servicios: 'Servicios'
    },
    is_active: true
  })

  useEffect(() => {
    loadAgent()
  }, [])

  const loadAgent = async () => {
    try {
      const res = await api.get('/agents')
      if (res.data.length > 0) {
        const existingAgent = res.data[0]
        setAgent(existingAgent)
        setFormData({
          name: existingAgent.name || '',
          business_info: existingAgent.business_info ? JSON.parse(existingAgent.business_info) : formData.business_info,
          system_prompt: existingAgent.system_prompt || '',
          whatsapp_config: existingAgent.whatsapp_config ? JSON.parse(existingAgent.whatsapp_config) : formData.whatsapp_config,
          google_sheets_config: existingAgent.google_sheets_config ? JSON.parse(existingAgent.google_sheets_config) : formData.google_sheets_config,
          is_active: existingAgent.is_active
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    try {
      await api.post('/agents', formData)
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Nombre del Negocio</label>
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

          {/* WhatsApp */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">💬 Configuración de WhatsApp</h2>
            <p className="text-slate-600 text-sm mb-4">
              Conecta tu número de WhatsApp Business para recibir y responder mensajes automáticamente.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Phone Number ID</label>
                <input
                  type="text"
                  value={formData.whatsapp_config.phone_number_id}
                  onChange={(e) => handleChange('whatsapp_config', 'phone_number_id', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="Obténlo de Meta Developer Portal"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Access Token</label>
                <input
                  type="password"
                  value={formData.whatsapp_config.access_token}
                  onChange={(e) => handleChange('whatsapp_config', 'access_token', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="Token de tu app de Meta"
                />
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-4">
              🔒 Estas credenciales se almacenan de forma segura y solo son usadas para conectar tu WhatsApp.
            </p>
          </section>

          {/* Google Sheets */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">📊 Google Sheets</h2>
            <p className="text-slate-600 text-sm mb-4">
              Conecta una hoja de cálculo con tus productos o servicios para que el agente pueda consultarlos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Sheet ID</label>
                <input
                  type="text"
                  value={formData.google_sheets_config.sheet_id}
                  onChange={(e) => handleChange('google_sheets_config', 'sheet_id', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="1abc...XYZ"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Hoja Productos</label>
                <input
                  type="text"
                  value={formData.google_sheets_config.hoja_productos}
                  onChange={(e) => handleChange('google_sheets_config', 'hoja_productos', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Hoja Servicios</label>
                <input
                  type="text"
                  value={formData.google_sheets_config.hoja_servicios}
                  onChange={(e) => handleChange('google_sheets_config', 'hoja_servicios', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                />
              </div>
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

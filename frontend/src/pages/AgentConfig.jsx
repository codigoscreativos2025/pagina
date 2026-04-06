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

  const [facebookLoading, setFacebookLoading] = useState(false)

  useEffect(() => {
    loadAgent()
    initFacebookSdk()
  }, [])

  const initFacebookSdk = () => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : import.meta.env.VITE_FACEBOOK_APP_ID || 'TU_FACEBOOK_APP_ID',
        cookie     : true,
        xfbml      : true,
        version    : 'v18.0'
      });
    };

    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "https://connect.facebook.net/es_LA/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }

  const launchWhatsAppSignup = () => {
    setFacebookLoading(true)
    
    // Configuración recomendada para Meta Embedded Signup
    const configId = import.meta.env.VITE_FACEBOOK_CONFIG_ID || ''
    
    window.FB.login((response) => {
      setFacebookLoading(false)
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken
        // Enviar el token corto al backend para completar onboard
        exchangeTokenWithBackend(accessToken)
      } else {
        alert('Se canceló la vinculación con Facebook.')
      }
    }, {
      config_id: configId,
      extras: {
        feature: 'whatsapp_embedded_signup',
        version: 2
      },
      scope: 'whatsapp_business_management, whatsapp_business_messaging'
    });
  }

  const exchangeTokenWithBackend = async (accessToken) => {
    try {
      setLoading(true)
      const res = await api.post('/webhooks/onboarding', { access_token: accessToken })
      handleChange('whatsapp_config', 'phone_number_id', res.data.phone_number_id)
      
      // Guardar status actualizado
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
      alert('Error contactando con el Backend para el registro de WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

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

          {/* WhatsApp / Meta Embedded Signup */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">💬 Conexión con WhatsApp Business</h2>
            
            <p className="text-slate-700 font-semibold mb-2">Opción 1: Conexión Automática Oficial</p>
            <p className="text-slate-600 text-sm mb-4">
              Requiere que tu aplicación de Meta for Developers tenga Verificación de Negocio aprobada.
            </p>
            <div className="flex flex-col md:flex-row items-center gap-6 bg-brand-50 p-6 rounded-xl border border-brand-100 mb-6">
              <div className="flex-1">
                {formData.whatsapp_config?.phone_number_id ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">WhatsApp Conectado</h3>
                      <p className="text-sm text-slate-500">ID: {formData.whatsapp_config.phone_number_id}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Sin conexión activa</h3>
                    <p className="text-sm text-slate-600">Presiona el botón para iniciar el proceso de Meta. El sistema configurará tus credenciales y el Webhook automáticamente.</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={launchWhatsAppSignup}
                disabled={facebookLoading || loading}
                className="px-6 py-3 bg-[#1877F2] text-white font-semibold rounded-lg hover:bg-[#166FE5] transition-colors flex items-center gap-3 shadow-md shadow-blue-500/20 whitespace-nowrap disabled:opacity-50"
              >
                {facebookLoading ? (
                  <span>Conectando...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Conectar con Meta
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-slate-200 my-6"></div>

            <p className="text-slate-700 font-semibold mb-2">Opción 2: Conexión Manual (Desarrollo / Sin verificar)</p>
            <p className="text-slate-600 text-sm mb-4">
              Si aún no tienes tu negocio verificado, ingresa directamente las credenciales generadas en el panel de Meta for Developers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Phone Number ID</label>
                <input
                  type="text"
                  value={formData.whatsapp_config?.phone_number_id || ''}
                  onChange={(e) => handleChange('whatsapp_config', 'phone_number_id', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="Ej: 1045231415252..."
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Access Token Permanente</label>
                <input
                  type="password"
                  value={formData.whatsapp_config?.access_token || ''}
                  onChange={(e) => handleChange('whatsapp_config', 'access_token', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="EAXXXX..."
                />
              </div>
            </div>
            
            <p className="text-slate-500 text-xs mt-4">
              🔒 Estas credenciales se almacenan de forma segura y solo son usadas para conectar la IA a tu WhatsApp.
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

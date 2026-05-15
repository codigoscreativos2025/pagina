import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const STEPS = [
  { id: 1, label: 'Tu negocio' },
  { id: 2, label: 'Tipo de negocio' },
  { id: 3, label: 'Conectar canal' },
  { id: 4, label: 'Personalizar' },
  { id: 5, label: '¡Listo!' }
]

export default function OnboardingWizard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState([])
  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    agent_name: '',
    business_info: {},
    channel: '',
    channel_config: null
  })
  const [connecting, setConnecting] = useState(null)

  useEffect(() => {
    api.get('/onboarding/templates')
      .then(res => setTemplates(res.data.templates || []))
      .catch(() => {})
  }, [])

  const selectedTemplate = templates.find(t => t.id === formData.industry)

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const loadFBSDK = async (appId) => {
    // If FB is already loaded and initialized, use it
    if (window.FB && typeof window.FB.login === 'function') {
      return window.FB
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Tiempo de espera agotado. Intenta de nuevo.')), 15000)

      window.fbAsyncInit = function () {
        clearTimeout(timeout)
        window.FB.init({ appId, cookie: true, xfbml: false, version: 'v18.0' })
        resolve(window.FB)
      }

      // If script tag doesn't exist, create it
      if (!document.getElementById('facebook-jssdk')) {
        const js = document.createElement('script')
        js.id = 'facebook-jssdk'
        js.src = 'https://connect.facebook.net/en_US/sdk.js'
        js.onerror = () => { clearTimeout(timeout); reject(new Error('No se pudo cargar el SDK de Facebook')) }
        document.getElementsByTagName('head')[0].appendChild(js)
      }
    })
  }

  const handleConnectWhatsApp = async () => {
    setConnecting('whatsapp')
    try {
      const res = await api.get('/integrations/meta/config-ids').catch(() => ({ data: { configs: {} } }))
      const appId = res.data.app_id
      if (!appId) {
        alert('Falta configurar FACEBOOK_APP_ID en el servidor. Usa "Conectar más tarde".')
        setConnecting(null)
        return
      }

      const FB = await loadFBSDK(appId)

      FB.login(async (response) => {
        if (response.authResponse) {
          try {
            await api.post('/webhooks/onboarding', { access_token: response.authResponse.accessToken })
            updateFormData({ channel: 'whatsapp', channel_config: { connected: true } })
            alert('✅ WhatsApp conectado!')
          } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message))
          }
        } else {
          alert('Conexión cancelada. Puedes conectar más tarde.')
        }
        setConnecting(null)
      }, {
        config_id: res.data.configs.whatsapp || undefined,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: { business: { name: 'Pivot AI' } }, featureType: '', sessionInfoVersion: '2' }
      })
    } catch (err) {
      console.error(err)
      alert('Error conectando WhatsApp: ' + err.message)
      setConnecting(null)
    }
  }

  const handleSkipChannel = () => {
    updateFormData({ channel: '', channel_config: null })
    setStep(4)
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const res = await api.post('/onboarding/complete', formData)
      localStorage.setItem('pivot_onboarding_done', 'true')
      setStep(5)
      // Store agent ID for redirect
      setTimeout(() => {
        navigate(`/config/${res.data.agent.id}`)
      }, 3000)
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || 'No se pudo completar'))
      setLoading(false)
    }
  }

  const canNext = () => {
    if (step === 1) return formData.business_name.trim().length > 0
    if (step === 2) return formData.industry !== ''
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent/5">
      {/* Top bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold text-slate-800">
            <span className="text-brand-600">Pivot</span><span className="text-accent">.AI</span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-slate-500 hover:text-slate-700">
            Ir al Dashboard →
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                  step > s.id ? 'bg-brand-600 text-white' :
                  step === s.id ? 'bg-brand-600 text-white' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {step > s.id ? '✓' : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${step > s.id ? 'bg-brand-600' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-2">Paso {step} de {STEPS.length}: {STEPS[step - 1].label}</p>
        </div>

        {/* Step 1: Business name */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">👋</div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">¡Bienvenido a Pivot.AI!</h1>
              <p className="text-slate-500">Vamos a crear tu primer agente de IA en menos de 5 minutos.</p>
            </div>
            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-slate-700 mb-2">¿Cuál es el nombre de tu negocio?</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={e => updateFormData({ business_name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-lg"
                placeholder="Ej: La Casa del Sabor"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Industry */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">¿Qué tipo de negocio tienes?</h1>
              <p className="text-slate-500">Esto nos ayuda a configurar tu agente automáticamente.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => updateFormData({ industry: t.id })}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    formData.industry === t.id
                      ? 'border-brand-500 bg-brand-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{t.icon}</div>
                  <div className="font-bold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{t.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Connect channel */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Conecta tu canal principal</h1>
              <p className="text-slate-500">¿Por dónde quieres que tu agente atienda a tus clientes?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-6">
              {[
                { id: 'whatsapp', icon: '📱', label: 'WhatsApp', desc: 'El más popular' },
                { id: 'facebook', icon: '💬', label: 'Facebook', desc: 'Messenger' },
                { id: 'instagram', icon: '📸', label: 'Instagram', desc: 'DMs' },
                { id: 'tiktok', icon: '🎵', label: 'TikTok', desc: 'Mensajes directos' }
              ].map(ch => (
                <button
                  key={ch.id}
                  onClick={() => {
                    if (ch.id === 'whatsapp') {
                      handleConnectWhatsApp()
                    } else {
                      // For other channels, skip and configure later
                      updateFormData({ channel: ch.id, channel_config: {} })
                      setStep(4)
                    }
                  }}
                  disabled={connecting === 'whatsapp'}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    formData.channel === ch.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300'
                  } disabled:opacity-50`}
                >
                  <div className="text-3xl mb-2">{ch.icon}</div>
                  <div className="font-bold text-slate-900">{ch.label}</div>
                  <div className="text-xs text-slate-500">{ch.desc}</div>
                  {connecting === 'whatsapp' && ch.id === 'whatsapp' && (
                    <div className="text-xs text-brand-600 mt-2">Conectando...</div>
                  )}
                  {formData.channel === ch.id && formData.channel_config && (
                    <div className="text-xs text-green-600 mt-2">✅ Conectado</div>
                  )}
                </button>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={handleSkipChannel}
                className="text-sm text-slate-500 hover:text-slate-700 underline"
              >
                Conectar más tarde
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Customize */}
        {step === 4 && selectedTemplate && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Personaliza tu agente</h1>
              <p className="text-slate-500">Agrega información de tu negocio para que el agente responda mejor.</p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del agente</label>
                <input
                  type="text"
                  value={formData.agent_name}
                  onChange={e => updateFormData({ agent_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500"
                  placeholder={`${formData.business_name} Asistente`}
                />
              </div>
              {selectedTemplate && selectedTemplate.id && (
                <>
                  {(() => {
                    const template = require('../data/agentTemplates.js')
                    // We can't require in frontend, so we use the API response
                    return null
                  })()}
                  {/* Render fields based on industry */}
                  {formData.industry === 'restaurant' && (<>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                      <input type="text" onChange={e => updateFormData({ business_info: { ...formData.business_info, address: e.target.value } })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Ej: Av. Principal 123" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Horarios</label>
                      <input type="text" onChange={e => updateFormData({ business_info: { ...formData.business_info, schedule: e.target.value } })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Ej: Lun-Vie 11:00-22:00" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                      <input type="text" onChange={e => updateFormData({ business_info: { ...formData.business_info, phone: e.target.value } })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Ej: +1 555 123 4567" />
                    </div>
                  </>)}
                  {formData.industry === 'ecommerce' && (<>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sitio web</label>
                      <input type="text" onChange={e => updateFormData({ business_info: { ...formData.business_info, website: e.target.value } })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Ej: https://tu-tienda.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Info de envíos</label>
                      <input type="text" onChange={e => updateFormData({ business_info: { ...formData.business_info, shipping_info: e.target.value } })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Ej: Envío gratis en compras +$50" />
                    </div>
                  </>)}
                  {formData.industry === 'professional' && (<>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Servicios ofrecidos</label>
                      <input type="text" onChange={e => updateFormData({ business_info: { ...formData.business_info, services: e.target.value } })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Ej: Consultoría legal, contabilidad" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Horarios</label>
                      <input type="text" onChange={e => updateFormData({ business_info: { ...formData.business_info, schedule: e.target.value } })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Ej: Lun-Vie 9:00-18:00" />
                    </div>
                  </>)}
                  {formData.industry === 'clinic' && (<>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Especialidades</label>
                      <input type="text" onChange={e => updateFormData({ business_info: { ...formData.business_info, specialties: e.target.value } })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Ej: Medicina general, cardiología" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                      <input type="text" onChange={e => updateFormData({ business_info: { ...formData.business_info, address: e.target.value } })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Ej: Calle Salud 456" />
                    </div>
                  </>)}
                  {formData.industry === 'education' && (<>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cursos ofrecidos</label>
                      <input type="text" onChange={e => updateFormData({ business_info: { ...formData.business_info, courses: e.target.value } })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Ej: Inglés, programación" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Horarios</label>
                      <input type="text" onChange={e => updateFormData({ business_info: { ...formData.business_info, schedule: e.target.value } })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Ej: Mañana 9-12, Tarde 2-5" />
                    </div>
                  </>)}
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">¡Tu agente está listo!</h1>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              <strong>{formData.agent_name || formData.business_name + ' Asistente'}</strong> ya está activo y puede empezar a atender a tus clientes.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-w-md mx-auto mb-6">
              <div className="text-green-700 font-medium">✅ Agente creado</div>
              <div className="text-green-700 font-medium">✅ Embudo configurado</div>
              {formData.channel && <div className="text-green-700 font-medium">✅ {formData.channel === 'whatsapp' ? 'WhatsApp' : formData.channel} conectado</div>}
              <div className="text-green-700 font-medium">✅ IA activada</div>
            </div>
            <p className="text-sm text-slate-400">Redirigiendo a la configuración...</p>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 5 && (
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium">
                ← Atrás
              </button>
            ) : <div />}
            {step < 4 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="px-8 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            )}
            {step === 4 && (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-8 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando agente...
                  </>
                ) : (
                  '🚀 Crear mi agente'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

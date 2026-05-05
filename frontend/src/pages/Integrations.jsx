import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Integrations() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [facebookLoading, setFacebookLoading] = useState(false)
  const [agent, setAgent] = useState(null)
  const [formData, setFormData] = useState({
    whatsapp_config: {
      phone: '',
      phone_number_id: '',
      access_token: ''
    },
    instagram_config: {
      ig_account_id: '',
      page_id: ''
    }
  })

  useEffect(() => {
    loadAgent()
    initFacebookSdk()
  }, [])

  const initFacebookSdk = () => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : '26381123114874501',
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
      const res = await api.get('/agents')
      if (res.data.length > 0) {
        const existingAgent = res.data[0]
        setAgent(existingAgent)
        setFormData({
          whatsapp_config: parseJSON(existingAgent.whatsapp_config, formData.whatsapp_config),
          instagram_config: parseJSON(existingAgent.instagram_config, formData.instagram_config)
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const launchMetaConnect = () => {
    if (!window.FB) {
      alert('Error: El sistema de Facebook no pudo cargar. Si tienes un bloqueador de anuncios (AdBlock), desactívalo temporalmente e intenta de nuevo.')
      return
    }

    setFacebookLoading(true)
    
    // Configuración para pedir WhatsApp e Instagram
    const configId = '4111992845771305' // Suponiendo que config_id soporta ambos o pediremos genérico
    
    try {
      window.FB.login((response) => {
        setFacebookLoading(false)
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken
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
        scope: 'whatsapp_business_management, whatsapp_business_messaging, instagram_manage_messages, pages_manage_metadata, pages_read_engagement, pages_show_list'
      });
    } catch (err) {
      setFacebookLoading(false)
      alert('El botón de Meta fue bloqueado. Asegúrate de tener habilitados los Pop-Ups.')
    }
  }

  const exchangeTokenWithBackend = async (accessToken) => {
    try {
      setLoading(true)
      const res = await api.post('/webhooks/onboarding', { access_token: accessToken })
      
      // Update local state temporarily
      const newWaConfig = { ...formData.whatsapp_config, phone_number_id: res.data.phone_number_id, access_token: accessToken }
      setFormData(prev => ({ ...prev, whatsapp_config: newWaConfig }))
      
      // Save to agent
      if (agent) {
        await api.post('/agents', { ...agent, whatsapp_config: newWaConfig })
      }
      alert('Conexión con Meta (WhatsApp e Instagram) exitosa!')
      loadAgent()
    } catch (err) {
      console.error(err)
      alert('Error contactando con el Backend para el registro de WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleSaveManual = async () => {
    setLoading(true)
    try {
      if (agent) {
        await api.post('/agents', { ...agent, whatsapp_config: formData.whatsapp_config, instagram_config: formData.instagram_config })
        alert('Credenciales guardadas correctamente.')
      }
    } catch (err) {
      console.error(err)
      alert('Error al guardar credenciales.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">
            ← Volver al Dashboard
          </button>
          <h1 className="text-xl font-bold text-slate-800">Centro de Integraciones</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {/* Conexión Oficial Meta */}
        <section className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Conexión con Meta (WhatsApp e Instagram)</h2>
              <p className="text-slate-500 text-sm">Vincula tus cuentas oficiales para recibir mensajes en el CRM automáticamente.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="flex-1 w-full space-y-3">
              {formData.whatsapp_config?.phone_number_id ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-xl">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-900 text-sm">WhatsApp Conectado</h3>
                    <p className="text-xs text-green-700">ID: {formData.whatsapp_config.phone_number_id}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                  <span className="text-xl opacity-50">💬</span>
                  <div>
                    <h3 className="font-semibold text-gray-700 text-sm">WhatsApp Pendiente</h3>
                    <p className="text-xs text-gray-500">No hay cuenta vinculada</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                <span className="text-xl opacity-50">📸</span>
                <div>
                  <h3 className="font-semibold text-gray-700 text-sm">Instagram DMs</h3>
                  <p className="text-xs text-gray-500">Se vinculará junto con WhatsApp</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={launchMetaConnect}
              disabled={facebookLoading || loading}
              className="w-full md:w-auto px-8 py-4 bg-[#1877F2] text-white font-semibold rounded-xl hover:bg-[#166FE5] transition-colors flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 whitespace-nowrap disabled:opacity-50"
            >
              {facebookLoading ? 'Abriendo Facebook...' : 'Conectar Cuentas con Meta'}
            </button>
          </div>
        </section>

        {/* Conexión Manual */}
        <section className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">⚙️ Configuración Manual Avanzada</h2>
          <p className="text-slate-600 text-sm mb-6">Solo usa esta sección si estás en modo desarrollo o usando tokens generados manualmente en Meta for Developers.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">WhatsApp: Número de Teléfono</label>
              <input
                type="text"
                value={formData.whatsapp_config?.phone || ''}
                onChange={(e) => handleChange('whatsapp_config', 'phone', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                placeholder="Ej: 15556433397"
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">WhatsApp: Phone Number ID</label>
              <input
                type="text"
                value={formData.whatsapp_config?.phone_number_id || ''}
                onChange={(e) => handleChange('whatsapp_config', 'phone_number_id', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                placeholder="Ej: 1045231415252..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-600 text-sm font-medium mb-2">Meta: Access Token Permanente</label>
              <input
                type="password"
                value={formData.whatsapp_config?.access_token || ''}
                onChange={(e) => handleChange('whatsapp_config', 'access_token', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 font-mono text-sm"
                placeholder="EAXXXX..."
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveManual}
              disabled={loading}
              className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium disabled:opacity-50"
            >
              Guardar Credenciales Manuales
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}

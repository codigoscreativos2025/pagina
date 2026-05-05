import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Integrations() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [integrations, setIntegrations] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null) // 'whatsapp', 'instagram', 'telegram', 'google'
  const [formData, setFormData] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await api.get('/integrations')
      setIntegrations(res.data.integrations || {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (type) => {
    const configData = integrations[`${type}_config`] || {}
    let initialData = {}
    
    if (type === 'whatsapp') {
      initialData = { phone: configData.phone || '', phone_number_id: configData.phone_number_id || '', access_token: configData.access_token || '' }
    } else if (type === 'instagram') {
      initialData = { page_id: configData.page_id || '', access_token: configData.access_token || '' }
    } else if (type === 'google') {
      initialData = { sheet_id: configData.sheet_id || '', credentials_json: configData.credentials_json || '' }
    } else if (type === 'telegram') {
      initialData = { bot_token: configData.bot_token || '' }
    }
    
    setFormData(initialData)
    setActiveModal(type)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/integrations/${activeModal}`, formData)
      loadData()
      setActiveModal(null)
    } catch (err) {
      console.error(err)
      alert('Error guardando la integración')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">
            ← Volver al Dashboard
          </button>
          <h1 className="text-xl font-bold text-slate-800">Centro de Integraciones</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Conexiones Globales</h1>
          <p className="text-slate-600">Conecta tus cuentas oficiales aquí. Luego podrás darle permiso a tus agentes para usar estas integraciones.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* WhatsApp */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl">
                  📱
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">WhatsApp Business</h2>
                  <p className="text-slate-500 text-sm">Conecta tu API de WhatsApp Cloud</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${integrations.whatsapp_config?.access_token ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {integrations.whatsapp_config?.access_token ? 'Conectado' : 'Inactivo'}
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4">
              <button 
                onClick={() => alert("El login nativo está reservado para Business Solution Providers (BSP). Por favor, usa la configuración manual.")}
                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
              >
                Conectar Oficial
              </button>
              <button 
                onClick={() => openModal('whatsapp')}
                className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
              >
                Configurar Manual
              </button>
            </div>
          </div>

          {/* Instagram */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center text-2xl">
                  📸
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Instagram</h2>
                  <p className="text-slate-500 text-sm">Conecta tu cuenta profesional de Instagram</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${integrations.instagram_config?.access_token ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {integrations.instagram_config?.access_token ? 'Conectado' : 'Inactivo'}
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4">
              <button 
                onClick={() => alert("El login nativo de Instagram está en revisión por Meta. Por favor, usa la configuración manual.")}
                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
              >
                Conectar Oficial
              </button>
              <button 
                onClick={() => openModal('instagram')}
                className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
              >
                Configurar Manual
              </button>
            </div>
          </div>

          {/* Telegram */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
                  ✈️
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Telegram</h2>
                  <p className="text-slate-500 text-sm">Conecta un Bot de Telegram</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${integrations.telegram_config?.bot_token ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {integrations.telegram_config?.bot_token ? 'Conectado' : 'Inactivo'}
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4">
              <button 
                onClick={() => openModal('telegram')}
                className="w-full px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
              >
                Configurar Token
              </button>
            </div>
          </div>

          {/* Google */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-2xl">
                  📊
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Google Workspace</h2>
                  <p className="text-slate-500 text-sm">Acceso a Docs, Sheets y Drive</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${integrations.google_config?.sheet_id ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {integrations.google_config?.sheet_id ? 'Conectado' : 'Inactivo'}
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4">
              <button 
                onClick={() => alert("Google OAuth en mantenimiento. Configura mediante ID y JSON de cuenta de servicio.")}
                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
              >
                Conectar Oficial
              </button>
              <button 
                onClick={() => openModal('google')}
                className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
              >
                Configurar Manual
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 capitalize">Configurar {activeModal}</h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {activeModal === 'whatsapp' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp: Número de Teléfono (con código de país)</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" placeholder="Ej: 15556433397" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp: Phone Number ID</label>
                    <input type="text" value={formData.phone_number_id} onChange={e => setFormData({...formData, phone_number_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Meta: Access Token Permanente</label>
                    <input type="password" value={formData.access_token} onChange={e => setFormData({...formData, access_token: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" />
                  </div>
                </>
              )}

              {activeModal === 'instagram' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Instagram Page ID</label>
                    <input type="text" value={formData.page_id} onChange={e => setFormData({...formData, page_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Meta: Access Token Permanente</label>
                    <input type="password" value={formData.access_token} onChange={e => setFormData({...formData, access_token: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" />
                  </div>
                </>
              )}

              {activeModal === 'telegram' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telegram Bot Token (obtenido de BotFather)</label>
                  <input type="password" value={formData.bot_token} onChange={e => setFormData({...formData, bot_token: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" />
                </div>
              )}

              {activeModal === 'google' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Google Sheet ID (Principal)</label>
                    <input type="text" value={formData.sheet_id} onChange={e => setFormData({...formData, sheet_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Google Service Account JSON (Credenciales)</label>
                    <textarea rows="4" value={formData.credentials_json} onChange={e => setFormData({...formData, credentials_json: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none font-mono text-xs" placeholder='{ "type": "service_account", ... }'></textarea>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">Guardar Configuración</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

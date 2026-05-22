import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Integrations() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [integrations, setIntegrations] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null)
  const [formData, setFormData] = useState({})
  const [metaConfigs, setMetaConfigs] = useState({ app_id: '', configs: {} })
  const [connecting, setConnecting] = useState(null)
  const [selectedPage, setSelectedPage] = useState(null)
  const [facebookPages, setFacebookPages] = useState([])
  const [showPageSelector, setShowPageSelector] = useState(false)
  const [metaReviewStatus, setMetaReviewStatus] = useState({ tests: [], totalCompleted: 0, totalRequired: 0 })
  const [loadingMetaTests, setLoadingMetaTests] = useState(false)

  useEffect(() => { loadData() }, [])

  // Check Google OAuth callback result
  useEffect(() => {
    const googleResult = searchParams.get('google')
    if (googleResult === 'success') {
      alert('✅ Google conectado exitosamente!')
      loadData()
    } else if (googleResult === 'error') {
      alert('❌ Error conectando Google: ' + (searchParams.get('reason') || 'desconocido'))
    }

    const tiktokResult = searchParams.get('tiktok')
    if (tiktokResult === 'success') {
      alert('✅ TikTok conectado exitosamente!')
      loadData()
    } else if (tiktokResult === 'error') {
      alert('❌ Error conectando TikTok: ' + (searchParams.get('reason') || 'desconocido'))
    }

    const tiktokAdsResult = searchParams.get('tiktok_ads')
    if (tiktokAdsResult === 'success') {
      alert('✅ TikTok Ads conectado exitosamente!')
      loadData()
    } else if (tiktokAdsResult === 'error') {
      alert('❌ Error conectando TikTok Ads: ' + (searchParams.get('reason') || 'desconocido'))
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      const [intRes, metaRes, metaTestsRes] = await Promise.all([
        api.get('/integrations'),
        api.get('/integrations/meta/config-ids').catch(() => ({ data: { configs: {} } })),
        api.get('/integrations/meta-review-status').catch(() => ({ data: { tests: [] } }))
      ])
      setIntegrations(intRes.data.integrations || {})
      if (metaRes.data.success) setMetaConfigs(metaRes.data)
      if (metaTestsRes.data.success) setMetaReviewStatus(metaTestsRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  // Load Facebook SDK
  const loadFBSDK = useCallback(() => {
    return new Promise((resolve) => {
      if (window.FB) return resolve(window.FB)
      window.fbAsyncInit = function () {
        window.FB.init({ appId: metaConfigs.app_id, cookie: true, xfbml: false, version: 'v18.0' })
        resolve(window.FB)
      }
      if (!document.getElementById('facebook-jssdk')) {
        const js = document.createElement('script')
        js.id = 'facebook-jssdk'
        js.src = 'https://connect.facebook.net/en_US/sdk.js'
        document.getElementsByTagName('head')[0].appendChild(js)
      }
    })
  }, [metaConfigs.app_id])

  useEffect(() => {
    if (metaConfigs.app_id) {
      loadFBSDK()
    }
  }, [metaConfigs.app_id, loadFBSDK])

  // Meta OAuth: WhatsApp
  const connectWhatsApp = () => {
    if (!metaConfigs.app_id) return alert('Falta configurar FACEBOOK_APP_ID en el servidor.')
    if (!window.FB) return alert('El SDK de Facebook aún está cargando. Intenta de nuevo en unos segundos.')
    
    setConnecting('whatsapp')
    try {
      const configId = metaConfigs.configs.whatsapp;
      const loginOpts = {
        response_type: 'token',
        override_default_response_type: true,
        extras: { setup: { business: { name: 'Pivot AI' } }, featureType: '', sessionInfoVersion: '2' }
      };

      if (configId) {
        loginOpts.config_id = configId;
      } else {
        loginOpts.scope = 'whatsapp_business_management,whatsapp_business_messaging,business_management';
      }

      window.FB.login((response) => {
        if (response.authResponse) {
          api.post('/webhooks/onboarding', { access_token: response.authResponse.accessToken })
            .then(() => { alert('✅ WhatsApp conectado!'); loadData() })
            .catch(err => alert('Error: ' + (err.response?.data?.error || err.message)))
        } else { alert('Conexión cancelada por el usuario.') }
        setConnecting(null)
      }, loginOpts)
    } catch (err) { console.error(err); setConnecting(null) }
  }

  // Meta OAuth: Instagram
  const connectInstagram = () => {
    if (!metaConfigs.app_id) return alert('Falta configurar FACEBOOK_APP_ID en el servidor.')
    if (!window.FB) return alert('El SDK de Facebook aún está cargando. Intenta de nuevo en unos segundos.')
    
    setConnecting('instagram')
    try {
      const configId = metaConfigs.configs.instagram
      const loginOpts = configId
        ? { config_id: configId, response_type: 'token', override_default_response_type: true }
        : { scope: 'instagram_basic,pages_show_list,pages_read_engagement,pages_messaging,instagram_manage_messages', response_type: 'token' }
      
      window.FB.login((response) => {
        if (response.authResponse) {
          api.post('/integrations/meta/onboarding', { access_token: response.authResponse.accessToken, type: 'instagram' })
            .then(res => { alert(`✅ Instagram conectado! Página: ${res.data.page_name}`); loadData() })
            .catch(err => alert('Error: ' + (err.response?.data?.error || err.message)))
        } else { alert('Conexión cancelada.') }
        setConnecting(null)
      }, loginOpts)
    } catch (err) { console.error(err); setConnecting(null) }
  }

  // Meta OAuth: Ads
  const connectMetaAds = () => {
    if (!metaConfigs.app_id) return alert('Falta configurar FACEBOOK_APP_ID en el servidor.')
    if (!window.FB) return alert('El SDK de Facebook aún está cargando. Intenta de nuevo en unos segundos.')
    
    setConnecting('meta_ads')
    try {
      const configId = metaConfigs.configs.meta_ads
      const loginOpts = configId
        ? { config_id: configId, response_type: 'token', override_default_response_type: true }
        : { scope: 'ads_read,business_management', response_type: 'token' }
      
      window.FB.login((response) => {
        if (response.authResponse) {
          api.post('/integrations/meta/onboarding', { access_token: response.authResponse.accessToken, type: 'meta_ads' })
            .then(res => { alert(`✅ Meta Ads conectado! Cuenta: ${res.data.ad_account_name}`); loadData() })
            .catch(err => alert('Error: ' + (err.response?.data?.error || err.message)))
        } else { alert('Conexión cancelada.') }
        setConnecting(null)
      }, loginOpts)
    } catch (err) { console.error(err); setConnecting(null) }
  }

  // Google OAuth
  const connectGoogle = async () => {
    setConnecting('google')
    try {
      const res = await api.get('/integrations/google/auth-url')
      if (res.data.url) {
        window.location.href = res.data.url
      } else { alert('Error generando URL de Google'); setConnecting(null) }
    } catch (err) { alert('Error: ' + err.message); setConnecting(null) }
  }

  // TikTok OAuth (Messages)
  const connectTikTok = async () => {
    setConnecting('tiktok')
    try {
      const res = await api.get('/integrations/tiktok/auth-url')
      if (res.data.url) {
        window.location.href = res.data.url
      } else { alert('Error generando URL de TikTok'); setConnecting(null) }
    } catch (err) { alert('Error: ' + err.message); setConnecting(null) }
  }

  // TikTok Ads OAuth
  const connectTikTokAds = async () => {
    setConnecting('tiktok_ads')
    try {
      const res = await api.get('/integrations/tiktok/ads-auth-url')
      if (res.data.url) {
        window.location.href = res.data.url
      } else { alert('Error generando URL de TikTok Ads'); setConnecting(null) }
    } catch (err) { alert('Error: ' + err.message); setConnecting(null) }
  }

  // Facebook Page (Messenger)
  const connectFacebook = () => {
    if (!metaConfigs.app_id) return alert('Falta configurar FACEBOOK_APP_ID en el servidor.')
    if (!window.FB) return alert('El SDK de Facebook aún está cargando. Intenta de nuevo en unos segundos.')
    
    setConnecting('facebook')
    try {
      window.FB.login((response) => {
        console.log('[FB.login] Facebook Messenger Response:', response);
        const processResponse = async () => {
          if (response.authResponse) {
            try {
              // Get user pages
              const pagesRes = await api.get(`/integrations/facebook/pages?access_token=${response.authResponse.accessToken}`)
              if (pagesRes.data.success && pagesRes.data.pages.length > 0) {
                setFacebookPages(pagesRes.data.pages)
                setShowPageSelector(true)
                setConnecting(null)
              } else {
                alert('No se encontraron Páginas de Facebook.')
                setConnecting(null)
              }
            } catch (err) {
              alert('Error: ' + (err.response?.data?.error || err.message))
              setConnecting(null)
            }
          } else { 
            alert('Conexión cancelada.'); 
            setConnecting(null) 
          }
        };
        processResponse();
      }, { scope: 'pages_show_list,pages_manage_metadata,pages_messaging', response_type: 'token' })
    } catch (err) { console.error(err); setConnecting(null) }
  }

  const selectFacebookPage = async (page) => {
    try {
      setConnecting('facebook')
      const res = await api.post('/integrations/facebook/onboarding', {
        access_token: page.access_token,
        page_id: page.id
      })
      alert(`✅ Facebook Messenger conectado! Página: ${res.data.page_name}`)
      loadData()
      setShowPageSelector(false)
      setSelectedPage(null)
      setConnecting(null)
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
      setConnecting(null)
    }
  }

  // Ejecutar test de Meta Review manualmente
  const runMetaTest = async (testType) => {
    setLoadingMetaTests(true)
    try {
      let res
      if (testType === 'utility_message') {
        res = await api.post('/integrations/test-utility-message')
      } else if (testType === 'whatsapp_utility_message') {
        res = await api.post('/integrations/test-whatsapp-utility-message')
      } else if (testType === 'public_profile') {
        res = await api.post('/integrations/test-public-profile')
      } else if (testType === 'pages_show_list') {
        res = await api.post('/integrations/test-pages-show-list')
      } else {
        const permission = testType.replace('ig_', '')
        res = await api.post(`/integrations/test-instagram/${permission}`)
      }
      alert(`✅ Test completado: ${res.data.message}`)
      loadData()
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoadingMetaTests(false)
    }
  }

  const openModal = (type) => {
    const configData = integrations[`${type}_config`] || {}
    let initialData = {}
    if (type === 'whatsapp') initialData = { phone: configData.phone || '', phone_number_id: configData.phone_number_id || '', access_token: configData.access_token || '' }
    else if (type === 'instagram') initialData = { page_id: configData.page_id || '', access_token: configData.access_token || '' }
    else if (type === 'google') initialData = { sheet_id: configData.sheet_id || '', credentials_json: configData.credentials_json || '' }
    else if (type === 'telegram') initialData = { bot_token: configData.bot_token || '' }
    else if (type === 'meta_ads') initialData = { ad_account_id: configData.ad_account_id || '', access_token: configData.access_token || '' }
    else if (type === 'tiktok') initialData = { open_id: configData.open_id || '', access_token: configData.access_token || '' }
    else if (type === 'tiktok_ads') initialData = { advertiser_id: configData.advertiser_id || '', access_token: configData.access_token || '' }
    else if (type === 'facebook') initialData = { page_id: configData.page_id || '', access_token: configData.access_token || '' }
    setFormData(initialData)
    setActiveModal(type)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/integrations/${activeModal}`, formData)
      loadData()
      setActiveModal(null)
    } catch (err) { alert('Error guardando la integración') }
  }

  const disconnectIntegration = async (key) => {
    const names = { whatsapp: 'WhatsApp', google: 'Google', instagram: 'Instagram', telegram: 'Telegram', meta_ads: 'Meta Ads', tiktok: 'TikTok', tiktok_ads: 'TikTok Ads', facebook: 'Facebook' }
    if (!confirm(`¿Desconectar ${names[key] || key}? Esto eliminará la configuración guardada.`)) return
    try {
      await api.delete(`/integrations/${key}`)
      loadData()
    } catch (err) { alert('Error desconectando: ' + (err.response?.data?.error || err.message)) }
  }

  const checkWebhookStatus = async () => {
    try {
      const res = await api.get('/integrations/facebook/webhook-status')
      const status = res.data.status
      const fb = status.facebook
      const ig = status.instagram
      
      let message = `📘 Facebook Messenger:\n`
      message += `Conectado: ${fb.connected ? '✅ Sí' : '❌ No'}\n`
      if (fb.connected) {
        message += `Página: ${fb.page_name} (${fb.page_id})\n`
      }
      message += `\nWebhook URL: ${fb.webhook_url}\n`
      message += `Verify Token: ${fb.verify_token}\n`
      
      if (ig.connected) {
        message += `\n📷 Instagram:\n`
        message += `Conectado: ✅ Sí\n`
        message += `Page ID: ${ig.page_id}\n`
        message += `IG Account ID: ${ig.ig_account_id}\n`
      }
      
      alert(message)
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    }
  }

  const resubscribeWebhooks = async () => {
    if (!confirm('¿Re-suscribir webhooks de Facebook? Esto actualizará la suscripción en Meta.')) return
    try {
      const res = await api.post('/integrations/facebook/resubscribe-webhooks')
      alert('✅ Webhooks re-suscritos: ' + JSON.stringify(res.data.data).substring(0, 100))
      loadData()
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    }
  }

  const cards = [
    {
      key: 'whatsapp', icon: '📱', iconBg: 'bg-green-100 text-green-600',
      title: 'WhatsApp Business', desc: 'Conecta tu API de WhatsApp Cloud',
      connected: integrations.whatsapp_config?.access_token,
      connectedLabel: integrations.whatsapp_config?.phone || integrations.whatsapp_config?.phone_number_id,
      onConnect: connectWhatsApp, connectLabel: 'Conectar con Meta',
      onDisconnect: () => disconnectIntegration('whatsapp'),
      onManual: () => openModal('whatsapp'), manualLabel: 'Manual'
    },
    {
      key: 'instagram', icon: '📸', iconBg: 'bg-pink-100 text-pink-600',
      title: 'Instagram', desc: 'Conecta tu cuenta profesional de Instagram',
      connected: integrations.instagram_config?.access_token,
      connectedLabel: integrations.instagram_config?.page_name,
      onConnect: connectInstagram, connectLabel: 'Conectar con Facebook',
      onDisconnect: () => disconnectIntegration('instagram'),
      onManual: () => openModal('instagram'), manualLabel: 'Manual'
    },
    {
      key: 'facebook', icon: '💬', iconBg: 'bg-blue-100 text-blue-600',
      title: 'Facebook Messenger', desc: 'Conecta tu Página de Facebook para Messenger',
      connected: integrations.facebook_config?.page_id,
      connectedLabel: integrations.facebook_config?.page_name,
      onConnect: connectFacebook, connectLabel: 'Conectar con Facebook',
      onDisconnect: () => disconnectIntegration('facebook'),
      onManual: () => openModal('facebook'), manualLabel: 'Manual',
      onDiagnostic: checkWebhookStatus,
      onResubscribe: resubscribeWebhooks
    },
    {
      key: 'tiktok', icon: '🎵', iconBg: 'bg-gray-100 text-gray-900',
      title: 'TikTok Messages', desc: 'Conecta TikTok para recibir y enviar DMs',
      connected: integrations.tiktok_config?.open_id,
      connectedLabel: integrations.tiktok_config?.display_name,
      onConnect: connectTikTok, connectLabel: 'Conectar con TikTok',
      onDisconnect: () => disconnectIntegration('tiktok'),
      onManual: () => openModal('tiktok'), manualLabel: 'Manual'
    },
    {
      key: 'telegram', icon: '✈️', iconBg: 'bg-blue-100 text-blue-600',
      title: 'Telegram', desc: 'Conecta un Bot de Telegram',
      connected: integrations.telegram_config?.bot_token,
      connectedLabel: null,
      onConnect: null, onDisconnect: () => disconnectIntegration('telegram'),
      onManual: () => openModal('telegram'), manualLabel: 'Configurar Token'
    },
    {
      key: 'google', icon: '📊', iconBg: 'bg-red-100 text-red-600',
      title: 'Google Workspace', desc: 'Sheets, Calendar y Drive',
      connected: integrations.google_config?.refresh_token || integrations.google_config?.access_token,
      connectedLabel: integrations.google_config?.email,
      onConnect: connectGoogle, connectLabel: 'Conectar con Google',
      onDisconnect: () => disconnectIntegration('google'),
      onManual: () => openModal('google'), manualLabel: 'Manual'
    },
    {
      key: 'meta_ads', icon: '📣', iconBg: 'bg-indigo-100 text-indigo-600',
      title: 'Meta Ads', desc: 'Métricas de campañas publicitarias',
      connected: integrations.meta_ads_config?.ad_account_id,
      connectedLabel: integrations.meta_ads_config?.ad_account_name,
      onConnect: connectMetaAds, connectLabel: 'Conectar con Facebook',
      onDisconnect: () => disconnectIntegration('meta_ads'),
      onManual: () => openModal('meta_ads'), manualLabel: 'Manual'
    },
    {
      key: 'tiktok_ads', icon: '📈', iconBg: 'bg-gray-100 text-gray-900',
      title: 'TikTok Ads', desc: 'Métricas de campañas publicitarias',
      connected: integrations.tiktok_ads_config?.advertiser_id,
      connectedLabel: integrations.tiktok_ads_config?.advertiser_name,
      onConnect: connectTikTokAds, connectLabel: 'Conectar con TikTok Ads',
      onDisconnect: () => disconnectIntegration('tiktok_ads'),
      onManual: () => openModal('tiktok_ads'), manualLabel: 'Manual'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">← Volver al Dashboard</button>
          <h1 className="text-xl font-bold text-slate-800">Centro de Integraciones</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Conexiones</h1>
          <p className="text-slate-500 text-sm">Conecta tus cuentas con un clic. Tus usuarios finales no necesitan crear aplicaciones.</p>
        </div>

        {/* Meta App Review Status */}
        <div className="mb-8 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">📋 Meta App Review - Estado de Tests</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${metaReviewStatus.totalCompleted >= metaReviewStatus.totalRequired ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {metaReviewStatus.totalCompleted}/{metaReviewStatus.totalRequired} completados
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Estos tests se ejecutan automáticamente al iniciar el backend. También puedes ejecutarlos manualmente si es necesario.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {metaReviewStatus.tests.map((test) => (
              <div
                key={test.label}
                className={`p-4 rounded-lg border ${test.executed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{test.type === 'facebook' ? '📘' : '📷'}</span>
                      <span className="font-semibold text-slate-800 text-sm">{test.label}</span>
                    </div>
                    {test.executed ? (
                      <>
                        <div className="text-xs text-green-700 mb-1">✅ Ejecutado</div>
                        <div className="text-xs text-slate-500">{new Date(test.executed_at).toLocaleString()}</div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-500">⏳ Pendiente</div>
                    )}
                  </div>
                  {!test.executed && (
                    <button
                      onClick={() => {
                        if (test.label === 'pages_utility_messaging') {
                          runMetaTest('utility_message')
                        } else if (test.label === 'whatsapp_utility_messaging') {
                          runMetaTest('whatsapp_utility_message')
                        } else if (test.label === 'public_profile') {
                          runMetaTest('public_profile')
                        } else if (test.label === 'pages_show_list') {
                          runMetaTest('pages_show_list')
                        } else {
                          runMetaTest(`ig_${test.label.replace('instagram_', '').replace('business_', '')}`)
                        }
                      }}
                      disabled={loadingMetaTests}
                      className="px-2 py-1 bg-brand-600 text-white text-xs rounded hover:bg-brand-700 disabled:opacity-50"
                    >
                      {loadingMetaTests ? '...' : 'Ejecutar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map(card => (
            <div key={card.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${card.iconBg}`}>{card.icon}</div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{card.title}</h2>
                    <p className="text-slate-500 text-sm">{card.desc}</p>
                    {card.connected && card.connectedLabel && <p className="text-xs text-green-600 mt-1 font-medium">{card.connectedLabel}</p>}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${card.connected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {card.connected ? '✅ Conectado' : 'Inactivo'}
                </div>
              </div>
              <div className="p-4 bg-slate-50 flex gap-3">
                {card.connected ? (
                  <>
                    <button onClick={card.onDisconnect}
                      className="flex-shrink-0 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm">
                      Desconectar
                    </button>
                    {card.onDiagnostic && (
                      <button onClick={card.onDiagnostic}
                        className="flex-shrink-0 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
                        🔍 Diagnosticar
                      </button>
                    )}
                    {card.onResubscribe && (
                      <button onClick={card.onResubscribe}
                        className="flex-shrink-0 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm">
                        🔄 Re-suscribir
                      </button>
                    )}
                    <button onClick={card.onManual}
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 text-sm">
                      Editar
                    </button>
                  </>
                ) : (
                  <>
                    {card.onConnect && (
                      <button onClick={card.onConnect} disabled={connecting === card.key}
                        className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 disabled:opacity-60 transition-colors text-sm">
                        {connecting === card.key ? '⏳ Conectando...' : card.connectLabel}
                      </button>
                    )}
                    <button onClick={card.onManual}
                      className={`${card.onConnect ? 'flex-shrink-0' : 'flex-1'} px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 text-sm`}>
                      {card.manualLabel}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for manual config */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 capitalize">Configurar {activeModal.replace('_', ' ')}</h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {activeModal === 'whatsapp' && (<>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Número de Teléfono</label>
                <input type="text" value={formData.phone||''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" placeholder="15556433397" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone Number ID</label>
                <input type="text" value={formData.phone_number_id||''} onChange={e => setFormData({...formData, phone_number_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Access Token Permanente</label>
                <input type="password" value={formData.access_token||''} onChange={e => setFormData({...formData, access_token: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
              </>)}
              {activeModal === 'instagram' && (<>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Instagram Page ID</label>
                <input type="text" value={formData.page_id||''} onChange={e => setFormData({...formData, page_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Access Token</label>
                <input type="password" value={formData.access_token||''} onChange={e => setFormData({...formData, access_token: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
              </>)}
              {activeModal === 'telegram' && (
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Bot Token (BotFather)</label>
                <input type="password" value={formData.bot_token||''} onChange={e => setFormData({...formData, bot_token: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
              )}
              {activeModal === 'google' && (<>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Google Sheet ID</label>
                <input type="text" value={formData.sheet_id||''} onChange={e => setFormData({...formData, sheet_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Service Account JSON</label>
                <textarea rows="3" value={formData.credentials_json||''} onChange={e => setFormData({...formData, credentials_json: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none font-mono text-xs" /></div>
              </>)}
              {activeModal === 'meta_ads' && (<>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Ad Account ID</label>
                <input type="text" value={formData.ad_account_id||''} onChange={e => setFormData({...formData, ad_account_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" placeholder="act_123456" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Access Token (ads_read)</label>
                <input type="password" value={formData.access_token||''} onChange={e => setFormData({...formData, access_token: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
              </>)}
              {activeModal === 'tiktok' && (<>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Open ID</label>
                <input type="text" value={formData.open_id||''} onChange={e => setFormData({...formData, open_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Access Token</label>
                <input type="password" value={formData.access_token||''} onChange={e => setFormData({...formData, access_token: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
              </>)}
              {activeModal === 'tiktok_ads' && (<>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Advertiser ID</label>
                <input type="text" value={formData.advertiser_id||''} onChange={e => setFormData({...formData, advertiser_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Access Token</label>
                <input type="password" value={formData.access_token||''} onChange={e => setFormData({...formData, access_token: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
              </>)}
              {activeModal === 'facebook' && (<>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Page ID</label>
                <input type="text" value={formData.page_id||''} onChange={e => setFormData({...formData, page_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Page Access Token</label>
                <input type="password" value={formData.access_token||''} onChange={e => setFormData({...formData, access_token: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none" /></div>
              </>)}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Facebook Page Selector Modal */}
      {showPageSelector && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Selecciona tu Página de Facebook</h2>
              <button onClick={() => { setShowPageSelector(false); setConnecting(null) }} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {facebookPages.map(page => (
                <button
                  key={page.id}
                  onClick={() => selectFacebookPage(page)}
                  className="w-full p-4 border border-slate-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all text-left"
                >
                  <div className="font-semibold text-slate-900">{page.name}</div>
                  <div className="text-xs text-slate-500 mt-1">ID: {page.id}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

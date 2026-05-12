import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const TOOL_CATALOG = [
  { id: 'google_sheets', icon: '📊', label: 'Google Sheets', desc: 'Leer y escribir hojas de cálculo', color: 'bg-green-50 border-green-200',
    fields: [
      { key: 'file_id', label: 'Archivo', placeholder: 'Selecciona desde Drive', picker: true, mimeFilter: 'application/vnd.google-apps.spreadsheet' },
      { key: 'description', label: 'Descripción para la IA', placeholder: 'Ej: Tabla de proveedores con precios y stock', type: 'textarea' },
    ],
    accessOptions: ['Leer', 'Escribir', 'Editar', 'Borrar']
  },
  { id: 'google_docs', icon: '📝', label: 'Google Docs', desc: 'Consultar documentos de texto', color: 'bg-blue-50 border-blue-200',
    fields: [
      { key: 'file_id', label: 'Documento', placeholder: 'Selecciona desde Drive', picker: true, mimeFilter: 'application/vnd.google-apps.document' },
      { key: 'description', label: 'Descripción para la IA', placeholder: 'Ej: Estrategia de ventas con precios y ofertas', type: 'textarea' },
    ],
    accessOptions: ['Leer', 'Escribir', 'Editar']
  },
  { id: 'google_calendar', icon: '📅', label: 'Google Calendar', desc: 'Consultar y crear eventos', color: 'bg-purple-50 border-purple-200',
    fields: [
      { key: 'calendar_id', label: 'ID del calendario', placeholder: 'primary o email@gmail.com' },
      { key: 'description', label: 'Descripción para la IA', placeholder: 'Ej: Agendar citas con clientes', type: 'textarea' },
    ],
    accessOptions: ['Ver eventos', 'Crear eventos', 'Modificar eventos']
  },
  { id: 'call_agent', icon: '🤖', label: 'Llamar a otros Agentes', desc: 'Este agente puede delegar a otro agente', color: 'bg-amber-50 border-amber-200',
    fields: [
      { key: 'agent_name', label: 'Nombre del agente destino', placeholder: 'Ej: Paola, Agente Supervisor' },
      { key: 'description', label: '¿Cuándo debe llamarlo?', placeholder: 'Ej: Cuando se concrete una venta, notificar al supervisor', type: 'textarea' },
    ],
    accessOptions: ['Delegar conversación', 'Solo notificar']
  },
  { id: 'whatsapp_reply', icon: '📱', label: 'Responder WhatsApp', desc: 'Enviar mensajes por WhatsApp', color: 'bg-emerald-50 border-emerald-200', simple: true },
  { id: 'instagram_reply', icon: '📸', label: 'Responder Instagram', desc: 'Enviar mensajes por Instagram DM', color: 'bg-pink-50 border-pink-200', simple: true },
  { id: 'telegram_notify', icon: '✈️', label: 'Notificar por Telegram', desc: 'Enviar alertas por Telegram', color: 'bg-sky-50 border-sky-200', simple: true },
  { id: 'send_email', icon: '📧', label: 'Enviar Emails', desc: 'Enviar correos electrónicos', color: 'bg-orange-50 border-orange-200', simple: true },
]

export default function AgentConfig() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [agents, setAgents] = useState([])
  const [toolModal, setToolModal] = useState(null)
  const [resourceForm, setResourceForm] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pickerReady, setPickerReady] = useState(false)
  const [pickerToken, setPickerToken] = useState(null)
  const [pickerClientId, setPickerClientId] = useState(null)
  const [aiModels, setAiModels] = useState([])

  const [formData, setFormData] = useState({
    name: '', business_info: [],
    system_prompt: '', permissions: [], tools: [], is_active: true, model_id: ''
  })
  const [templates, setTemplates] = useState([])
  const [agentTemplates, setAgentTemplates] = useState([])

  useEffect(() => { loadAgent() }, [])

  const loadTemplates = async () => {
    try {
      const res = await api.get('/templates')
      setTemplates((res.data.templates || []).filter(t => t.status === 'APPROVED'))
    } catch (err) { console.error('Error loading templates:', err) }
  }

  const loadAgentTemplates = async () => {
    try {
      const res = await api.get(`/agents/${id}/templates`)
      if (res.data.success) setAgentTemplates(res.data.assignments || [])
    } catch (err) { console.error('Error loading agent templates:', err) }
  }

  useEffect(() => { loadTemplates(); loadAgentTemplates() }, [id])

  const parseJSON = (data, def) => {
    if (!data) return def
    if (typeof data === 'object') return data
    try { return JSON.parse(data) } catch { return def }
  }

  const toggleTemplateAssignment = async (templateId) => {
    const existing = agentTemplates.find(at => at.template_id === templateId)
    if (existing) {
      try {
        await api.delete(`/agents/${id}/templates/${templateId}`)
        setAgentTemplates(prev => prev.filter(at => at.template_id !== templateId))
      } catch (err) { console.error('Error removing template:', err) }
    } else {
      try {
        await api.post(`/agents/${id}/templates`, {
          template_id: templateId,
          usage_context: '',
          enabled: true
        })
        setAgentTemplates(prev => [...prev, { template_id: templateId, usage_context: '', enabled: true, agent_id: parseInt(id) }])
      } catch (err) { console.error('Error assigning template:', err) }
    }
  }

  const updateTemplateUsageContext = async (templateId, usageContext) => {
    try {
      await api.post(`/agents/${id}/templates`, {
        template_id: templateId,
        usage_context: usageContext,
        enabled: true
      })
      setAgentTemplates(prev => prev.map(at => at.template_id === templateId ? { ...at, usage_context: usageContext } : at))
    } catch (err) { console.error('Error updating usage context:', err) }
  }

  const loadAgent = async () => {
    try {
      const [agentRes, agentsRes, modelsRes] = await Promise.all([
        api.get(`/agents/${id}`),
        api.get('/agents'),
        api.get('/users/models')
      ])
      const a = agentRes.data
      setAgents(agentsRes.data.filter(ag => ag.id !== parseInt(id)))
      setAiModels(modelsRes.data || [])
      
      let bizInfo = []
      const rawBiz = parseJSON(a.business_info, {})
      if (Array.isArray(rawBiz)) {
        bizInfo = rawBiz
      } else if (typeof rawBiz === 'object' && Object.keys(rawBiz).length > 0) {
        bizInfo = Object.entries(rawBiz).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: v }))
      } else {
        bizInfo = [
          { label: 'Empresa', value: '' },
          { label: 'Horario', value: '' },
          { label: 'Dirección', value: '' },
          { label: 'Teléfono', value: '' }
        ]
      }

      setFormData({
        name: a.name || '', business_info: bizInfo,
        system_prompt: a.system_prompt || '', permissions: parseJSON(a.permissions, []),
        tools: parseJSON(a.ai_config, { tools: [] }).tools || [],
        is_active: a.is_active,
        model_id: a.model_id || ''
      })
    } catch (err) { if (err.response?.status === 404) navigate('/dashboard') }
  }

  // Load Google Picker API script
  useEffect(() => {
    if (!document.getElementById('google-picker-script')) {
      const s = document.createElement('script')
      s.id = 'google-picker-script'
      s.src = 'https://apis.google.com/js/api.js'
      s.onload = () => { window.gapi.load('picker', () => setPickerReady(true)) }
      document.head.appendChild(s)
    } else if (window.gapi?.picker) {
      setPickerReady(true)
    }
    // Pre-load picker token
    api.get('/agents/google-picker-token').then(res => {
      if (res.data.success) {
        setPickerToken(res.data.access_token)
        setPickerClientId(res.data.client_id)
      }
    }).catch(() => {})
  }, [])

  const openPicker = (mimeFilter) => {
    if (!pickerReady || !pickerToken) {
      alert('Google Drive no disponible. Asegúrate de tener Google conectado en Integraciones.')
      return
    }
    const view = new window.google.picker.DocsView()
    if (mimeFilter) view.setMimeTypes(mimeFilter)
    view.setIncludeFolders(true)
    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(pickerToken)
      .setCallback((data) => {
        if (data.action === 'picked' && data.docs?.[0]) {
          const doc = data.docs[0]
          setResourceForm(p => ({ ...p, file_id: doc.id, file_name: doc.name }))
        }
      })
      .setTitle('Seleccionar archivo de Google Drive')
      .build()
    picker.setVisible(true)
  }

  const deleteAgent = async () => {
    try {
      await api.delete(`/agents/${id}`)
      navigate('/dashboard')
    } catch (err) {
      alert('Error eliminando agente')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setSaved(false)
    try {
      await api.put(`/agents/${id}`, {
        ...formData,
        ai_config: { tools: formData.tools }
      })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleChange = (section, field, value) => {
    if (section) setFormData(p => ({ ...p, [section]: { ...p[section], [field]: value } }))
    else setFormData(p => ({ ...p, [field]: value }))
  }

  // Tools management
  const openAddResource = (toolId) => {
    const catalog = TOOL_CATALOG.find(t => t.id === toolId)
    if (catalog?.simple) {
      // Simple toggle — add/remove from permissions
      const has = formData.permissions.includes(toolId)
      handleChange(null, 'permissions', has ? formData.permissions.filter(p => p !== toolId) : [...formData.permissions, toolId])
      return
    }
    setResourceForm({ access: [] })
    setToolModal({ toolId, editIndex: null })
  }

  const openEditResource = (toolId, index) => {
    const existing = formData.tools.filter(t => t.tool_id === toolId)[index]
    setResourceForm({ ...existing })
    setToolModal({ toolId, editIndex: index })
  }

  const saveResource = () => {
    if (!toolModal) return
    const { toolId, editIndex } = toolModal
    const newResource = { tool_id: toolId, ...resourceForm }
    let updated = [...formData.tools]

    if (editIndex !== null) {
      // Find the actual array index
      let count = -1
      const realIndex = updated.findIndex((t, i) => {
        if (t.tool_id === toolId) count++
        return count === editIndex
      })
      if (realIndex >= 0) updated[realIndex] = newResource
    } else {
      updated.push(newResource)
    }
    setFormData(p => ({ ...p, tools: updated }))
    setToolModal(null)
  }

  const removeResource = (toolId, index) => {
    let count = -1
    const updated = formData.tools.filter((t, i) => {
      if (t.tool_id === toolId) count++
      return !(t.tool_id === toolId && count === index)
    })
    setFormData(p => ({ ...p, tools: updated }))
  }

  const getToolResources = (toolId) => formData.tools.filter(t => t.tool_id === toolId)
  const catalogItem = (toolId) => TOOL_CATALOG.find(t => t.id === toolId)

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">← Volver</button>
          <h1 className="text-xl font-bold text-slate-800">Configurar Agente</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {saved && <div className="bg-green-500/20 border border-green-500/30 text-green-700 px-4 py-3 rounded-lg mb-6">✅ Configuración guardada exitosamente</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Negocio */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">🏢 Información del Negocio</h2>
            <div className="mb-4">
              <label className="block text-slate-600 text-sm font-medium mb-2">Nombre del Agente</label>
              <input type="text" value={formData.name} onChange={e => handleChange(null, 'name', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 font-bold" placeholder="Ej: Asistente de Ventas" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.business_info.map((f, i) => (
                <div key={i} className="flex flex-col relative group">
                  <div className="flex items-center justify-between mb-2">
                    <input type="text" value={f.label} onChange={e => {
                      const newB = [...formData.business_info];
                      newB[i].label = e.target.value;
                      setFormData(p => ({ ...p, business_info: newB }));
                    }} className="text-slate-600 text-sm font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none px-1 py-0.5 w-2/3" placeholder="Nombre del campo" />
                    <button type="button" onClick={() => {
                      const newB = formData.business_info.filter((_, idx) => idx !== i);
                      setFormData(p => ({ ...p, business_info: newB }));
                    }} className="text-red-400 hover:text-red-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">✕ Eliminar</button>
                  </div>
                  <input type="text" value={f.value} onChange={e => {
                    const newB = [...formData.business_info];
                    newB[i].value = e.target.value;
                    setFormData(p => ({ ...p, business_info: newB }));
                  }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500" placeholder={`Valor para ${f.label || 'este campo'}`} />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => {
              setFormData(p => ({ ...p, business_info: [...p.business_info, { label: 'Nuevo Campo', value: '' }] }))
            }} className="mt-4 text-sm text-brand-600 font-bold hover:text-brand-800 flex items-center gap-1">+ Agregar campo</button>
          </section>

          {/* Prompt */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-2">🧠 Prompt del Agente</h2>
            <p className="text-slate-500 text-sm mb-4">Define cómo se comporta. Las herramientas configuradas abajo se inyectan automáticamente.</p>
            <textarea value={formData.system_prompt} onChange={e => setFormData(p => ({ ...p, system_prompt: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 h-40 font-mono text-sm"
              placeholder="Eres el asistente virtual de [Negocio]..." />
          </section>

          {/* HERRAMIENTAS */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">🛠️ Herramientas del Agente</h2>
            <p className="text-slate-500 text-sm mb-6">Configura qué recursos puede usar este agente y qué puede hacer con cada uno.</p>

            <div className="space-y-4">
              {TOOL_CATALOG.map(tool => {
                const resources = getToolResources(tool.id)
                const isSimple = tool.simple
                const isEnabled = isSimple ? formData.permissions.includes(tool.id) : resources.length > 0

                return (
                  <div key={tool.id} className={`rounded-xl border-2 overflow-hidden transition-all ${isEnabled ? tool.color : 'bg-white border-slate-200'}`}>
                    {/* Tool Header */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tool.icon}</span>
                        <div>
                          <h3 className="font-bold text-slate-800">{tool.label}</h3>
                          <p className="text-xs text-slate-500">{tool.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isEnabled && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                          {isSimple ? 'Activo' : `${resources.length} recurso${resources.length > 1 ? 's' : ''}`}
                        </span>}
                        {isSimple ? (
                          <button type="button" onClick={() => openAddResource(tool.id)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${isEnabled ? 'bg-brand-600' : 'bg-gray-300'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-5' : ''}`} />
                          </button>
                        ) : (
                          <button type="button" onClick={() => openAddResource(tool.id)}
                            className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700">
                            + Agregar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Resource List (for non-simple tools) */}
                    {!isSimple && resources.length > 0 && (
                      <div className="border-t border-slate-200/60 divide-y divide-slate-100">
                        {resources.map((res, idx) => (
                          <div key={idx} className="flex items-center justify-between px-4 py-3 bg-white/60">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-slate-800 truncate">{res.file_name || res.file_id || res.agent_name || res.calendar_id || 'Sin nombre'}</span>
                              </div>
                              {res.description && <p className="text-xs text-slate-500 truncate">{res.description}</p>}
                              {res.access?.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {res.access.map(a => <span key={a} className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">{a}</span>)}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-3 shrink-0">
                              <button type="button" onClick={() => openEditResource(tool.id, idx)} className="text-xs text-brand-600 hover:text-brand-800 font-bold">Editar</button>
                              <button type="button" onClick={() => removeResource(tool.id, idx)} className="text-xs text-red-500 hover:text-red-700 font-bold">Quitar</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Plantillas WhatsApp */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">📋 Plantillas WhatsApp</h2>
            <p className="text-slate-500 text-sm mb-4">Asigna plantillas aprobadas a este agente. Solo las plantillas asignadas estarán disponibles para envíos proactivos.</p>
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm mb-2">No hay plantillas aprobadas</p>
                <a href="/templates" className="text-brand-600 text-sm font-medium hover:text-brand-700">Crear plantilla →</a>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map(t => {
                  const assigned = agentTemplates.find(at => at.template_id === t.id)
                  return (
                    <div key={t.id} className={`rounded-lg border-2 p-4 transition-all ${assigned ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="checkbox"
                              checked={!!assigned}
                              onChange={() => toggleTemplateAssignment(t.id)}
                              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="font-semibold text-slate-800 text-sm">{t.display_name || t.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{t.category}</span>
                            <span className="text-[10px] text-slate-400">{t.language}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate ml-7">{t.body_text}</p>
                        </div>
                      </div>
                      {assigned && (
                        <div className="mt-3 ml-7">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Contexto de uso (describe al agente cuándo usar esta plantilla)</label>
                          <textarea
                            rows="2"
                            value={assigned.usage_context || ''}
                            onChange={e => updateTemplateUsageContext(t.id, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-500"
                            placeholder="Ej: Usar cuando un cliente pide reprogramar su cita..."
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Modelo IA */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-2">🧠 Modelo de IA</h2>
            <p className="text-slate-500 text-sm mb-4">Selecciona qué motor de inteligencia artificial usará este agente para pensar.</p>
            <select value={formData.model_id} onChange={e => setFormData(p => ({ ...p, model_id: e.target.value }))}
              className="w-full max-w-md px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 font-medium text-slate-800">
              <option value="">-- Modelo por defecto --</option>
              {aiModels.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.api_provider})</option>
              ))}
            </select>
          </section>

          {/* Estado */}
          <section className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">⚡ Estado del Agente</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.is_active} onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} className="w-5 h-5 rounded border-slate-300 text-brand-600" />
              <span className="text-slate-700 font-medium">Agente activo</span>
            </label>
          </section>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading} className="px-8 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <section className="bg-white rounded-xl p-6 border-2 border-red-200 mt-8">
          <h2 className="text-lg font-bold text-red-700 mb-2">⚠️ Zona de Peligro</h2>
          <p className="text-slate-500 text-sm mb-4">Esta acción es irreversible. Se eliminarán todos los datos del agente.</p>
          {!showDeleteConfirm ? (
            <button type="button" onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Eliminar Agente</button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-red-600 font-bold text-sm">¿Estás seguro?</span>
              <button type="button" onClick={deleteAgent} className="px-4 py-2 bg-red-700 text-white rounded-lg font-bold hover:bg-red-800">Sí, eliminar</button>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium">Cancelar</button>
            </div>
          )}
        </section>
      </div>

      {/* Resource Modal */}
      {toolModal && (() => {
        const catalog = catalogItem(toolModal.toolId)
        if (!catalog || catalog.simple) return null
        return (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{catalog.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{toolModal.editIndex !== null ? 'Editar' : 'Agregar'} recurso de {catalog.label}</h2>
                    <p className="text-xs text-slate-500">Configura qué puede hacer la IA con este recurso.</p>
                  </div>
                </div>
                <button onClick={() => setToolModal(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
              </div>
              <div className="p-6 space-y-4">
                {catalog.fields.map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                    {f.picker ? (
                      <div className="flex gap-2">
                        <div className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 truncate">
                          {resourceForm.file_name || resourceForm[f.key] || <span className="text-slate-400">Ningún archivo seleccionado</span>}
                        </div>
                        <button type="button" onClick={() => openPicker(f.mimeFilter)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm whitespace-nowrap">
                          📂 Seleccionar de Drive
                        </button>
                      </div>
                    ) : f.type === 'textarea' ? (
                      <textarea rows="2" value={resourceForm[f.key] || ''} onChange={e => setResourceForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none text-sm" placeholder={f.placeholder} />
                    ) : (
                      <input type="text" value={resourceForm[f.key] || ''} onChange={e => setResourceForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:outline-none text-sm" placeholder={f.placeholder} />
                    )}
                  </div>
                ))}

                {/* Access Checkboxes */}
                {catalog.accessOptions && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Permisos de acceso</label>
                    <div className="flex flex-wrap gap-2">
                      {catalog.accessOptions.map(opt => {
                        const selected = (resourceForm.access || []).includes(opt)
                        return (
                          <button key={opt} type="button"
                            onClick={() => setResourceForm(p => ({ ...p, access: selected ? (p.access || []).filter(a => a !== opt) : [...(p.access || []), opt] }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${selected ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
                            {selected ? '✓ ' : ''}{opt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Agent selector for call_agent */}
                {toolModal.toolId === 'call_agent' && agents.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Seleccionar agente existente</label>
                    <div className="flex flex-wrap gap-2">
                      {agents.map(ag => (
                        <button key={ag.id} type="button"
                          onClick={() => setResourceForm(p => ({ ...p, agent_name: ag.name, agent_id: ag.id }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${resourceForm.agent_id === ag.id ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'}`}>
                          🤖 {ag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setToolModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="button" onClick={saveResource} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">
                  {toolModal.editIndex !== null ? 'Actualizar' : 'Agregar Recurso'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function TemplateEditor() {
  const { user } = useAuth()
  const [industryTemplates, setIndustryTemplates] = useState({})
  const [userIndustry, setUserIndustry] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [customVars, setCustomVars] = useState({})
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [activeLeadId, setActiveLeadId] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Get URL params for CRM integration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const leadId = params.get('lead_id')
    if (leadId) setActiveLeadId(leadId)
  }, [])

  // Load user's industry and templates
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get user's agent to determine industry
      const agentsRes = await api.get('/agents')
      const agent = agentsRes.data.agents?.[0]
      if (agent) {
        setUserIndustry(agent.business_info?.industry || null)
      }
      
      // Load industry templates
      const templatesRes = await api.get('/templates/industry')
      setIndustryTemplates(templatesRes.data.templates || {})
    } catch (err) {
      console.error('Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template)
    // Initialize custom variables
    const vars = {}
    for (let i = 1; i <= template.variables_count; i++) {
      vars[i] = ''
    }
    setCustomVars(vars)
    updatePreview(template, vars)
  }

  const updatePreview = (template, vars) => {
    let text = template.body_text
    Object.entries(vars).forEach(([key, value]) => {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`)
    })
    setPreview(text)
  }

  const handleVarChange = (key, value) => {
    const newVars = { ...customVars, [key]: value }
    setCustomVars(newVars)
    updatePreview(selectedTemplate, newVars)
  }

  const handleSend = async () => {
    if (!selectedTemplate || !activeLeadId) return
    
    setSending(true)
    try {
      // Build components with filled variables
      const components = []
      if (selectedTemplate.variables_count > 0) {
        const bodyVars = Object.entries(customVars)
          .sort(([a], [b]) => a - b)
          .map(([_, value]) => ({ type: 'text', text: value }))
        
        if (bodyVars.length > 0) {
          components.push({ type: 'body', parameters: bodyVars })
        }
      }

      // Add buttons if template has them
      if (selectedTemplate.buttons && selectedTemplate.buttons.length > 0) {
        components.push({
          type: 'button',
          sub_type: 'quick_reply',
          index: '0',
          parameters: []
        })
      }

      await api.post(`/templates/send`, {
        template_id: selectedTemplate.id,
        lead_id: activeLeadId,
        components
      })

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      alert('Error enviando plantilla: ' + (err.response?.data?.error || err.message))
    } finally {
      setSending(false)
    }
  }

  const handleUseTemplate = () => {
    // Redirect to CRM with template pre-selected
    window.location.href = `/crm?template_id=${selectedTemplate.id}&lead_id=${activeLeadId}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando plantillas...</div>
      </div>
    )
  }

  const templates = userIndustry 
    ? (industryTemplates[userIndustry] || [])
    : Object.values(industryTemplates).flat()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link to="/dashboard" className="text-brand-600 hover:text-brand-700 text-sm">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-gray-800 mt-1">Editor de Plantillas</h1>
            <p className="text-gray-500 text-sm mt-1">Elige, personaliza y envía plantillas pre-escritas para tu industria</p>
          </div>
          <Link 
            to="/templates" 
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            🔄 Ver plantillas de Meta
          </Link>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
            ✅ Plantilla enviada correctamente
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Template List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-800">
                  {userIndustry ? 'Plantillas para tu industria' : 'Todas las plantillas'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {templates.length} plantillas disponibles
                </p>
              </div>

              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {templates.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-3xl mb-2">📋</div>
                    <p>No hay plantillas disponibles para tu industria aún.</p>
                    <Link to="/templates" className="text-brand-600 text-sm mt-2 inline-block">
                      Crear plantilla personalizada →
                    </Link>
                  </div>
                ) : (
                  templates.map(template => (
                    <div 
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedTemplate?.id === template.id ? 'bg-brand-50 border-l-4 border-l-brand-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800">{template.display_name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              template.category === 'UTILITY' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                            }`}>
                              {template.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{template.body_text}</p>
                          <p className="text-[10px] text-gray-400 mt-1">💡 {template.suggested_use}</p>
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <span className="text-brand-600 text-lg">✓</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Editor & Preview */}
          <div className="lg:col-span-1">
            {selectedTemplate ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-4">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-bold text-gray-800">Personalizar</h2>
                </div>

                <div className="p-4 space-y-4">
                  {/* Variable Inputs */}
                  {selectedTemplate.variables_count > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variables del mensaje
                      </label>
                      <div className="space-y-2">
                        {Object.entries(customVars).map(([key, value]) => (
                          <div key={key}>
                            <label className="text-xs text-gray-500 mb-1 block">
                              Variable {{key}}
                            </label>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleVarChange(key, e.target.value)}
                              placeholder={`Valor para {{${key}}}`}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vista previa
                    </label>
                    <div className="bg-[#d9fdd3] rounded-lg p-3 text-sm whitespace-pre-wrap">
                      {preview || selectedTemplate.body_text}
                    </div>
                  </div>

                  {/* Quick Buttons Preview */}
                  {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Botones rápidos:</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.buttons.map((btn, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {btn.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    {activeLeadId ? (
                      <button
                        onClick={handleSend}
                        disabled={sending}
                        className="w-full bg-brand-600 text-white py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                      >
                        {sending ? 'Enviando...' : '📤 Enviar plantilla'}
                      </button>
                    ) : (
                      <button
                        onClick={handleUseTemplate}
                        className="w-full bg-brand-600 text-white py-2 rounded-lg font-medium hover:bg-brand-700"
                      >
                        💬 Usar en CRM
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-4xl mb-3">👈</div>
                <h3 className="font-semibold text-gray-700 mb-2">Selecciona una plantilla</h3>
                <p className="text-sm text-gray-500">
                  Elige una plantilla de la lista para personalizarla y enviarla
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

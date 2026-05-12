import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const CATEGORIES = [
  { value: 'UTILITY', label: 'Utility', desc: 'Account updates, alerts, reminders' },
  { value: 'MARKETING', label: 'Marketing', desc: 'Promotions, offers, announcements' },
  { value: 'AUTHENTICATION', label: 'Authentication', desc: 'OTP codes, login verification' }
]

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' }
]

export default function Templates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    display_name: '',
    category: 'UTILITY',
    language: 'es',
    body_text: '',
    components: []
  })

  useEffect(() => { loadTemplates() }, [])

  const loadTemplates = async () => {
    try {
      const res = await api.get('/templates')
      setTemplates(res.data.templates || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAll = async () => {
    setSyncing(true)
    try {
      const res = await api.post('/templates/sync-all')
      alert(`Sincronizadas ${res.data.synced} plantillas`)
      loadTemplates()
    } catch (err) {
      alert('Error sincronizando: ' + (err.response?.data?.error || err.message))
    } finally {
      setSyncing(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const components = [{ type: 'BODY', text: form.body_text }]
      const varsCount = (form.body_text.match(/\{\{(\d+)\}\}/g) || []).length

      await api.post('/templates', {
        ...form,
        variables_count: varsCount,
        components
      })
      setShowWizard(false)
      setWizardStep(1)
      setForm({ name: '', display_name: '', category: 'UTILITY', language: 'es', body_text: '', components: [] })
      loadTemplates()
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitToMeta = async (id) => {
    try {
      const res = await api.post(`/templates/${id}/submit`)
      alert(`Plantilla enviada a Meta. Estado: ${res.data.status}`)
      loadTemplates()
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleSync = async (id) => {
    try {
      const res = await api.post(`/templates/${id}/sync`)
      alert(`Estado: ${res.data.status}${res.data.rejection_reason ? ' - Razón: ' + res.data.rejection_reason : ''}`)
      loadTemplates()
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta plantilla?')) return
    try {
      await api.delete(`/templates/${id}`)
      loadTemplates()
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    }
  }

  const statusBadge = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-600',
      PENDING: 'bg-yellow-100 text-yellow-700',
      SUBMITTED: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-600',
      DISABLED: 'bg-gray-200 text-gray-500'
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link to="/dashboard" className="text-brand-600 hover:text-brand-700 text-sm">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-gray-800 mt-1">Plantillas WhatsApp</h1>
            <p className="text-gray-500 text-sm mt-1">Gestiona tus plantillas de mensajes para envíos proactivos</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSyncAll} disabled={syncing} className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              {syncing ? 'Sincronizando...' : '🔄 Sincronizar con Meta'}
            </button>
            <button onClick={() => { setShowWizard(true); setWizardStep(1) }} className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700">
              + Nueva Plantilla
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay plantillas</h3>
            <p className="text-gray-500 text-sm mb-4">Crea tu primera plantilla de WhatsApp para enviar mensajes proactivos</p>
            <button onClick={() => { setShowWizard(true); setWizardStep(1) }} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Crear Plantilla</button>
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-800">{t.display_name || t.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusBadge(t.status)}`}>{t.status}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{t.category}</span>
                    <span className="text-[10px] text-gray-400">{t.language}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate max-w-xl">{t.body_text}</p>
                  {t.rejection_reason && <p className="text-xs text-red-500 mt-1">Razón rechazo: {t.rejection_reason}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  {t.status === 'DRAFT' && (
                    <button onClick={() => handleSubmitToMeta(t.id)} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">Enviar a Meta</button>
                  )}
                  {(t.status === 'PENDING' || t.status === 'SUBMITTED') && (
                    <button onClick={() => handleSync(t.id)} className="px-3 py-1.5 text-xs font-medium bg-yellow-500 text-white rounded hover:bg-yellow-600">Verificar estado</button>
                  )}
                  <button onClick={() => handleDelete(t.id)} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded hover:bg-red-100">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Template Wizard */}
        {showWizard && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowWizard(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Nueva Plantilla - Paso {wizardStep}/3</h2>
                  <button onClick={() => setShowWizard(false)} className="text-gray-400 hover:text-gray-600">✖</button>
                </div>
                <div className="flex gap-1 mt-3">
                  {[1, 2, 3].map(s => (
                    <div key={s} className={`h-1 flex-1 rounded ${s <= wizardStep ? 'bg-brand-600' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>

              <div className="p-6">
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la plantilla</label>
                      <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} placeholder="ej: cancelacion_cita" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500" />
                      <p className="text-xs text-gray-400 mt-1">Solo letras minúsculas, números y guiones bajos</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre visible</label>
                      <input type="text" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} placeholder="Cancelación de Cita" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label} — {c.desc}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                      <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <button onClick={() => setWizardStep(2)} disabled={!form.name} className="w-full bg-brand-600 text-white py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">Siguiente</button>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Texto del mensaje</label>
                      <textarea value={form.body_text} onChange={e => setForm({ ...form, body_text: e.target.value })} rows={5} placeholder="Hola {{1}}, tu cita del día {{2}} ha sido confirmada." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500" />
                      <p className="text-xs text-gray-400 mt-1">Usa {'{{1}}'}, {'{{2}}'}, etc. para variables dinámicas</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setWizardStep(1)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200">Atrás</button>
                      <button onClick={() => setWizardStep(3)} disabled={!form.body_text} className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">Siguiente</button>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Vista previa</h3>
                    <div className="bg-[#d9fdd3] rounded-lg p-4 text-sm">
                      <div className="text-[10px] text-gray-500 mb-1">📋 {form.category} · {form.language}</div>
                      <div className="whitespace-pre-wrap">{form.body_text}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                      <div><strong>Nombre:</strong> {form.name}</div>
                      <div><strong>Visible:</strong> {form.display_name}</div>
                      <div><strong>Categoría:</strong> {form.category}</div>
                      <div><strong>Idioma:</strong> {form.language}</div>
                      <div><strong>Variables:</strong> {(form.body_text.match(/\{\{\d+\}\}/g) || []).length}</div>
                    </div>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <div className="flex gap-3">
                      <button onClick={() => setWizardStep(2)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200">Atrás</button>
                      <button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">
                        {submitting ? 'Creando...' : 'Crear Plantilla'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Automations() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [funnel, setFunnel] = useState(null)
  const [stages, setStages] = useState([])
  const [tags, setTags] = useState([])

  const [newTag, setNewTag] = useState({ name: '', color: 'bg-slate-100 text-slate-800' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [funnelRes, tagsRes] = await Promise.all([
        api.get('/funnels'),
        api.get('/funnels/tags')
      ])
      setFunnel(funnelRes.data.funnel)
      setStages(funnelRes.data.stages)
      setTags(tagsRes.data.tags)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStage = async (stageId, field, value) => {
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return

    const updatedStage = { ...stage, [field]: value }
    setStages(stages.map(s => s.id === stageId ? updatedStage : s))

    try {
      await api.put(`/funnels/stages/${stageId}`, updatedStage)
    } catch (err) {
      console.error('Error actualizando etapa', err)
      alert('Error guardando los cambios de la etapa')
      loadData()
    }
  }

  const handleCreateTag = async (e) => {
    e.preventDefault()
    if (!newTag.name) return
    
    try {
      const res = await api.post('/funnels/tags', newTag)
      setTags([...tags, res.data.tag])
      setNewTag({ name: '', color: 'bg-slate-100 text-slate-800' })
    } catch (err) {
      console.error(err)
      alert('Error creando etiqueta')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando automatizaciones...</div>
  }

  const colorOptions = [
    { value: 'bg-slate-100 text-slate-800', label: 'Gris' },
    { value: 'bg-blue-100 text-blue-800', label: 'Azul' },
    { value: 'bg-green-100 text-green-800', label: 'Verde' },
    { value: 'bg-yellow-100 text-yellow-800', label: 'Amarillo' },
    { value: 'bg-red-100 text-red-800', label: 'Rojo' },
    { value: 'bg-purple-100 text-purple-800', label: 'Morado' },
    { value: 'bg-pink-100 text-pink-800', label: 'Rosa' }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">
            ← Volver al Dashboard
          </button>
          <h1 className="text-xl font-bold text-slate-800">Embudos y Automatizaciones</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Stages Config */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Etapas del Embudo ({funnel?.name})</h2>
            <p className="text-slate-500 mt-1">Configura en qué etapas interviene la Inteligencia Artificial automáticamente.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {stages.map((stage) => (
              <div key={stage.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${stage.color}`}>
                    {stage.name}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700">IA Activa en esta etapa:</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={stage.ai_enabled}
                        onChange={(e) => handleUpdateStage(stage.id, 'ai_enabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>
                  
                  <div className="text-sm text-slate-500 max-w-xs">
                    {stage.ai_enabled 
                      ? '🤖 El agente contestará automáticamente a los leads que estén en esta etapa.' 
                      : '👤 Intervención Manual: La IA ignorará a los leads en esta etapa.'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tags Config */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Gestor de Etiquetas</h2>
            <p className="text-slate-500 mt-1">Crea etiquetas para clasificar y organizar tus leads en el CRM.</p>
          </div>
          
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <form onSubmit={handleCreateTag} className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la etiqueta</label>
                <input 
                  type="text" 
                  value={newTag.name}
                  onChange={e => setNewTag({...newTag, name: e.target.value})}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="Ej: Cliente VIP"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <select 
                  value={newTag.color}
                  onChange={e => setNewTag({...newTag, color: e.target.value})}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                >
                  {colorOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit"
                className="px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900"
              >
                + Añadir Etiqueta
              </button>
            </form>
          </div>

          <div className="p-6 flex flex-wrap gap-3">
            {tags.length === 0 ? (
              <p className="text-slate-500 italic">No hay etiquetas creadas aún.</p>
            ) : (
              tags.map(tag => (
                <div key={tag.id} className={`px-3 py-1 rounded-full text-sm font-medium border border-white/20 shadow-sm ${tag.color}`}>
                  {tag.name}
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  )
}

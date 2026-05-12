import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const STAGE_COLORS = [
  'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800',
  'bg-purple-100 text-purple-800', 'bg-pink-100 text-pink-800', 'bg-indigo-100 text-indigo-800',
  'bg-red-100 text-red-800', 'bg-teal-100 text-teal-800', 'bg-orange-100 text-orange-800',
  'bg-cyan-100 text-cyan-800'
]

export default function Funnels() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [funnels, setFunnels] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingStage, setEditingStage] = useState(null)
  const [showCreateFunnel, setShowCreateFunnel] = useState(false)
  const [showCreateStage, setShowCreateStage] = useState(false)
  const [newFunnelName, setNewFunnelName] = useState('')
  const [newStageName, setNewStageName] = useState('')
  const [newStageFunnelId, setNewStageFunnelId] = useState(null)
  const [editingFunnelId, setEditingFunnelId] = useState(null)
  const [editingFunnelName, setEditingFunnelName] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await api.get('/funnels')
      if (res.data.success) {
        setFunnels([{ id: res.data.funnel.id, name: res.data.funnel.name, stages: res.data.stages }])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const createFunnel = async () => {
    if (!newFunnelName.trim()) return
    try {
      const res = await api.post('/funnels', { name: newFunnelName.trim() })
      setFunnels([...funnels, { id: res.data.funnel.id, name: res.data.funnel.name, stages: [] }])
      setNewFunnelName('')
      setShowCreateFunnel(false)
    } catch (err) { alert('Error creando embudo') }
  }

  const deleteFunnel = async (funnelId) => {
    if (!confirm('¿Eliminar este embudo y todas sus etapas?')) return
    try {
      await api.delete(`/funnels/${funnelId}`)
      setFunnels(funnels.filter(f => f.id !== funnelId))
    } catch (err) { alert('Error eliminando embudo') }
  }

  const renameFunnel = async (funnelId) => {
    if (!editingFunnelName.trim()) return
    try {
      await api.put(`/funnels/${funnelId}`, { name: editingFunnelName.trim() })
      setFunnels(funnels.map(f => f.id === funnelId ? { ...f, name: editingFunnelName.trim() } : f))
      setEditingFunnelId(null)
    } catch (err) { alert('Error renombrando embudo') }
  }

  const createStage = async () => {
    if (!newStageName.trim() || !newStageFunnelId) return
    try {
      const funnel = funnels.find(f => f.id === newStageFunnelId)
      const orderIndex = funnel ? funnel.stages.length : 0
      const color = STAGE_COLORS[orderIndex % STAGE_COLORS.length]
      const res = await api.post('/funnels/stages', {
        funnel_id: newStageFunnelId,
        name: newStageName.trim(),
        color,
        ai_enabled: true,
        order_index: orderIndex
      })
      setFunnels(funnels.map(f => f.id === newStageFunnelId ? { ...f, stages: [...f.stages, res.data.stage] } : f))
      setNewStageName('')
      setShowCreateStage(false)
    } catch (err) { alert('Error creando etapa') }
  }

  const updateStage = async (stageId, updates) => {
    try {
      await api.put(`/funnels/stages/${stageId}`, updates)
      setFunnels(funnels.map(f => ({
        ...f,
        stages: f.stages.map(s => s.id === stageId ? { ...s, ...updates } : s)
      })))
      setEditingStage(null)
    } catch (err) { alert('Error actualizando etapa') }
  }

  const deleteStage = async (stageId) => {
    if (!confirm('¿Eliminar esta etapa?')) return
    try {
      await api.delete(`/funnels/stages/${stageId}`)
      setFunnels(funnels.map(f => ({ ...f, stages: f.stages.filter(s => s.id !== stageId) })))
    } catch (err) { alert('Error eliminando etapa') }
  }

  const moveStage = async (stageId, direction) => {
    const funnel = funnels.find(f => f.stages.some(s => s.id === stageId))
    if (!funnel) return
    const idx = funnel.stages.findIndex(s => s.id === stageId)
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= funnel.stages.length) return

    const newStages = [...funnel.stages]
    ;[newStages[idx], newStages[newIdx]] = [newStages[newIdx], newStages[idx]]
    newStages.forEach((s, i) => s.order_index = i)

    try {
      await Promise.all(newStages.map(s => api.put(`/funnels/stages/${s.id}`, { ...s })))
      setFunnels(funnels.map(f => f.id === funnel.id ? { ...f, stages: newStages } : f))
    } catch (err) { alert('Error moviendo etapa') }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando embudos...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">← Dashboard</button>
          <h1 className="text-xl font-bold text-slate-800">🔀 Embudos y Etapas</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowCreateStage(true)} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">+ Etapa</button>
            <button onClick={() => setShowCreateFunnel(true)} className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">+ Embudo</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {funnels.map(funnel => (
          <div key={funnel.id} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {editingFunnelId === funnel.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingFunnelName}
                    onChange={e => setEditingFunnelName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && renameFunnel(funnel.id)}
                    className="px-3 py-1 border border-brand-500 rounded-lg text-lg font-bold focus:outline-none"
                    autoFocus
                  />
                  <button onClick={() => renameFunnel(funnel.id)} className="text-green-600 text-sm font-bold">✓</button>
                  <button onClick={() => setEditingFunnelId(null)} className="text-red-600 text-sm font-bold">✕</button>
                </div>
              ) : (
                <h2 className="text-lg font-bold text-slate-800">{funnel.name}</h2>
              )}
              <div className="flex gap-1">
                <button onClick={() => { setEditingFunnelId(funnel.id); setEditingFunnelName(funnel.name) }} className="text-xs text-slate-500 hover:text-brand-600 px-2 py-1 rounded">Renombrar</button>
                <button onClick={() => deleteFunnel(funnel.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded">Eliminar</button>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
              {funnel.stages.map((stage, idx) => (
                <div key={stage.id} className="min-w-[260px] max-w-[260px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                  <div className={`px-4 py-3 rounded-t-xl ${stage.color}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm">{stage.name}</h3>
                      <div className="flex gap-1">
                        <button onClick={() => moveStage(stage.id, -1)} disabled={idx === 0} className="text-xs opacity-50 hover:opacity-100 disabled:opacity-20">←</button>
                        <button onClick={() => moveStage(stage.id, 1)} disabled={idx === funnel.stages.length - 1} className="text-xs opacity-50 hover:opacity-100 disabled:opacity-20">→</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stage.ai_enabled}
                          onChange={e => updateStage(stage.id, { ...stage, ai_enabled: e.target.checked })}
                          className="w-3 h-3 rounded"
                        />
                        <span className="text-[10px] font-bold">IA</span>
                      </label>
                    </div>
                  </div>
                  <div className="p-3 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Configuración</span>
                      <button onClick={() => setEditingStage(stage)} className="text-[10px] text-brand-600 hover:text-brand-800 font-bold">Editar</button>
                    </div>
                    {stage.ai_timeout_hours && (
                      <div className="text-xs text-slate-500">Timeout: {stage.ai_timeout_hours}h</div>
                    )}
                  </div>
                  <div className="px-3 pb-3">
                    <button onClick={() => deleteStage(stage.id)} className="w-full text-xs text-red-500 hover:text-red-700 font-bold py-1 rounded border border-red-200 hover:bg-red-50">Eliminar Etapa</button>
                  </div>
                </div>
              ))}

              {/* Add Stage Card */}
              <button
                onClick={() => { setNewStageFunnelId(funnel.id); setShowCreateStage(true) }}
                className="min-w-[260px] max-w-[260px] border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand-600 hover:border-brand-400 transition-colors h-48"
              >
                <span className="text-sm font-bold">+ Agregar Etapa</span>
              </button>
            </div>
          </div>
        ))}

        {funnels.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔀</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No hay embudos</h3>
            <p className="text-slate-500 text-sm mb-4">Crea tu primer embudo para organizar tus leads</p>
            <button onClick={() => setShowCreateFunnel(true)} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Crear Embudo</button>
          </div>
        )}
      </div>

      {/* Create Funnel Modal */}
      {showCreateFunnel && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateFunnel(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Nuevo Embudo</h2>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={newFunnelName}
                onChange={e => setNewFunnelName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createFunnel()}
                placeholder="Nombre del embudo"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowCreateFunnel(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Cancelar</button>
                <button onClick={createFunnel} className="flex-1 py-2 bg-brand-600 text-white rounded-lg font-medium">Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Stage Modal */}
      {showCreateStage && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateStage(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Nueva Etapa</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Embudo</label>
                <select value={newStageFunnelId || ''} onChange={e => setNewStageFunnelId(parseInt(e.target.value))} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">Seleccionar...</option>
                  {funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <input
                type="text"
                value={newStageName}
                onChange={e => setNewStageName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createStage()}
                placeholder="Nombre de la etapa"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowCreateStage(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Cancelar</button>
                <button onClick={createStage} className="flex-1 py-2 bg-brand-600 text-white rounded-lg font-medium">Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stage Modal */}
      {editingStage && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingStage(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Editar Etapa: {editingStage.name}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input type="text" value={editingStage.name} onChange={e => setEditingStage({ ...editingStage, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {STAGE_COLORS.map(c => (
                    <button key={c} onClick={() => setEditingStage({ ...editingStage, color: c })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${editingStage.color === c ? 'border-brand-500' : 'border-slate-200'} ${c}`}>
                      {c.split(' ')[0].replace('bg-', '').replace('-100', '')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Timeout IA (horas)</label>
                <input type="number" value={editingStage.ai_timeout_hours || 24} onChange={e => setEditingStage({ ...editingStage, ai_timeout_hours: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editingStage.ai_enabled} onChange={e => setEditingStage({ ...editingStage, ai_enabled: e.target.checked })} className="w-4 h-4 rounded text-brand-600" />
                <span className="text-sm font-medium text-slate-700">IA habilitada en esta etapa</span>
              </label>
              <div className="flex gap-3">
                <button onClick={() => setEditingStage(null)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Cancelar</button>
                <button onClick={() => updateStage(editingStage.id, { name: editingStage.name, color: editingStage.color, ai_enabled: editingStage.ai_enabled, ai_timeout_hours: editingStage.ai_timeout_hours })} className="flex-1 py-2 bg-brand-600 text-white rounded-lg font-medium">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
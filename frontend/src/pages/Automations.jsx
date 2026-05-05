import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export default function Automations() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [funnel, setFunnel] = useState(null)
  const [stages, setStages] = useState([])
  const [tags, setTags] = useState([])
  
  // React Flow state
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

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

  // Generate initial nodes and edges based on stages
  useEffect(() => {
    if (stages.length > 0) {
      const initialNodes = []
      const initialEdges = []
      
      stages.forEach((stage, index) => {
        // Trigger Node
        initialNodes.push({
          id: `trigger-${stage.id}`,
          type: 'input',
          position: { x: 100, y: index * 150 },
          data: { label: `⚡ Lead entra a: ${stage.name}` },
          style: { border: '2px solid #3b82f6', borderRadius: '8px', background: '#eff6ff', padding: '10px', fontWeight: 'bold' }
        })
        
        // Action Node
        initialNodes.push({
          id: `action-${stage.id}`,
          position: { x: 400, y: index * 150 },
          data: { label: stage.ai_enabled ? '🤖 IA Activa: Responder automáticamente' : '👤 Asignar a Humano (Pausar IA)' },
          style: { border: `2px solid ${stage.ai_enabled ? '#10b981' : '#f59e0b'}`, borderRadius: '8px', background: stage.ai_enabled ? '#ecfdf5' : '#fef3c7', padding: '10px' }
        })

        // Edge
        initialEdges.push({
          id: `e-${stage.id}`,
          source: `trigger-${stage.id}`,
          target: `action-${stage.id}`,
          animated: stage.ai_enabled,
          style: { stroke: stage.ai_enabled ? '#10b981' : '#94a3b8', strokeWidth: 2 }
        })
      })

      setNodes(initialNodes)
      setEdges(initialEdges)
    }
  }, [stages])

  const onNodesChange = (changes) => setNodes((nds) => applyNodeChanges(changes, nds))
  const onEdgesChange = (changes) => setEdges((eds) => applyEdgeChanges(changes, eds))
  const onConnect = (params) => setEdges((eds) => addEdge(params, eds))

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
        
        {/* Visual Automation Builder */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-200 shrink-0 flex justify-between items-center bg-white z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Flujos de Automatización ({funnel?.name})</h2>
              <p className="text-slate-500 mt-1 text-sm">Visualiza y conecta las reglas de tu CRM (Drag & Drop).</p>
            </div>
            <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700">
              Guardar Flujo
            </button>
          </div>
          <div className="flex-1 bg-slate-50 relative">
            <ReactFlow 
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
            >
              <Background color="#cbd5e1" gap={16} />
              <Controls />
            </ReactFlow>
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

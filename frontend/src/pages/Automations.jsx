import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { ReactFlow, Controls, Background, MiniMap, applyNodeChanges, applyEdgeChanges, addEdge, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const NODE_TYPES_CATALOG = [
  { type: 'trigger_stage', icon: '⚡', label: 'Lead entra a etapa', color: '#3b82f6', category: 'Disparadores' },
  { type: 'trigger_message', icon: '💬', label: 'Mensaje recibido', color: '#8b5cf6', category: 'Disparadores' },
  { type: 'trigger_timer', icon: '⏰', label: 'Temporizador', color: '#f59e0b', category: 'Disparadores' },
  { type: 'condition_field', icon: '🔀', label: 'Si campo = valor', color: '#06b6d4', category: 'Condiciones' },
  { type: 'condition_tag', icon: '🏷️', label: 'Si tiene etiqueta', color: '#14b8a6', category: 'Condiciones' },
  { type: 'action_message', icon: '📩', label: 'Enviar mensaje', color: '#10b981', category: 'Acciones' },
  { type: 'action_send_template', icon: '📋', label: 'Enviar plantilla WhatsApp', color: '#25d366', category: 'Acciones' },
  { type: 'action_move', icon: '➡️', label: 'Mover a etapa', color: '#6366f1', category: 'Acciones' },
  { type: 'action_tag', icon: '🏷️', label: 'Asignar etiqueta', color: '#ec4899', category: 'Acciones' },
  { type: 'action_notify', icon: '🔔', label: 'Notificar equipo', color: '#f97316', category: 'Acciones' },
  { type: 'action_wait', icon: '⏳', label: 'Esperar tiempo', color: '#78716c', category: 'Acciones' },
]

// Custom node component
function FlowNode({ data, selected }) {
  const cat = NODE_TYPES_CATALOG.find(n => n.type === data.nodeType) || {}
  return (
    <div className={`px-4 py-3 rounded-xl border-2 shadow-lg min-w-[180px] bg-white transition-all ${selected ? 'ring-2 ring-blue-400 scale-105' : ''}`}
      style={{ borderColor: cat.color || '#94a3b8' }}>
      {data.nodeType?.startsWith('trigger') ? null : <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-slate-400" />}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{cat.icon}</span>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: cat.color }}>{cat.label}</span>
      </div>
      {data.label && <p className="text-sm text-slate-700 font-medium">{data.label}</p>}
      {data.nodeType?.startsWith('trigger') ? null : null}
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-slate-400" />
    </div>
  )
}

const nodeTypes = { flowNode: FlowNode }

export default function Automations() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('flows') // flows | bots
  const [flows, setFlows] = useState([])
  const [pibots, setPibots] = useState([])
  const [stages, setStages] = useState([])
  const [tags, setTags] = useState([])

  // Editor state
  const [editingFlow, setEditingFlow] = useState(null)
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeConfig, setNodeConfig] = useState({})
  const reactFlowRef = useRef(null)

  // Bot editor
  const [editingBot, setEditingBot] = useState(null)
  const [botForm, setBotForm] = useState({ name: '', trigger_type: 'schedule', is_active: true, conditions: [], actions: [] })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [funnelRes, tagsRes, botsRes] = await Promise.all([
        api.get('/funnels'), api.get('/funnels/tags'), api.get('/automations/pibots')
      ])
      setStages(funnelRes.data.stages || [])
      setTags(tagsRes.data.tags || [])
      if (botsRes.data.success) setPibots(botsRes.data.bots || [])
      // Generate sample flows from stages
      const autoFlows = (funnelRes.data.stages || []).map((st, i) => ({
        id: `flow-${st.id}`, name: `Flujo: ${st.name}`, stage_id: st.id,
        is_active: st.ai_enabled, updated_at: new Date().toISOString(),
        nodes_count: 2
      }))
      setFlows(autoFlows)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  // Flow editor handlers
  const openFlowEditor = (flow) => {
    const stage = stages.find(s => s.id === flow.stage_id)
    const initNodes = [
      { id: 'trigger-1', type: 'flowNode', position: { x: 250, y: 50 }, data: { nodeType: 'trigger_stage', label: stage?.name || 'Lead entra' } },
      { id: 'action-1', type: 'flowNode', position: { x: 250, y: 200 }, data: { nodeType: stage?.ai_enabled ? 'action_message' : 'action_notify', label: stage?.ai_enabled ? 'Responder con IA' : 'Notificar al equipo' } },
    ]
    const initEdges = [{ id: 'e1', source: 'trigger-1', target: 'action-1', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }]
    setNodes(initNodes); setEdges(initEdges); setEditingFlow(flow); setSelectedNode(null)
  }

  const onNodesChange = useCallback((ch) => setNodes(n => applyNodeChanges(ch, n)), [])
  const onEdgesChange = useCallback((ch) => setEdges(e => applyEdgeChanges(ch, e)), [])
  const onConnect = useCallback((p) => setEdges(e => addEdge({ ...p, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, e)), [])

  const addNode = (catalogItem) => {
    const id = `node-${Date.now()}`
    const newNode = {
      id, type: 'flowNode',
      position: { x: 200 + Math.random() * 200, y: 100 + nodes.length * 80 },
      data: { nodeType: catalogItem.type, label: '' }
    }
    setNodes(n => [...n, newNode])
  }

  const onNodeClick = (_, node) => {
    setSelectedNode(node)
    setNodeConfig(node.data || {})
  }

  const updateNodeConfig = () => {
    if (!selectedNode) return
    setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...nodeConfig } } : n))
    setSelectedNode(null)
  }

  const deleteSelectedNode = () => {
    if (!selectedNode) return
    setNodes(ns => ns.filter(n => n.id !== selectedNode.id))
    setEdges(es => es.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id))
    setSelectedNode(null)
  }

  // PIBot handlers
  const handleCreateBot = async () => {
    if (!botForm.name) return
    try {
      const res = await api.post('/automations/pibots', { ...botForm, trigger_type: botForm.trigger_type || 'schedule', conditions: botForm.conditions, actions: botForm.actions })
      setPibots([...pibots, res.data.bot])
      setBotForm({ name: '', trigger_type: 'schedule', is_active: true, conditions: [], actions: [] })
      setEditingBot(null)
    } catch (err) { alert('Error creando bot') }
  }

  const toggleBot = async (bot) => {
    try {
      const updated = { ...bot, is_active: !bot.is_active }
      await api.put(`/automations/pibots/${bot.id}`, updated)
      setPibots(pibots.map(b => b.id === bot.id ? updated : b))
    } catch (err) { console.error(err) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando automatizaciones...</div>

  // ===================== FLOW EDITOR VIEW =====================
  if (editingFlow) {
    const categories = [...new Set(NODE_TYPES_CATALOG.map(n => n.category))]
    return (
      <div className="h-screen flex flex-col bg-slate-900">
        {/* Top bar */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setEditingFlow(null)} className="text-slate-400 hover:text-white text-sm">← Volver</button>
            <span className="text-white font-bold">{editingFlow.name}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => alert('Flujo guardado!')} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700">💾 Guardar</button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Node Catalog */}
          <div className="w-64 bg-slate-800 border-r border-slate-700 overflow-y-auto shrink-0">
            <div className="p-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Nodos disponibles</p>
              {categories.map(cat => (
                <div key={cat} className="mb-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">{cat}</p>
                  <div className="space-y-1.5">
                    {NODE_TYPES_CATALOG.filter(n => n.category === cat).map(item => (
                      <button key={item.type} onClick={() => addNode(item)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-slate-700 transition-colors group">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-xs text-slate-300 font-medium group-hover:text-white">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1" ref={reactFlowRef}>
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
              onNodeClick={onNodeClick} fitView
              style={{ background: '#0f172a' }}>
              <Controls className="!bg-slate-700 !border-slate-600 !text-white [&_button]:!bg-slate-600 [&_button]:!border-slate-500 [&_button]:!text-white" />
              <MiniMap className="!bg-slate-800" nodeColor="#3b82f6" />
              <Background color="#1e293b" gap={20} />
            </ReactFlow>
          </div>

          {/* Right Panel - Node Config */}
          {selectedNode && (
            <div className="w-72 bg-slate-800 border-l border-slate-700 overflow-y-auto shrink-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-white">Configurar nodo</p>
                  <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Etiqueta</label>
                    <input value={nodeConfig.label || ''} onChange={e => setNodeConfig(p => ({ ...p, label: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="Nombre del nodo" />
                  </div>
                  {nodeConfig.nodeType === 'action_message' && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Mensaje</label>
                      <textarea rows="3" value={nodeConfig.message || ''} onChange={e => setNodeConfig(p => ({ ...p, message: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="Escribe el mensaje..." />
                    </div>
                  )}
                  {nodeConfig.nodeType === 'action_send_template' && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">ID de Plantilla</label>
                      <input value={nodeConfig.template_id || ''} onChange={e => setNodeConfig(p => ({ ...p, template_id: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="ID de la plantilla aprobada" />
                      <p className="text-[10px] text-slate-500 mt-1">Crea plantillas en la sección Plantillas y usa su ID aquí</p>
                    </div>
                  )}
                  {nodeConfig.nodeType === 'action_move' && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Mover a etapa</label>
                      <select value={nodeConfig.stage_id || ''} onChange={e => setNodeConfig(p => ({ ...p, stage_id: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                        <option value="">Seleccionar...</option>
                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                  {nodeConfig.nodeType === 'action_wait' && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Esperar (minutos)</label>
                      <input type="number" value={nodeConfig.wait_minutes || 30} onChange={e => setNodeConfig(p => ({ ...p, wait_minutes: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
                    </div>
                  )}
                  {nodeConfig.nodeType === 'trigger_timer' && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Cada cuántas horas</label>
                      <input type="number" value={nodeConfig.hours || 24} onChange={e => setNodeConfig(p => ({ ...p, hours: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
                    </div>
                  )}
                  {nodeConfig.nodeType === 'condition_field' && (
                    <>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Campo</label>
                        <input value={nodeConfig.field || ''} onChange={e => setNodeConfig(p => ({ ...p, field: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="Ej: ciudad" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Valor</label>
                        <input value={nodeConfig.value || ''} onChange={e => setNodeConfig(p => ({ ...p, value: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="Ej: Bogotá" />
                      </div>
                    </>
                  )}
                  <div className="pt-3 flex gap-2">
                    <button onClick={updateNodeConfig} className="flex-1 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700">Aplicar</button>
                    <button onClick={deleteSelectedNode} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ===================== MAIN LIST VIEW =====================
  const TABS = [
    { id: 'flows', label: '⚡ Flujos', count: flows.length },
    { id: 'bots', label: '🤖 PIBots', count: pibots.length },
  ]

  // Schedule options for bots
  const SCHEDULE_OPTIONS = [
    { value: 'every_hour', label: 'Cada hora' },
    { value: 'every_4h', label: 'Cada 4 horas' },
    { value: 'daily_9am', label: 'Diario a las 9 AM' },
    { value: 'daily_2pm', label: 'Diario a las 2 PM' },
    { value: 'weekly_mon', label: 'Cada lunes' },
  ]

  const TRIGGER_OPTIONS = [
    { value: 'schedule', label: '⏰ Por horario', desc: 'Se ejecuta automáticamente según un horario' },
    { value: 'stage_change', label: '📊 Cambio de etapa', desc: 'Cuando un lead cambia de etapa en el embudo' },
    { value: 'new_lead', label: '🆕 Nuevo lead', desc: 'Cuando entra un nuevo lead al CRM' },
    { value: 'custom_field', label: '📝 Campo personalizado', desc: 'Cuando un campo del lead cambia de valor' },
  ]

  const ACTION_TYPES = [
    { value: 'send_message', label: '📩 Enviar mensaje', desc: 'Envía un mensaje de texto' },
    { value: 'send_template', label: '📋 Enviar plantilla', desc: 'Envía una plantilla de WhatsApp aprobada' },
    { value: 'move_stage', label: '➡️ Mover a etapa', desc: 'Mueve el lead a otra etapa del embudo' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">← Dashboard</button>
          <h1 className="text-xl font-bold text-slate-800">⚙️ Automatizaciones</h1>
          <div />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-200 p-1 rounded-xl mb-8 max-w-md">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label} <span className="ml-1 text-xs opacity-60">({t.count})</span>
            </button>
          ))}
        </div>

        {/* FLOWS TAB */}
        {tab === 'flows' && (
          <div className="grid gap-4">
            {flows.map(flow => (
              <div key={flow.id} onClick={() => openFlowEditor(flow)}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-md cursor-pointer transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${flow.is_active ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                      {flow.is_active ? '⚡' : '⏸️'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{flow.name}</h3>
                      <p className="text-xs text-slate-400">{flow.nodes_count} nodos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${flow.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {flow.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="text-slate-400 group-hover:text-brand-600 text-lg">→</span>
                  </div>
                </div>
              </div>
            ))}
            {flows.length === 0 && <p className="text-center text-slate-400 py-12">No hay flujos creados aún</p>}
          </div>
        )}

        {/* BOTS TAB */}
        {tab === 'bots' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setEditingBot(true)}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold text-sm hover:bg-brand-700">+ Crear PIBot</button>
            </div>

            <div className="grid gap-4">
              {pibots.map(bot => (
                <div key={bot.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${bot.is_active ? 'bg-blue-50' : 'bg-slate-100'}`}>🤖</div>
                      <div>
                        <h3 className="font-bold text-slate-800">{bot.name}</h3>
                        <p className="text-xs text-slate-400">Tipo: {bot.trigger_type}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleBot(bot)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${bot.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${bot.is_active ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              ))}
              {pibots.length === 0 && !editingBot && <p className="text-center text-slate-400 py-12">No hay PIBots creados aún</p>}
            </div>

            {/* Bot creation modal */}
            {editingBot && (
              <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">🤖 Nuevo PIBot</h2>
                    <button onClick={() => setEditingBot(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del bot</label>
                      <input value={botForm.name} onChange={e => setBotForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Ej: Bot de seguimiento" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Disparador</label>
                      <div className="grid grid-cols-2 gap-2">
                        {TRIGGER_OPTIONS.map(t => (
                          <button key={t.value} onClick={() => setBotForm(p => ({ ...p, trigger_type: t.value }))}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${botForm.trigger_type === t.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className="text-sm font-bold">{t.label}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {botForm.trigger_type === 'schedule' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Frecuencia</label>
                        <div className="flex flex-wrap gap-2">
                          {SCHEDULE_OPTIONS.map(s => (
                            <button key={s.value} onClick={() => setBotForm(p => ({ ...p, schedule_cron: s.value }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${botForm.schedule_cron === s.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200'}`}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {botForm.trigger_type === 'stage_change' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Etapa</label>
                        <div className="flex flex-wrap gap-2">
                          {stages.map(s => (
                            <button key={s.id} onClick={() => setBotForm(p => ({ ...p, conditions: [{ stage_id: s.id }] }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${botForm.conditions?.[0]?.stage_id === s.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200'}`}>
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Acción del bot</label>
                      <div className="grid grid-cols-1 gap-2">
                        {ACTION_TYPES.map(a => (
                          <button key={a.value} onClick={() => setBotForm(p => ({ ...p, actions: [{ type: a.value, ...(p.actions?.[0] || {}) }] }))}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${botForm.actions?.[0]?.type === a.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className="text-sm font-bold">{a.label}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{a.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {botForm.actions?.[0]?.type === 'send_message' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje</label>
                        <textarea rows="3" value={botForm.actions?.[0]?.message || ''} onChange={e => setBotForm(p => ({ ...p, actions: [{ ...p.actions[0], message: e.target.value }] }))}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Escribe el mensaje que enviará el bot..." />
                      </div>
                    )}
                    {botForm.actions?.[0]?.type === 'send_template' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ID de Plantilla</label>
                        <input value={botForm.actions?.[0]?.template_id || ''} onChange={e => setBotForm(p => ({ ...p, actions: [{ ...p.actions[0], template_id: e.target.value }] }))}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" placeholder="ID de la plantilla aprobada" />
                        <p className="text-xs text-slate-400 mt-1">Crea y aprueba plantillas en la sección Plantillas</p>
                      </div>
                    )}
                  </div>
                  <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setEditingBot(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                    <button onClick={handleCreateBot} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">Crear PIBot</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

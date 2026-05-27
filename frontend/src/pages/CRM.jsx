import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { useSocket } from '../services/useSocket'
import LeadList from '../components/leads/LeadList'
import ChatContainer from '../components/chat/ChatContainer'
import InteractiveTour from '../components/InteractiveTour'
import ContextualHelp from '../components/ContextualHelp'

export default function CRM() {
  const { user } = useAuth()
  const socket = useSocket()
  const [leads, setLeads] = useState([])
  const [activeLead, setActiveLead] = useState(null)
  const [messages, setMessages] = useState([])
  const [stages, setStages] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStage, setSelectedStage] = useState('all')
  const [sending, setSending] = useState(false)
  const [viewMode, setViewMode] = useState('chat')
  const [showCustomFields, setShowCustomFields] = useState(false)
  const [customFieldInput, setCustomFieldInput] = useState({ name: '', type: 'text', value: '' })
  const [dragOverStage, setDragOverStage] = useState(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateVars, setTemplateVars] = useState({})
  const [uploading, setUploading] = useState(false)
  const [simpleMode, setSimpleMode] = useState(() => {
    const saved = localStorage.getItem('pivot_crm_simple_mode')
    return saved !== null ? saved === 'true' : true
  })
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const fileInputRef = useRef(null)
  const leadIdRef = useRef(null)

  // Initial load
  useEffect(() => {
    loadInitialData()
    loadTemplates()
  }, [])

  // Socket: new message
  useEffect(() => {
    const cleanup = socket.onNewMessage((data) => {
      if (data.lead_id === activeLead?.id) {
        setMessages(prev => {
          const exists = prev.find(m => m.id === data.id)
          if (exists) return prev
          return [...prev, { ...data, created_at: data.created_at || new Date().toISOString() }]
        })
      }
      // Refresh lead list
      loadLeadsSilent()
    })
    return cleanup
  }, [activeLead?.id, socket])

  // Socket: lead updated
  useEffect(() => {
    const cleanup = socket.onLeadUpdated(() => {
      loadLeadsSilent()
    })
    return cleanup
  }, [socket])

  // Join/leave lead room
  useEffect(() => {
    if (activeLead?.id) {
      if (leadIdRef.current) socket.leaveLead(leadIdRef.current)
      socket.joinLead(activeLead.id)
      leadIdRef.current = activeLead.id
    }
    return () => {
      if (leadIdRef.current) socket.leaveLead(leadIdRef.current)
    }
  }, [activeLead?.id, socket])

  // Load leads when activeLead changes
  useEffect(() => {
    if (activeLead) {
      loadMessages(activeLead.id)
      loadAiSuggestion(activeLead.id)
    }
  }, [activeLead])

  const loadInitialData = async () => {
    try {
      const [lRes, sRes] = await Promise.all([
        api.get('/crm/leads'), api.get('/funnels/stages')
      ])
      setLeads(lRes.data.leads || [])
      setStages(sRes.data.stages || [])
      const tagsRes = await api.get('/crm/tags').catch(() => ({ data: { tags: [] } }))
      setTags(tagsRes.data.tags || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const loadLeads = async () => {
    try {
      const res = await api.get('/crm/leads')
      setLeads(res.data.leads || [])
    } catch (err) { console.error(err) }
  }

  const loadLeadsSilent = async () => {
    try {
      const res = await api.get('/crm/leads')
      setLeads(res.data.leads || [])
    } catch (err) {}
  }

  const loadTemplates = async () => {
    try {
      const res = await api.get('/templates')
      setTemplates(res.data.templates?.filter(t => t.status === 'APPROVED') || [])
    } catch (err) {}
  }

  const loadMessages = async (leadId, page = 1, prepend = false) => {
    setMsgLoading(true)
    try {
      const res = await api.get(`/crm/leads/${leadId}/messages?page=${page}&limit=50`)
      const newMessages = res.data.messages || []
      const pagination = res.data.pagination

      if (prepend) {
        setMessages(prev => [...newMessages, ...prev])
      } else {
        setMessages(newMessages)
      }
      setHasMore(pagination ? pagination.page < pagination.totalPages : false)
      setCurrentPage(page)
    } catch (err) { console.error(err) }
    finally { setMsgLoading(false) }
  }

  const loadMoreMessages = () => {
    if (!activeLead || msgLoading || !hasMore) return
    loadMessages(activeLead.id, currentPage + 1, true)
  }

  const loadAiSuggestion = async (leadId) => {
    try {
      const res = await api.get(`/crm/leads/${leadId}/suggestion`)
      setAiSuggestion(res.data.suggestion || null)
    } catch (err) { setAiSuggestion(null) }
  }

  const selectLead = async (lead) => {
    setActiveLead(lead)
    setMessages([])
    setAiSuggestion(null)
    setShowCustomFields(false)
    loadMessages(lead.id)
  }

  const handleSendMessage = async (text) => {
    if (!text.trim() || !activeLead) return
    setSending(true)
    try {
      await api.post(`/crm/leads/${activeLead.id}/messages`, {
        content: text, message_type: 'text'
      })
      loadMessages(activeLead.id)
      loadLeadsSilent()
    } catch (err) {
      alert('Error al enviar: ' + (err.response?.data?.error || err.message))
    }
    finally { setSending(false) }
  }

  const handleSendMedia = async (file) => {
    if (!activeLead) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('lead_id', activeLead.id)
      formData.append('direction', 'outbound')
      const mediaRes = await api.post(`/crm/leads/${activeLead.id}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const mediaId = mediaRes.data.media_id
      await api.post(`/crm/leads/${activeLead.id}/messages`, {
        content: `[${file.type.split('/')[0].toUpperCase()}] ${file.name}`,
        message_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'document',
        media_id: mediaId
      })
      loadMessages(activeLead.id)
      loadLeadsSilent()
    } catch (err) {
      alert('Error al subir archivo: ' + (err.response?.data?.error || err.message))
    }
    finally { setUploading(false) }
  }

  const handleDeleteMessage = (msgId) => {
    setMessages(prev => prev.filter(m => m.id !== msgId))
  }

  const handleUpdateLeadName = async (name) => {
    if (!activeLead) return
    try {
      await api.put(`/crm/leads/${activeLead.id}`, { name })
      setActiveLead(prev => ({ ...prev, name }))
      loadLeadsSilent()
    } catch (err) {
      alert('Error al actualizar: ' + (err.response?.data?.error || err.message))
    }
  }

  const changeStage = async (leadId, stageId) => {
    try {
      await api.put(`/crm/leads/${leadId}/stage`, { stage_id: stageId })
      loadLeads()
      if (activeLead?.id === leadId) {
        setActiveLead(prev => ({ ...prev, stage_id: stageId }))
      }
    } catch (err) { console.error(err) }
  }

  const deleteLead = async (leadId) => {
    if (!confirm('¿Eliminar este lead y toda su conversación?')) return
    try {
      await api.delete(`/crm/leads/${leadId}`)
      if (activeLead?.id === leadId) {
        setActiveLead(null)
        setMessages([])
      }
      loadLeads()
    } catch (err) { alert('Error al eliminar el lead') }
  }

  const toggleAI = async () => {
    if (!activeLead) return
    const newStatus = !activeLead.is_ai_active
    try {
      await api.put(`/crm/leads/${activeLead.id}/ai_status`, { is_ai_active: newStatus })
      setActiveLead(prev => ({ ...prev, is_ai_active: newStatus }))
    } catch (err) { alert('Error al cambiar estado de IA') }
  }

  const hasRecentMessage = () => {
    if (!activeLead?.last_client_message_at) return false
    const diff = Date.now() - new Date(activeLead.last_client_message_at).getTime()
    return diff < 86400000
  }

  const filteredLeads = selectedStage === 'all'
    ? leads
    : leads.filter(l => l.stage_id === parseInt(selectedStage))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-500" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">← Dashboard</Link>
          <h1 className="text-lg font-bold text-gray-800">Chats</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="all">Todos</option>
            {stages.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={() => setSimpleMode(!simpleMode)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            {simpleMode ? 'Modo avanzado' : 'Modo simple'}
          </button>
          <button
            onClick={() => setViewMode(v => v === 'chat' ? 'kanban' : 'chat')}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            {viewMode === 'chat' ? 'Kanban' : 'Chat'}
          </button>
        </div>
      </nav>

      {/* Chat View */}
      {viewMode === 'chat' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar: Lead list */}
          <div className="w-[35%] min-w-[300px] max-w-[420px] flex-shrink-0">
            <LeadList
              leads={filteredLeads}
              activeLead={activeLead}
              onSelectLead={selectLead}
            />
          </div>

          {/* Right area: Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeLead ? (
              <>
                {/* AI toggle + stage bar */}
                <div className="bg-white border-b border-gray-200 px-4 py-1.5 flex items-center gap-3 flex-shrink-0">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={!!activeLead.is_ai_active} onChange={toggleAI} className="rounded" />
                    <span>AI activo</span>
                  </label>
                  <select
                    value={activeLead.stage_id || ''}
                    onChange={(e) => changeStage(activeLead.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">Sin etapa</option>
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <div className="flex-1" />
                  <button
                    onClick={() => deleteLead(activeLead.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    🗑️ Eliminar
                  </button>
                  <button
                    onClick={() => setShowCustomFields(!showCustomFields)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showCustomFields ? 'Ocultar campos' : 'Campos'}
                  </button>
                </div>

                {/* AI suggestion */}
                {aiSuggestion && !simpleMode && (
                  <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-800">
                    💡 {aiSuggestion}
                  </div>
                )}

                <ChatContainer
                  lead={activeLead}
                  messages={messages}
                  loading={msgLoading}
                  hasMore={hasMore}
                  onLoadMore={loadMoreMessages}
                  onSendMessage={handleSendMessage}
                  onSendMedia={handleSendMedia}
                  onDeleteMessage={handleDeleteMessage}
                  onUpdateLeadName={handleUpdateLeadName}
                  uploading={uploading}
                  inputDisabled={!hasRecentMessage()}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg font-medium">Selecciona una conversación</p>
                  <p className="text-sm">Elige un chat de la lista para empezar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {stages.map(stage => (
              <div key={stage.id} className="w-72 bg-gray-100 rounded-lg p-3 flex flex-col">
                <div className="font-semibold text-sm text-gray-700 mb-3">
                  {stage.name} ({leads.filter(l => l.stage_id === stage.id).length})
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {leads.filter(l => l.stage_id === stage.id).map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => selectLead(lead)}
                      className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="font-medium text-sm">{lead.name || 'Sin nombre'}</div>
                      <div className="text-xs text-gray-500 mt-1">{lead.client_phone}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(lead.last_client_message_at || lead.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <InteractiveTour page="crm" />
      <ContextualHelp page="crm" />
    </div>
  )
}

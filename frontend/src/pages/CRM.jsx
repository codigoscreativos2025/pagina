import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const STAGES = [
  { id: 'nuevo', label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
  { id: 'contactado', label: 'Contactado', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'calificado', label: 'Calificado', color: 'bg-purple-100 text-purple-800' },
  { id: 'cerrado', label: 'Cerrado', color: 'bg-green-100 text-green-800' }
]

export default function CRM() {
  const { user } = useAuth()
  const [leads, setLeads] = useState([])
  const [activeLead, setActiveLead] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStage, setSelectedStage] = useState('all')
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadLeads()
    const interval = setInterval(loadLeads, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeLead) {
      loadMessages(activeLead.id)
      const interval = setInterval(() => loadMessages(activeLead.id), 5000)
      return () => clearInterval(interval)
    }
  }, [activeLead])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadLeads = async () => {
    try {
      const res = await api.get('/crm/leads')
      setLeads(res.data.leads || [])
      setLoading(false)
    } catch (err) {
      console.error(err)
    }
  }

  const loadMessages = async (leadId) => {
    try {
      const res = await api.get(`/crm/leads/${leadId}/messages`)
      setMessages(res.data.messages || [])
    } catch (err) {
      console.error(err)
    }
  }

  const updateLeadStatus = async (leadId, status) => {
    try {
      await api.put(`/crm/leads/${leadId}/status`, { status })
      setLeads(leads.map(l => l.id === leadId ? { ...l, status } : l))
      if (activeLead?.id === leadId) {
        setActiveLead({ ...activeLead, status })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const toggleAI = async (leadId, currentStatus) => {
    try {
      const newStatus = !currentStatus
      await api.put(`/crm/leads/${leadId}/ai_status`, { is_ai_active: newStatus })
      setLeads(leads.map(l => l.id === leadId ? { ...l, is_ai_active: newStatus } : l))
      if (activeLead?.id === leadId) {
        setActiveLead({ ...activeLead, is_ai_active: newStatus })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const sendManualMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim() || sending) return
    setSending(true)
    try {
      const res = await api.post(`/crm/leads/${activeLead.id}/messages`, { content: messageInput })
      setMessages([...messages, res.data.message])
      setMessageInput('')
      
      // Update local state to reflect AI was disabled
      setLeads(leads.map(l => l.id === activeLead.id ? { ...l, is_ai_active: false } : l))
      setActiveLead({ ...activeLead, is_ai_active: false })
    } catch (err) {
      console.error(err)
      alert('Error enviando mensaje: ' + (err.response?.data?.details?.message || err.message))
    } finally {
      setSending(false)
    }
  }

  const calculateTimeLeft = (lastMessageDate) => {
    if (!lastMessageDate) return null;
    const end = new Date(lastMessageDate).getTime() + (24 * 60 * 60 * 1000);
    const now = new Date().getTime();
    const diff = end - now;
    if (diff <= 0) return 'Expirado';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  const filteredLeads = selectedStage === 'all' 
    ? leads 
    : leads.filter(l => l.status === selectedStage)

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden font-sans">
      
      {/* Left Sidebar - Leads List */}
      <div className="w-[30%] min-w-[300px] max-w-[400px] bg-white border-r border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="bg-[#f0f2f5] h-16 flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <Link to="/dashboard" className="text-brand-600 font-semibold hover:text-brand-700">
            ← Volver
          </Link>
          <div className="font-bold text-gray-700">CRM / Chats</div>
        </div>

        {/* CRM Stage Filters */}
        <div className="bg-white p-2 border-b border-gray-200">
          <select 
            className="w-full bg-gray-100 rounded-lg p-2 text-sm border-none focus:ring-0 text-gray-700 outline-none"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
          >
            <option value="all">Todas las Etapas</option>
            {STAGES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="bg-white p-2 border-b border-gray-200">
          <div className="bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1.5">
            <span className="text-gray-500 mr-2">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar chat o contacto" 
              className="bg-transparent border-none w-full focus:ring-0 text-sm py-1 outline-none"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Cargando...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No hay leads en esta etapa</div>
          ) : (
            filteredLeads.map(lead => (
              <div 
                key={lead.id} 
                onClick={() => setActiveLead(lead)}
                className={`flex items-center px-3 py-3 border-b border-gray-100 cursor-pointer hover:bg-[#f5f6f6] transition-colors ${activeLead?.id === lead.id ? 'bg-[#ebebeb]' : ''}`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-xl text-white mr-3 flex-shrink-0">
                  {lead.name ? lead.name.charAt(0).toUpperCase() : '👤'}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base text-gray-900 truncate">{lead.name || lead.client_phone}</h3>
                    {!lead.is_ai_active && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded ml-2">IA ⏸️</span>}
                  </div>
                  <div className="text-sm text-gray-500 truncate flex justify-between">
                    <span>{lead.client_phone}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STAGES.find(s => s.id === lead.status)?.color || 'bg-gray-100'}`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Area - Chat */}
      <div className="flex-1 flex flex-col h-full bg-[#efeae2]" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', opacity: 0.9 }}>
        {activeLead ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 border-l border-gray-300 z-10 shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white mr-3">
                  {activeLead.name ? activeLead.name.charAt(0).toUpperCase() : '👤'}
                </div>
                <div>
                  <h2 className="text-base font-medium text-gray-900">{activeLead.name || activeLead.client_phone}</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">{activeLead.client_phone}</p>
                    {activeLead.last_client_message_at && (
                      <span className={`text-[10px] px-1.5 rounded ${calculateTimeLeft(activeLead.last_client_message_at) === 'Expirado' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                        ⏱️ {calculateTimeLeft(activeLead.last_client_message_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* AI Toggle Switch */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                  <span className="text-xs font-semibold text-gray-600">IA:</span>
                  <button 
                    onClick={() => toggleAI(activeLead.id, activeLead.is_ai_active)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${activeLead.is_ai_active ? 'bg-brand-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${activeLead.is_ai_active ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-[10px] font-bold ${activeLead.is_ai_active ? 'text-brand-600' : 'text-gray-400'}`}>
                    {activeLead.is_ai_active ? 'ON' : 'OFF'}
                  </span>
                </div>

                {/* CRM Status Dropdown */}
                <div className="flex items-center gap-2">
                  <select 
                    className={`text-sm rounded-full px-3 py-1 font-semibold outline-none border-none cursor-pointer ${STAGES.find(s => s.id === activeLead.status)?.color}`}
                    value={activeLead.status}
                    onChange={(e) => updateLeadStatus(activeLead.id, e.target.value)}
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id} className="bg-white text-gray-900">{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
              {messages.length === 0 ? (
                <div className="flex justify-center">
                  <div className="bg-[#fff5c4] text-gray-700 text-xs px-3 py-1 rounded-lg shadow-sm">
                    No hay mensajes en el historial.
                  </div>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'client' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] md:max-w-[60%] rounded-lg px-3 py-2 shadow-sm relative text-sm ${msg.sender_type === 'client' ? 'bg-white text-gray-800 rounded-tl-none' : 'bg-[#d9fdd3] text-gray-800 rounded-tr-none'}`}>
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      <div className="text-[10px] text-gray-500 text-right mt-1 opacity-80">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <form onSubmit={sendManualMessage} className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3 z-10">
              <input 
                type="text" 
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Escribe un mensaje..." 
                className="flex-1 rounded-lg border-none px-4 py-2.5 focus:ring-0 text-sm outline-none bg-white"
                disabled={sending || calculateTimeLeft(activeLead.last_client_message_at) === 'Expirado'}
              />
              <button 
                type="submit" 
                disabled={!messageInput.trim() || sending || calculateTimeLeft(activeLead.last_client_message_at) === 'Expirado'}
                className="bg-brand-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? '...' : '➤'}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-center border-l border-gray-300 bg-[#f0f2f5]">
            <div className="w-72 h-72 mb-8 opacity-20">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M30 50 L45 65 L70 35" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </div>
            <h1 className="text-3xl text-gray-500 font-light mb-4">Pivot CRM</h1>
            <p className="text-gray-400 text-sm max-w-md leading-relaxed">
              Haz clic en un lead de la lista izquierda para visualizar su conversación. Las respuestas son generadas automáticamente por la IA.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

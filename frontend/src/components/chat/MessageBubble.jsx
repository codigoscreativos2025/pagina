import { useState } from 'react'
import api from '../../services/api'

export default function MessageBubble({ msg, leadId, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const isAgent = msg.sender_type === 'agent'
  const hasMedia = msg.media_type || msg.message_type === 'image' || msg.message_type === 'audio'

  const handleContextMenu = (e) => {
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
    setShowMenu(true)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content || msg.media_filename || '')
    setShowMenu(false)
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este mensaje?')) return
    setShowMenu(false)
    try {
      await api.delete(`/crm/leads/${leadId}/messages/${msg.id}`)
      if (onDelete) onDelete(msg.id)
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.error || err.message))
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <div
        className={`flex ${isAgent ? 'justify-end' : 'justify-start'} mb-1 px-16`}
        onContextMenu={handleContextMenu}
      >
        <div
          className={`max-w-[65%] rounded-lg px-3 py-2 shadow-sm cursor-pointer relative group
            ${isAgent ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}
        >
          <div className="text-sm whitespace-pre-wrap break-words">
            {msg.content}
          </div>
          <div className="text-[11px] text-gray-500 text-right mt-0.5 flex items-center justify-end gap-1">
            {formatTime(msg.created_at)}
            {isAgent && (
              <span className="text-gray-400">{msg.status === 'read' ? '✓✓' : '✓'}</span>
            )}
          </div>
          <span className="absolute -right-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 cursor-pointer text-lg" onClick={handleContextMenu}>
            ⋮
          </span>
        </div>
      </div>

      {showMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowMenu(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            className="absolute bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px] z-50"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <button
              onClick={handleCopy}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <span>📋</span> Copiar
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <span>🗑️</span> Eliminar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

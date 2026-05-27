import { useState } from 'react'

export default function ChatHeader({ lead, onNameUpdate }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  const handleStartEdit = () => {
    setName(lead?.name || 'Sin nombre')
    setEditing(true)
  }

  const handleSave = async () => {
    if (onNameUpdate) await onNameUpdate(name || 'Sin nombre')
    setEditing(false)
  }

  const sourceIcon = {
    whatsapp: '📱',
    instagram: '📸',
    facebook: '💬',
    tiktok: '🎵'
  }

  return (
    <div className="h-14 bg-[#f0f2f5] border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0">
      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-lg">
        {(lead?.name || '?')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#25d366]"
              autoFocus
            />
            <button onClick={handleSave} className="text-sm text-[#25d366] font-medium">Guardar</button>
            <button onClick={() => setEditing(false)} className="text-sm text-gray-500">Cancelar</button>
          </div>
        ) : (
          <div
            className="font-semibold text-sm text-gray-800 cursor-pointer hover:underline"
            onClick={handleStartEdit}
            title="Click para editar"
          >
            {lead?.name || 'Sin nombre'}
            <span className="ml-2 text-gray-400 font-normal text-xs">
              {sourceIcon[lead?.source] || ''} {lead?.client_phone && '· ' + lead.client_phone}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

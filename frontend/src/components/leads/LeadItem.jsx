export default function LeadItem({ lead, isActive, onClick }) {
  const sourceIcon = {
    whatsapp: '📱', facebook: '💬', instagram: '📸', tiktok: '🎵'
  }
  const sourceColor = {
    whatsapp: 'bg-green-500', facebook: 'bg-blue-500', instagram: 'bg-pink-500', tiktok: 'bg-gray-700'
  }

  const getLastMessagePreview = () => {
    if (!lead.last_message_preview) return ''
    return lead.last_message_preview.length > 40
      ? lead.last_message_preview.substring(0, 40) + '...'
      : lead.last_message_preview
  }

  const formatTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    if (diff < 86400000) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
  }

  return (
    <div
      onClick={() => onClick(lead)}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors
        ${isActive ? 'bg-[#f0f2f5]' : 'hover:bg-gray-50'}`}
    >
      <div className="relative flex-shrink-0">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg
          ${lead.source ? sourceColor[lead.source] || 'bg-gray-400' : 'bg-gray-400'}`}>
          {(lead.name || '?')[0].toUpperCase()}
        </div>
        {lead.source && (
          <span className="absolute -bottom-1 -right-1 text-xs">{sourceIcon[lead.source] || ''}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <span className="font-medium text-sm text-gray-800 truncate">
            {lead.name || 'Sin nombre'}
          </span>
          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
            {formatTime(lead.last_client_message_at || lead.updated_at)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-xs text-gray-500 truncate">
            {getLastMessagePreview() || lead.source || 'Sin mensajes'}
          </span>
          {lead.stage_name && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0 ml-2">
              {lead.stage_name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

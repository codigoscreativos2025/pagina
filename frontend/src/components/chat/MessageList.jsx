import { useRef, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import MediaViewer from './MediaViewer'
import AudioPlayer from './AudioPlayer'
import api from '../../services/api'

export default function MessageList({ messages, leadId, loading, hasMore, onLoadMore, onDeleteMessage }) {
  const listRef = useRef(null)
  const observerRef = useRef(null)

  const lastMessageRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!node) return
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        onLoadMore()
      }
    }, { threshold: 0.1 })
    observerRef.current.observe(node)
  }, [hasMore, loading, onLoadMore])

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 bg-[#efeae2]" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cdc4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
    }}>
      {loading && messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500" />
        </div>
      )}

      {hasMore && (
        <div ref={lastMessageRef} className="text-center py-2">
          <span className="text-xs text-gray-400 animate-pulse">Cargando mensajes anteriores...</span>
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No hay mensajes aún
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className="mb-2">
          {msg.media_type && (msg.media_type === 'image' || msg.media_type === 'video') && (
            <MediaViewer msg={msg} api={api} />
          )}
          {msg.media_type === 'audio' && (
            <AudioPlayer msg={msg} api={api} />
          )}
          {(msg.content || (!msg.media_type && !msg.media_id) || msg.message_type === 'text') && (
            <MessageBubble
              msg={msg}
              leadId={leadId}
              onDelete={onDeleteMessage}
            />
          )}
        </div>
      ))}
    </div>
  )
}

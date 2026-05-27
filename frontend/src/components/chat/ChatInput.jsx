import { useState, useRef } from 'react'

export default function ChatInput({ onSend, onSendMedia, uploading, disabled }) {
  const [text, setText] = useState('')
  const fileInputRef = useRef(null)

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && onSendMedia) onSendMedia(file)
    e.target.value = ''
  }

  return (
    <div className="h-16 bg-[#f0f2f5] border-t border-gray-200 flex items-center gap-2 px-4 flex-shrink-0">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-10 h-10 rounded-full text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xl flex-shrink-0"
        title="Adjuntar"
      >
        📎
      </button>
      <div className="flex-1 bg-white rounded-lg px-3 py-2 flex items-center">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          rows={1}
          disabled={disabled || uploading}
          className="flex-1 text-sm bg-transparent outline-none resize-none placeholder-gray-400"
          style={{ maxHeight: '80px' }}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled || uploading}
        className="w-10 h-10 rounded-full bg-[#25d366] text-white flex items-center justify-center flex-shrink-0 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        title="Enviar"
      >
        {uploading ? '⏳' : '📨'}
      </button>
    </div>
  )
}

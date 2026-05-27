import { useState } from 'react'

export default function MediaViewer({ msg, api }) {
  const [open, setOpen] = useState(false)

  if (!msg.media_type && msg.message_type !== 'image' && msg.message_type !== 'video') return null

  const mediaUrl = msg.media_url || `${api.defaults.baseURL || '/api'}/media/${msg.media_id}`

  const isImage = msg.media_type === 'image' || msg.message_type === 'image'

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer max-w-[260px] rounded-lg overflow-hidden mb-1 hover:opacity-90 transition-opacity"
      >
        {isImage ? (
          <img
            src={mediaUrl}
            alt={msg.media_filename || 'Imagen'}
            className="w-full h-auto rounded-lg"
            loading="lazy"
          />
        ) : (
          <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
            <span className="text-2xl">📎</span>
            <span className="text-sm text-gray-600 truncate">{msg.media_filename || 'Archivo'}</span>
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
          <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {isImage ? (
              <img src={mediaUrl} alt={msg.media_filename || 'Imagen'} className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            ) : (
              <video src={mediaUrl} controls className="max-w-full max-h-[75vh] rounded-lg" />
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(mediaUrl)
                    const blob = await response.blob()
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = msg.media_filename || 'archivo'
                    a.click()
                  } catch (e) {}
                }}
                className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100"
              >
                📥 Descargar
              </button>
              {isImage && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(mediaUrl)
                      const blob = await response.blob()
                      await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob })
                      ])
                    } catch (e) {
                      alert('No se pudo copiar la imagen')
                    }
                  }}
                  className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100"
                >
                  📋 Copiar imagen
                </button>
              )}
              <button onClick={() => setOpen(false)} className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

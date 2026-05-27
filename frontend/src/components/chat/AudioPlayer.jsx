import { useState, useRef, useEffect } from 'react'

export default function AudioPlayer({ msg, api }) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(msg.media_duration || 0)
  const audioRef = useRef(null)

  const audioType = msg.media_type === 'audio' || msg.message_type === 'audio'
  if (!audioType) return null

  const audioUrl = msg.media_id
    ? `${api.defaults.baseURL || '/api'}/media/${msg.media_id}?token=${localStorage.getItem('token')}`
    : null

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMeta = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMeta)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMeta)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const label = msg.media_transcription || 'Audio'

  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mt-1">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-[#25d366] text-white flex items-center justify-center flex-shrink-0 hover:bg-green-600 transition-colors"
      >
        {playing ? '⏸' : '▶'}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
          if (!audioRef.current || !duration) return
          const rect = e.currentTarget.getBoundingClientRect()
          const pct = (e.clientX - rect.left) / rect.width
          audioRef.current.currentTime = pct * duration
        }}>
          <div className="h-full bg-[#25d366] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5">{formatTime(currentTime)} / {formatTime(duration)}</div>
      </div>
    </div>
  )
}

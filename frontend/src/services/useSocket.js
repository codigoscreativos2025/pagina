import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = window.location.origin

export function useSocket() {
  const socketRef = useRef(null)

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false
    })
    socketRef.current.connect()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const joinLead = useCallback((leadId) => {
    if (socketRef.current && leadId) {
      socketRef.current.emit('join_lead', leadId)
    }
  }, [])

  const leaveLead = useCallback((leadId) => {
    if (socketRef.current && leadId) {
      socketRef.current.emit('leave_lead', leadId)
    }
  }, [])

  const onNewMessage = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.off('new_message')
      socketRef.current.on('new_message', callback)
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('new_message')
      }
    }
  }, [])

  const onLeadUpdated = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.off('lead_updated')
      socketRef.current.on('lead_updated', callback)
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('lead_updated')
      }
    }
  }, [])

  return { joinLead, leaveLead, onNewMessage, onLeadUpdated }
}

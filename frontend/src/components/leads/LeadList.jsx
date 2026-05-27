import { useState, useRef, useEffect, useCallback } from 'react'
import LeadItem from './LeadItem'

export default function LeadList({ leads, activeLead, onSelectLead, onSearch }) {
  const [search, setSearch] = useState('')
  const searchRef = useRef(null)

  const filteredLeads = leads.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (l.name || '').toLowerCase().includes(q) ||
           (l.client_phone || '').includes(q) ||
           (l.source || '').toLowerCase().includes(q)
  })

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus()
  }, [])

  // Sort: leads with recent messages first
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const aTime = new Date(a.last_client_message_at || a.updated_at || 0).getTime()
    const bTime = new Date(b.last_client_message_at || b.updated_at || 0).getTime()
    return bTime - aTime
  })

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white">
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar o empezar nuevo chat"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#25d366] transition-all"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {sortedLeads.length === 0 && (
          <div className="p-6 text-center text-gray-400 text-sm">
            {search ? 'No se encontraron resultados' : 'No hay conversaciones'}
          </div>
        )}
        {sortedLeads.map(lead => (
          <LeadItem
            key={lead.id}
            lead={lead}
            isActive={activeLead?.id === lead.id}
            onClick={onSelectLead}
          />
        ))}
      </div>
    </div>
  )
}

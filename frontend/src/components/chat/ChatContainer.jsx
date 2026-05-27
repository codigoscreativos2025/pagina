import { useRef, useEffect } from 'react'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

export default function ChatContainer({
  lead,
  messages,
  loading,
  hasMore,
  onLoadMore,
  onSendMessage,
  onSendMedia,
  onDeleteMessage,
  onUpdateLeadName,
  uploading,
  inputDisabled
}) {
  return (
    <div className="flex flex-col h-full">
      <ChatHeader lead={lead} onNameUpdate={onUpdateLeadName} />
      <MessageList
        messages={messages}
        leadId={lead?.id}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        onDeleteMessage={onDeleteMessage}
      />
      <ChatInput
        onSend={onSendMessage}
        onSendMedia={onSendMedia}
        uploading={uploading}
        disabled={inputDisabled}
      />
    </div>
  )
}

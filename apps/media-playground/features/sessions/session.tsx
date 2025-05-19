'use client'

import { MessageInput } from './components/message-input'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { FC, useCallback, useEffect, useRef } from 'react'
import * as React from 'react'

type Message = {
  _id: string
  sender: string
  content: string
  role: 'user' | 'assistant' | 'system'
  attachments?: string[]
  tool_calls?: Record<string, unknown>[]
  createdAt: Date
}

type SessionProps = {
  id: string
  title: string
  messages?: Message[]
}

const Session: FC<SessionProps> = ({
  id: _id,
  title,
  messages: initialMessages = [],
}) => {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthState()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = (message: Message) => {
    setMessages(prev => [...prev, message])
  }

  const isOwnMessage = (senderId: string) => user?._id === senderId

  return (
    <div className="flex flex-col bg-aui-background">
      <div className="max-w-[60%] mx-auto w-full flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div key={message._id}>
              {isOwnMessage(message.sender) ? (
                <UserMessage message={message} />
              ) : (
                <OtherMessage message={message} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <MessageInput onSend={handleSendMessage} />
      </div>
    </div>
  )
}

export default Session

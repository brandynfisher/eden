'use client'

import { MessageInput } from './components/message-input'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useAuthState } from '@/hooks/use-auth-state'
import { ThreadMessage } from '@edenlabs/eden-sdk'
import { FC, useCallback, useEffect, useRef } from 'react'
import * as React from 'react'

type SessionProps = {
  id: string
  title: string
  messages?: ThreadMessage[]
}

const Session: FC<SessionProps> = ({ messages: initialMessages = [] }) => {
  const [messages, setMessages] =
    React.useState<ThreadMessage[]>(initialMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthState()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = (message: ThreadMessage) => {
    setMessages(prev => [...prev, message])
  }

  const isOwnMessage = (senderId?: string) => {
    if (!senderId) return false
    return user?._id === senderId
  }

  return (
    <div className="flex flex-col bg-aui-background">
      <div className="mx-auto flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(message => (
            <div key={message.id}>
              {isOwnMessage(message.sender?._id) ? (
                <UserMessage message={message} />
              ) : (
                <>
                  <OtherMessage message={message} />
                </>
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

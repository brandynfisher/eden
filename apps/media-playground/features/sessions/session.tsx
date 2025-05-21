'use client'

import { MessageInput } from './components/message-input'
import { groupConsecutiveMessages } from './utils/group-messages'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useAuthState } from '@/hooks/use-auth-state'
import { SessionContentMessage } from '@edenlabs/eden-sdk'
import { FC, useCallback, useEffect, useRef } from 'react'
import * as React from 'react'

type SessionProps = {
  id: string
  title: string
  messages?: SessionContentMessage[]
}

const Session: FC<SessionProps> = ({ messages: initialMessages = [] }) => {
  const [messages, setMessages] =
    React.useState<SessionContentMessage[]>(initialMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthState()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = (message: SessionContentMessage) => {
    setMessages(prev => [...prev, message])
  }

  const isOwnMessage = (senderId?: string) => {
    if (!senderId) return false
    return user?._id === senderId
  }

  const messageGroups = groupConsecutiveMessages(messages)

  return (
    <div className="flex flex-col bg-aui-background">
      <div className="mx-auto flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-4">
          {messageGroups.map(group => (
            <div key={group[0].id}>
              {isOwnMessage(group[0].sender?._id) ? (
                <>
                  {group.map(message => (
                    <UserMessage key={message.id} message={message} />
                  ))}
                </>
              ) : (
                <>
                  {group.map((message, index) => (
                    <OtherMessage
                      key={message.id}
                      message={message}
                      showAvatar={index === 0}
                    />
                  ))}
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

'use client'

import { MessageInput } from './components/message-input'
import { SessionTopBar } from './components/session-top-bar'
import { groupConsecutiveMessages } from './utils/group-messages'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useSessionWebSocket } from '@/hooks/use-session-websocket'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

const Session = () => {
  const params = useParams()
  const sessionId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthState()

  const {
    data: session,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useSessionQuery({
    sessionId: sessionId as string,
    enabled: !!sessionId && sessionId !== 'new',
  })

  // Enable WebSocket updates for this session
  useSessionWebSocket({
    sessionId: sessionId as string,
    enabled: !!sessionId && sessionId !== 'new',
  })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [session?.messages, scrollToBottom])

  const isOwnMessage = (senderId?: string) => {
    if (!senderId) return false
    return user?._id === senderId
  }

  const messageGroups = session?.messages
    ? groupConsecutiveMessages(session.messages)
    : []

  if (isSessionLoading) {
    return (
      <div className="flex mx-auto py-16">
        <LoadingIndicator />
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="flex mx-auto py-16 md:w-1/2 w-[calc(100%-2rem)]">
        <AlertDestructive>
          <AlertDescription>
            We couldn't load this session. Please try again later. If the
            problem persists, please contact support.
          </AlertDescription>
        </AlertDestructive>
      </div>
    )
  }

  return (
    <>
      {/* Sticky top bar showing agents */}
      {session?.agents && session.agents.length > 0 && (
        <SessionTopBar agents={session.agents} title={session.title} />
      )}

      <div className="flex-1 overflow-y-auto p-4 max-w-[--aui-thread-max-width] mx-auto">
        {messageGroups.map(group => (
          <div key={group[0]._id}>
            {isOwnMessage(group[0].sender?._id)
              ? group.map(message => (
                  <UserMessage key={message._id} message={message} />
                ))
              : group.map((message, index) => (
                  <OtherMessage
                    sessionId={sessionId as string}
                    key={message._id}
                    message={message}
                    showAvatar={index === 0}
                  />
                ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="max-w-[--aui-thread-max-width] mx-auto w-full sticky bottom-0">
        <MessageInput sessionId={sessionId as string} />
      </div>
    </>
  )
}

export default Session

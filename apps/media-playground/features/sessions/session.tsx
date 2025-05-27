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
import { useSessionStream } from '@/hooks/use-session-stream'
import { useSessionWebSocket } from '@/hooks/use-session-websocket'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const Session = () => {
  const params = useParams()
  const sessionId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthState()
  const [streamingText, setStreamingText] = useState('')
  const [isStreamingTokens, setIsStreamingTokens] = useState(false)
  const [hasReceivedTokens, setHasReceivedTokens] = useState(false)
  const [waitingForWebSocket, setWaitingForWebSocket] = useState(false)
  const streamingMessageIdRef = useRef<string | null>(null)

  const {
    data: session,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useSessionQuery({
    sessionId: sessionId as string,
    enabled: !!sessionId && sessionId !== 'new',
  })

  useSessionWebSocket({
    sessionId: sessionId as string,
    enabled: !!sessionId && sessionId !== 'new',
  })

  // Clear streaming state when websocket delivers the real message
  useEffect(() => {
    if (
      waitingForWebSocket &&
      streamingMessageIdRef.current &&
      session?.messages
    ) {
      const lastMessage = session.messages[session.messages.length - 1]
      if (
        lastMessage &&
        lastMessage.content === streamingMessageIdRef.current
      ) {
        setStreamingText('')
        setIsStreamingTokens(false)
        setHasReceivedTokens(false)
        setWaitingForWebSocket(false)
        streamingMessageIdRef.current = null
      }
    }
  }, [session?.messages, waitingForWebSocket])

  // Set up streaming
  const { sendMessage: sendStreamingMessage } = useSessionStream({
    sessionId,
    onToken: text => {
      setStreamingText(prev => prev + text)
      setIsStreamingTokens(true)
      setHasReceivedTokens(true)
    },
    onMessage: content => {
      // Message is complete - set final content and wait for websocket confirmation
      setStreamingText(content)
      setIsStreamingTokens(false) // Stop showing typing indicator
      setWaitingForWebSocket(true)
      streamingMessageIdRef.current = content

      // Fallback timeout in case websocket doesn't deliver
      setTimeout(() => {
        if (streamingMessageIdRef.current === content) {
          setStreamingText('')
          setIsStreamingTokens(false)
          setHasReceivedTokens(false)
          setWaitingForWebSocket(false)
          streamingMessageIdRef.current = null
        }
      }, 2000)
    },
    onToolComplete: () => {
      setStreamingText('')
      setIsStreamingTokens(false)
      setHasReceivedTokens(false)
      setWaitingForWebSocket(false)
      streamingMessageIdRef.current = null
    },
    onError: error => {
      console.error('Streaming error:', error)
      setStreamingText('')
      setIsStreamingTokens(false)
      setHasReceivedTokens(false)
      setWaitingForWebSocket(false)
      streamingMessageIdRef.current = null
    },
    onDone: () => {
      // Only clear if we're not waiting for websocket
      if (!waitingForWebSocket) {
        setIsStreamingTokens(false)
        setHasReceivedTokens(false)
      }
    },
  })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [session?.messages, scrollToBottom])

  // Separate effect for streaming text to avoid double scroll
  useEffect(() => {
    if (streamingText && isStreamingTokens) {
      scrollToBottom()
    }
  }, [streamingText, isStreamingTokens, scrollToBottom])

  const isOwnMessage = (senderId?: string) => {
    if (!senderId) return false
    return user?._id === senderId
  }

  const filteredMessages = useMemo(
    () => session?.messages?.filter(m => m.role !== 'tool') ?? [],
    [session?.messages],
  )
  const messageGroups = useMemo(
    () => groupConsecutiveMessages(filteredMessages),
    [filteredMessages],
  )

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

      <div className="flex-1 overflow-y-auto p-4 max-w-[--aui-thread-max-width] mx-auto w-full">
        {messageGroups.map(group => (
          <div key={group[0]._id}>
            {isOwnMessage(group[0].sender?._id)
              ? group.map(message => (
                  <UserMessage key={message._id} message={message} />
                ))
              : group
                  .filter(message => message.role !== 'tool')
                  .map((message, index) => (
                    <OtherMessage
                      sessionId={sessionId as string}
                      key={message._id}
                      message={message}
                      showAvatar={index === 0}
                    />
                  ))}
          </div>
        ))}

        {/* Show streaming message when actively streaming tokens or waiting for websocket */}
        {(isStreamingTokens || waitingForWebSocket) && streamingText && (
          <div className="mb-4">
            <OtherMessage
              sessionId={sessionId as string}
              message={
                {
                  _id: 'streaming',
                  content: streamingText,
                  sender: session?.agents?.[0] || {
                    _id: 'agent',
                    username: 'Assistant',
                  },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  session: sessionId,
                  role: 'assistant',
                } as any // eslint-disable-line @typescript-eslint/no-explicit-any
              }
              showAvatar={true}
              isStreamingTokens={isStreamingTokens && !hasReceivedTokens}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="max-w-[--aui-thread-max-width] mx-auto w-full sticky bottom-0">
        <MessageInput
          sessionId={sessionId as string}
          onStreamingMessage={(content, attachments) => {
            setIsStreamingTokens(true)
            setHasReceivedTokens(false)
            setStreamingText('')
            sendStreamingMessage(content, attachments)
            // Scroll to bottom when streaming starts
            setTimeout(scrollToBottom, 100)
          }}
        />
      </div>
    </>
  )
}

export default Session

import { useSessionStream } from '@/hooks/use-session-stream'
import { Message } from '@edenlabs/eden-sdk'
import { useCallback, useRef, useState } from 'react'

interface UseStreamingStateProps {
  sessionId: string | undefined
  enabled: boolean
  onError: (error: string) => void
  setOptimisticMessages: React.Dispatch<React.SetStateAction<Message[]>>
  onSessionCreated?: (sessionId: string) => void
}

export function useStreamingState({
  sessionId,
  enabled,
  onError,
  setOptimisticMessages,
  onSessionCreated,
}: UseStreamingStateProps) {
  const [streamingText, setStreamingText] = useState('')
  const [isStreamingTokens, setIsStreamingTokens] = useState(false)
  const [hasReceivedTokens, setHasReceivedTokens] = useState(false)
  const [waitingForWebSocket, setWaitingForWebSocket] = useState(false)
  const [streamingAgent, setStreamingAgent] = useState<{
    _id: string
    username: string
    name: string
    userImage?: string
  } | null>(null)
  const streamingMessageIdRef = useRef<string | null>(null)

  const clearStreamingState = useCallback(() => {
    setStreamingText('')
    setIsStreamingTokens(false)
    setHasReceivedTokens(false)
    setWaitingForWebSocket(false)
    setStreamingAgent(null)
    streamingMessageIdRef.current = null
  }, [])

  const { sendMessage } = useSessionStream({
    sessionId: enabled ? sessionId : undefined,
    onToken: text => {
      if (enabled) {
        setStreamingText(prev => prev + text)
        setIsStreamingTokens(true)
        setHasReceivedTokens(true)
      }
    },
    onMessage: content => {
      if (enabled) {
        setStreamingText(content)
        setIsStreamingTokens(false)
        setWaitingForWebSocket(true)
        streamingMessageIdRef.current = content
        setOptimisticMessages([])

        setTimeout(() => {
          if (
            streamingMessageIdRef.current === content &&
            waitingForWebSocket
          ) {
            setHasReceivedTokens(false)
            setWaitingForWebSocket(false)
            streamingMessageIdRef.current = null
          }
        }, 3000)
      }
    },
    onToolComplete: () => {
      if (enabled) {
        setStreamingText('')
        setIsStreamingTokens(true)
        setHasReceivedTokens(false)
        setWaitingForWebSocket(false)
        streamingMessageIdRef.current = null
        setOptimisticMessages([])

        setTimeout(() => {
          if (!hasReceivedTokens) {
            clearStreamingState()
          }
        }, 3000)
      }
    },
    onError,
    onDone: () => {
      if (enabled && !waitingForWebSocket) {
        setIsStreamingTokens(false)
        setHasReceivedTokens(false)
        setOptimisticMessages([])
      }
    },
    onAgentInfo: agent => {
      if (enabled) {
        setStreamingAgent(agent)
      }
    },
    onSessionCreated,
  })

  const initializeStreaming = useCallback(() => {
    setIsStreamingTokens(true)
    setHasReceivedTokens(false)
    setStreamingText('')
    setStreamingAgent(null)
  }, [])

  return {
    streamingText,
    isStreamingTokens,
    hasReceivedTokens,
    waitingForWebSocket,
    streamingAgent,
    streamingMessageIdRef,
    sendMessage,
    clearStreamingState,
    initializeStreaming,
  }
}
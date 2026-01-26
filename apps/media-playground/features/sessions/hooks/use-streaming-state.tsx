import { useSessionStream } from '@/hooks/use-session-stream'
import { Message } from '@edenlabs/eden-sdk'
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'

type StreamingAgentState = {
  agent: {
    _id: string
    username: string
    name: string
    userImage?: string
  }
  text: string
  isStreamingTokens: boolean
  hasReceivedTokens: boolean
  waitingForWebSocket: boolean
  streamingMessageId: string | null
  awaitingToolCall: boolean
  sessionRunId?: string
}

interface UseStreamingStateProps {
  sessionId: string | undefined
  enabled: boolean
  onError: (error: string) => void
  setOptimisticMessages: Dispatch<SetStateAction<Message[]>>
  onSessionCreated?: (sessionId: string) => void
  onAgentStart?: (agentId: string, sessionRunId?: string) => void
  onAgentOutput?: (agentId: string, sessionRunId?: string) => void
}

export function useStreamingState({
  sessionId,
  enabled,
  onError,
  setOptimisticMessages,
  onSessionCreated,
  onAgentStart,
  onAgentOutput,
}: UseStreamingStateProps) {
  const [streamingByAgent, setStreamingByAgent] = useState<
    Record<string, StreamingAgentState>
  >({})
  const latestAgentIdRef = useRef<string | null>(null)
  const latestAgentRef = useRef<StreamingAgentState['agent'] | null>(null)

  const clearStreamingState = useCallback(() => {
    setStreamingByAgent({})
    latestAgentIdRef.current = null
  }, [])

  const upsertStreamingAgent = useCallback(
    (
      agent: {
        _id: string
        username: string
        name: string
        userImage?: string
      },
      updater: (prev: StreamingAgentState) => StreamingAgentState,
      sessionRunId?: string,
    ) => {
      latestAgentIdRef.current = agent._id
      latestAgentRef.current = agent
      setStreamingByAgent(prev => {
        const existing = prev[agent._id] ?? {
          agent,
          text: '',
          isStreamingTokens: false,
          hasReceivedTokens: false,
          waitingForWebSocket: false,
          streamingMessageId: null,
          awaitingToolCall: false,
          sessionRunId,
        }
        return {
          ...prev,
          [agent._id]: updater({
            ...existing,
            agent,
            sessionRunId: sessionRunId ?? existing.sessionRunId,
          }),
        }
      })
    },
    [],
  )

  const { sendMessage } = useSessionStream({
    sessionId: enabled ? sessionId : undefined,
    onToken: (text, meta) => {
      if (!enabled) return
      const agent = meta?.agent ?? latestAgentRef.current ?? undefined
      if (!agent) return
      onAgentOutput?.(agent._id, meta?.sessionRunId)
      upsertStreamingAgent(
        agent,
        prev => ({
          ...prev,
          text: prev.text + text,
          isStreamingTokens: true,
          hasReceivedTokens: true,
          awaitingToolCall: false,
        }),
        meta?.sessionRunId,
      )
    },
    onMessage: (content, meta) => {
      if (enabled) {
        const agent = meta?.agent ?? latestAgentRef.current ?? undefined
        if (!agent) return
        const trimmed = content.trim()
        const awaitingToolCall = trimmed.length === 0
        if (trimmed.length > 0) {
          onAgentOutput?.(agent._id, meta?.sessionRunId)
        }
        upsertStreamingAgent(
          agent,
          prev => ({
            ...prev,
            text: prev.text.length > 0 ? prev.text : content,
            isStreamingTokens: false,
            waitingForWebSocket: true,
            streamingMessageId: meta?.messageId ?? content,
            awaitingToolCall,
          }),
          meta?.sessionRunId,
        )
        setOptimisticMessages([])
      }
    },
    onToolComplete: () => {
      if (enabled) {
        setStreamingByAgent(prev => {
          const next: Record<string, StreamingAgentState> = {}
          Object.entries(prev).forEach(([agentId, state]) => {
            next[agentId] = {
              ...state,
              text: '',
              isStreamingTokens: true,
              hasReceivedTokens: false,
              waitingForWebSocket: false,
              streamingMessageId: null,
              awaitingToolCall: false,
            }
          })
          return next
        })
        setOptimisticMessages([])
      }
    },
    onError,
    onDone: () => {
      if (enabled) {
        setStreamingByAgent(prev => {
          const next: Record<string, StreamingAgentState> = {}
          Object.entries(prev).forEach(([agentId, state]) => {
            if (state.waitingForWebSocket) {
              next[agentId] = state
            }
          })
          return next
        })
        setOptimisticMessages([])
      }
    },
    onAgentInfo: (agent, sessionRunId) => {
      if (enabled) {
        upsertStreamingAgent(
          agent,
          prev => ({
            ...prev,
            agent,
            // Show the streaming placeholder as soon as start_prompt arrives.
            isStreamingTokens: prev.hasReceivedTokens
              ? prev.isStreamingTokens
              : true,
            hasReceivedTokens: prev.hasReceivedTokens,
            awaitingToolCall: false,
          }),
          sessionRunId,
        )
        onAgentStart?.(agent._id, sessionRunId)
      }
    },
    onSessionCreated,
  })

  const initializeStreaming = useCallback(() => {
    setStreamingByAgent({})
    latestAgentIdRef.current = null
  }, [])

  const streamingAgentIds = useMemo(
    () => Object.keys(streamingByAgent),
    [streamingByAgent],
  )

  const resolveStreamingWithMessages = useCallback((messages: Message[]) => {
    if (!messages || messages.length === 0) return
    setStreamingByAgent(prev => {
      let changed = false
      const next: Record<string, StreamingAgentState> = {}
      Object.entries(prev).forEach(([agentId, state]) => {
        if (
          state.waitingForWebSocket &&
          state.streamingMessageId &&
          messages.find(
            msg =>
              msg.role === 'assistant' &&
              ((msg as { _id?: string })._id === state.streamingMessageId ||
                (msg as { id?: string }).id === state.streamingMessageId ||
                msg.content === state.streamingMessageId) &&
              (typeof msg.sender === 'string'
                ? msg.sender === agentId
                : msg.sender?._id === agentId),
          )
        ) {
          changed = true
          return
        }
        next[agentId] = state
      })
      return changed ? next : prev
    })
  }, [])

  return {
    streamingByAgent,
    streamingAgentIds,
    resolveStreamingWithMessages,
    sendMessage,
    clearStreamingState,
    initializeStreaming,
  }
}

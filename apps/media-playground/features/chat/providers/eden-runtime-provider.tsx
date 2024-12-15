'use client'

import {
  MessageEmitter,
  createAsyncIterableFromEmitter,
} from '@/features/chat/MessageEmitter'
import { getThread, sendMessage } from '@/features/chat/chat-api'
import { EdenMessage } from '@/features/chat/eden-message-converter'
import { useEdenRuntime } from '@/features/chat/hooks/useEdenRuntime'
import { useThreadListQuery } from '@/hooks/query/use-thread-list-query'
import { useWebSocketMessage } from '@/hooks/use-websocket-message'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { AssistantMessage } from '@edenlabs/eden-sdk'
import { ReactNode, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

const TIMEOUT_DURATION_MS = 5 * 60 * 1000

export function EdenRuntimeProvider({
  agentId,
  children,
}: Readonly<{
  agentId: string
  children: ReactNode
}>) {
  const { invalidate } = useThreadListQuery()
  const threadIdRef = useRef<string | undefined>()
  const abortController = useRef<AbortController>(new AbortController())
  const messageEmitterRef = useRef(new MessageEmitter())

  const websocketMessage = useWebSocketMessage({
    eventType: 'thread-update',
    abortSignal: abortController.current.signal,
  })

  useEffect(() => {
    ``
    if (websocketMessage) {
      const newMessages = websocketMessage.data.newMessages as
        | EdenMessage[]
        | undefined
      if (newMessages && newMessages.length > 0) {
        newMessages.forEach(msg => messageEmitterRef.current.emit(msg))
      }
    }
  }, [websocketMessage])

  const runtime = useEdenRuntime({
    threadId: threadIdRef.current,
    onSwitchToNewThread: async () => {
      threadIdRef.current = undefined
    },
    onSwitchToThread: async threadId => {
      const thread = await getThread(threadId)
      threadIdRef.current = threadId
      return {
        messages: thread.messages,
      }
    },
    stream: async messages => {
      return (async function* () {
        const messageEmitter = messageEmitterRef.current

        const sendMessageResponse = await sendMessage({
          threadId: threadIdRef.current,
          agentId,
          messages,
          abortSignal: abortController.current.signal,
        })

        if (
          sendMessageResponse.status !== 200 ||
          !sendMessageResponse.data.thread_id
        ) {
          yield {
            data: {
              id: uuidv4(),
              role: 'assistant',
              content: JSON.stringify(sendMessageResponse?.data?.message),
              status: { type: 'incomplete', reason: 'error' },
            },
          }
          return
        }

        if (!threadIdRef.current) {
          await invalidate()
          threadIdRef.current = sendMessageResponse.data.thread_id as string
        }

        const messageIterable = createAsyncIterableFromEmitter(
          messageEmitter,
          TIMEOUT_DURATION_MS,
        )

        try {
          for await (const message of messageIterable) {
            const assistantMessage = message as AssistantMessage

            console.log('yielding', message)
            yield {
              data: {
                id: assistantMessage.id,
                role: 'assistant',
                status: assistantMessage.tool_calls?.length
                  ? { type: 'incomplete', reason: 'tool-calls' }
                  : { type: 'complete', reason: 'stop' },
                content: assistantMessage.content,
                tool_calls: assistantMessage.tool_calls,
              },
            }
          }
        } catch (error) {
          yield {
            data: {
              id: uuidv4(),
              role: 'assistant',
              status: { type: 'incomplete', reason: 'error' },
              content: `Error: ${(error as { message: string }).message}`,
            },
          }
        }
      })()
    },
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
}

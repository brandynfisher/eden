'use client'

import LoadingIndicator from '@/components/loading-indicator'
import {
  MessageEmitter,
  createAsyncIterableFromEmitter,
} from '@/features/chat/MessageEmitter'
import { getThread, sendMessage } from '@/features/chat/chat-api'
import { EdenMessage } from '@/features/chat/eden-message-converter'
import { useEdenRuntime } from '@/features/chat/hooks/useEdenRuntime'
import { useWebSocketMessage } from '@/hooks/use-websocket-message'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { AssistantMessage } from '@edenlabs/eden-sdk'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const TIMEOUT_DURATION_MS = 5 * 60 * 1000

export function EdenRuntimeProvider({
  agentId,
  threadId,
  children,
}: Readonly<{
  agentId: string
  threadId?: string
  children: ReactNode
}>) {
  const [isLoadingThread, setIsLoadingThread] = useState(false)
  const threadIdRef = useRef<string | undefined>()
  const abortController = useRef<AbortController>(new AbortController())
  const messageEmitterRef = useRef(new MessageEmitter())
  const websocketMessage = useWebSocketMessage({
    eventType: 'thread-update',
    abortSignal: abortController.current.signal,
  })

  useEffect(() => {
    if (websocketMessage) {
      const newMessages = websocketMessage.data.newMessages as
        | EdenMessage[]
        | undefined

      if (newMessages && newMessages.length > 0) {
        if (
          threadIdRef.current &&
          websocketMessage.data.thread_id &&
          threadIdRef.current !== websocketMessage.data.thread_id
        ) {
          console.log(
            'Message not for current thread, ignoring!!!!',
            threadIdRef.current,
            websocketMessage.data,
          )
          return
        }

        newMessages.forEach(msg => messageEmitterRef.current.emit(msg))
      }
    }
  }, [websocketMessage])

  const runtime = useEdenRuntime({
    agentId,
    threadId: threadIdRef.current,
    onSwitchToNewThread: async () => {
      abortController.current.abort()
      abortController.current = new AbortController()
      threadIdRef.current = undefined
      window.history.pushState(null, '', `/chat/${agentId}`)
    },
    onSwitchToThread: async newThreadId => {
      setIsLoadingThread(true)
      threadIdRef.current = newThreadId
      window.history.pushState(null, '', `/chat/${agentId}/${newThreadId}`)
      const thread = await getThread(newThreadId)
      setIsLoadingThread(false)
      return {
        messages: thread.messages,
      }
    },
    onRename: async (threadId, newTitle) => {
      console.log('rename', threadId, newTitle)
    },
    stream: async (messages, callback) => {
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

        // If new thread
        if (!threadIdRef.current) {
          threadIdRef.current = sendMessageResponse.data.thread_id as string
          callback &&
            (await callback(sendMessageResponse.data.thread_id as string))
        }

        // Now create our async-iterator with the AbortSignal
        const messageIterable = createAsyncIterableFromEmitter(messageEmitter, {
          timeout: TIMEOUT_DURATION_MS,
          signal: abortController.current.signal,
        })

        try {
          for await (const message of messageIterable) {
            const assistantMessage = message as AssistantMessage
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

  useEffect(() => {
    console.log(threadId, threadIdRef.current)
    if (threadId) {
      runtime.switchToThread(threadId)
    } else {
      runtime.switchToNewThread()
    }
  }, [threadId])

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {isLoadingThread && (
        <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-50 z-10">
          <LoadingIndicator className="w-12 h-12" />
        </div>
      )}
      {children}
    </AssistantRuntimeProvider>
  )
}

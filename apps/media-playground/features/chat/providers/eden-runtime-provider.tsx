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
import { AssistantRuntimeProvider, MessageStatus } from '@assistant-ui/react'
import { AssistantMessage } from '@edenlabs/eden-sdk'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const TIMEOUT_DURATION_MS = 60 * 60 * 1000

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
  const [isStreamActive, setIsStreamActive] = useState(false)

  const { runtime, setIsRunning } = useEdenRuntime({
    agentId,
    threadId: threadIdRef.current,
    onSwitchToNewThread: async () => {
      abortController.current.abort()
      abortController.current = new AbortController()
      threadIdRef.current = undefined
      if (typeof window !== 'undefined')
        window.history.pushState(null, '', `/chat/${agentId}`)
    },
    //@ts-expect-error message status is not typed
    onSwitchToThread: async newThreadId => {
      setIsLoadingThread(true)
      threadIdRef.current = newThreadId
      if (typeof window !== 'undefined')
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
    //@ts-expect-error message status is not typed
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

            console.log('assistantMessage', assistantMessage.status)

            yield {
              data: {
                id: assistantMessage.id,
                role: 'assistant',
                status: assistantMessage.status as MessageStatus,
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
    async function checkThreadStatus() {
      if (!threadId) return

      try {
        const thread = await getThread(threadId)
        // If thread has active items, set up stream listening
        if (thread.active && thread.active.length > 0) {
          console.log('thread.active', thread.active?.length, threadId)

          setIsStreamActive(true)
          // setIsRunning(true)
          threadIdRef.current = threadId
          // Reset abort controller to ensure we have a fresh signal
          abortController.current = new AbortController()
        } else {
          console.log('thread inactive', threadId)
        }
      } catch (error) {
        console.error('Error checking thread status:', error)
      }
    }

    checkThreadStatus()
  }, [threadId])

  useEffect(() => {
    if (websocketMessage && (isStreamActive || threadIdRef.current)) {
      const activeMessageIds = websocketMessage.data.active
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
            'Message not for current thread, ignoring!',
            threadIdRef.current,
            websocketMessage.data,
          )
          return
        }

        newMessages.forEach(msg => messageEmitterRef.current.emit(msg))

        // If this was the last message (has status complete), clear stream active
        const lastMessage = newMessages[newMessages.length - 1]
        console.log('lastMessage', lastMessage)
        // addOrUpdateMessage(lastMessage)
        if (
          lastMessage.status?.type === 'complete' &&
          (!activeMessageIds || !activeMessageIds.length)
        ) {
          console.log('lastMessage:complete - end stream')
          setIsRunning(false)
          setIsStreamActive(false)
        }
      }
    }
  }, [websocketMessage, isStreamActive, setIsRunning])

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

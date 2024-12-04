'use client'

import { getThread, sendMessage } from '@/features/chat/chatApi'
import { EdenMessage } from '@/features/chat/convertEdenMessages'
import { useEdenRuntime } from '@/features/chat/hooks/useEdenRuntime'
import { useWebSocketMessage } from '@/hooks/use-websocket-message'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { AssistantMessage } from '@edenlabs/eden-sdk'
import { ReactNode, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

const agentId = '67170abeb539c335ad24067a'
const TIMEOUT_DURATION_MS = 5 * 60 * 1000

class MessageEmitter {
  private listeners: ((message: EdenMessage) => void)[] = []

  emit(message: EdenMessage) {
    this.listeners.forEach(listener => listener(message))
  }

  on(listener: (message: EdenMessage) => void) {
    this.listeners.push(listener)
    return () => {
      this.off(listener)
    }
  }

  off(listener: (message: EdenMessage) => void) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }
}

function createAsyncIterableFromEmitter(
  emitter: MessageEmitter,
  timeout: number,
): AsyncIterable<EdenMessage> {
  return {
    [Symbol.asyncIterator]() {
      let messageQueue: EdenMessage[] = []
      let resolveNext: ((value: IteratorResult<EdenMessage>) => void) | null =
        null
      let done = false

      const onMessage = (message: EdenMessage) => {
        if (resolveNext) {
          resolveNext({ value: message, done: false })
          resolveNext = null
        } else {
          messageQueue.push(message)
        }
      }

      emitter.on(onMessage)

      const iterator = {
        next(): Promise<IteratorResult<EdenMessage>> {
          if (done) {
            return Promise.resolve({ value: undefined, done: true })
          }
          if (messageQueue.length > 0) {
            const message = messageQueue.shift()!
            return Promise.resolve({ value: message, done: false })
          }
          return new Promise<IteratorResult<EdenMessage>>(resolve => {
            resolveNext = resolve
          })
        },
        return(): Promise<IteratorResult<EdenMessage>> {
          done = true
          emitter.off(onMessage)
          return Promise.resolve({ value: undefined, done: true })
        },
        throw(error: Error): Promise<IteratorResult<EdenMessage>> {
          done = true
          emitter.off(onMessage)
          return Promise.reject(error)
        },
        [Symbol.asyncIterator]() {
          return this
        },
      }

      // Implement timeout logic
      setTimeout(() => {
        done = true
        if (resolveNext) {
          resolveNext({ value: undefined, done: true })
          resolveNext = null
        }
        emitter.off(onMessage)
      }, timeout)

      return iterator
    },
  }
}

export function EdenRuntimeProvider({
  children,
}: Readonly<{
  children: ReactNode
}>) {
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

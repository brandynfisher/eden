'use client'

import { createThread, getThread, sendMessage } from '@/features/chat/chatApi'
import { EdenMessage } from '@/features/chat/convertEdenMessages'
import { useEdenRuntime } from '@/features/chat/hooks/useEdenRuntime'
import { useWebSocketMessage } from '@/hooks/use-websocket-message'
import { JsonMessage } from '@/providers/websocket-provider'
import { AssistantRuntimeProvider, MessageStatus } from '@assistant-ui/react'
import { AssistantMessage } from '@edenlabs/eden-sdk'
import { ReactNode, useEffect, useRef } from 'react'

const agentId = '67170abeb539c335ad24067a'
const TIMEOUT_DURATION_MS = 5 * 60 * 1000 // You can adjust this value or pass it as a prop
const MESSAGE_POLLING_INTERVAL_MS = 500

export function EdenRuntimeProvider({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const threadIdRef = useRef<string | undefined>()
  const abortController = useRef<AbortController>(new AbortController())

  // Use the custom hook to get WebSocket message updates
  const websocketMessage = useWebSocketMessage({
    eventType: 'thread-update',
    abortSignal: abortController.current.signal,
  })

  // Create a ref to store the latest websocket message
  const websocketMessageRef = useRef<JsonMessage | null>(null)

  // Update the ref whenever websocketMessage changes
  useEffect(() => {
    websocketMessageRef.current = websocketMessage
  }, [websocketMessage])

  const runtime = useEdenRuntime({
    threadId: threadIdRef.current,
    onSwitchToNewThread: async () => {
      const { thread_id } = await createThread()
      threadIdRef.current = thread_id
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
        if (!threadIdRef.current) {
          const { thread_id } = await createThread()
          threadIdRef.current = thread_id
        }

        const threadId = threadIdRef.current

        try {
          // Initiate message sending
          yield* sendMessage({
            threadId,
            agentId,
            messages,
            abortSignal: abortController.current.signal,
          })

          const timeoutDuration = TIMEOUT_DURATION_MS
          const pollingInterval = MESSAGE_POLLING_INTERVAL_MS
          const startTime = Date.now()

          while (true) {
            const elapsedTime = Date.now() - startTime

            if (elapsedTime >= timeoutDuration) {
              // Timeout reached, yield error result
              const timeoutMessage: EdenMessage = {
                role: 'assistant',
                status: { type: 'incomplete', reason: 'other' },
                content: `Error: Timeout reached while waiting for a response.`,
              }

              yield {
                data: timeoutMessage,
              }
              break
            }

            if (abortController.current.signal.aborted) {
              // Abort signal received, yield error result
              const cancelMessage: EdenMessage = {
                role: 'assistant',
                status: { type: 'incomplete', reason: 'cancelled' },
                content: `Error: Operation was aborted.`,
              }

              yield {
                data: cancelMessage,
              }
              break
            }

            // Access the latest websocket message from the ref
            const currentMessage = websocketMessageRef.current

            if (currentMessage) {
              const newMessages = currentMessage.data.newMessages as
                | EdenMessage[]
                | undefined
              if (newMessages) {
                if (Array.isArray(newMessages)) {
                  // console.log('edenRuntimeProvider', {newMessages})
                  yield* newMessages.map((msg: EdenMessage) => {
                    // console.log('edenRuntimeProvider - yield newMessage', msg.role, msg.content)

                    if (msg.role === 'tool') {
                      const toolResultMessage: EdenMessage = {
                        role: 'tool',
                        tool_results: msg.tool_results,
                      }
                      return { data: toolResultMessage }
                    } else {
                      const assistantMessage = msg as AssistantMessage
                      const formattedMsg: AssistantMessage & {
                        status: MessageStatus
                      } = {
                        role: 'assistant',
                        status: assistantMessage.tool_calls?.length
                          ? { type: 'incomplete', reason: 'tool-calls' }
                          : { type: 'complete', reason: 'stop' },
                        content: assistantMessage.content,
                        tool_calls: assistantMessage.tool_calls,
                      }

                      return { data: formattedMsg as EdenMessage }
                    }
                  })
                  // console.log('resetting websocketMessageRef', 'old', websocketMessageRef.current )
                  websocketMessageRef.current = null
                  break
                }
              } else {
                throw new Error('no updatedFields.messages found')
              }
              // @todo: don't send full update but rather incremental one and then add all messages
              // @todo: we will need the backend to communicate status type and reason eventually otherwise i have to guess whenever it may be done
              // @todo: alternatively fastify has to produce this based on the thread `busy` flag or something
            }

            await new Promise(resolve => setTimeout(resolve, pollingInterval))
          }
        } catch (error) {
          const errorMessage = {
            role: 'assistant',
            status: { type: 'incomplete', reason: 'error' },
            content: `Error: ${(error as { message: string }).message}`,
          }
          yield {
            data: errorMessage,
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

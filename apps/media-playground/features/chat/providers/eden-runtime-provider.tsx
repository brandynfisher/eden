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
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ReadyState } from 'react-use-websocket'
import { v4 as uuidv4 } from 'uuid'

const TIMEOUT_DURATION_MS = 60 * 60 * 1000

const LoadingOverlay = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
      <LoadingIndicator className="w-12 h-12" />
    </div>
  )
}

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
  const [isClientMounted, setIsClientMounted] = useState(false)
  const threadIdRef = useRef<string | undefined>(undefined)
  const abortController = useRef<AbortController>(new AbortController())
  const messageEmitterRef = useRef(new MessageEmitter())

  const { message: websocketMessage, readyState } = useWebSocketMessage({
    eventType: 'thread-update',
    abortSignal: abortController.current.signal,
  })

  const [isStreamActive, setIsStreamActive] = useState(false)
  const [wasDisconnected, setWasDisconnected] = useState(false)

  const { runtime, setIsRunning, setMessages, addOrUpdateMessage } =
    useEdenRuntime({
      agentId,
      threadId: threadIdRef.current,
      onSwitchToNewThread: async () => {
        setIsLoadingThread(true)
        // abortController.current.abort()
        // abortController.current = new AbortController()
        threadIdRef.current = undefined
        if (typeof window !== 'undefined')
          window.history.pushState(null, '', `/chat/${agentId}`)
        setIsLoadingThread(false)
      },
      onSwitchToThread: async newThreadId => {
        console.log('onSwitchToThread', newThreadId)
        setIsLoadingThread(true)
        // abortController.current.abort()
        // abortController.current = new AbortController()
        messageEmitterRef.current = new MessageEmitter()

        try {
          threadIdRef.current = newThreadId
          const threadFetch = await getThread(newThreadId)

          if (typeof window !== 'undefined')
            window.history.pushState(
              null,
              '',
              `/chat/${agentId}/${newThreadId}`,
            )

          // if (threadFetch.active && threadFetch.active.length > 0) {
          //   setIsStreamActive(true)
          // } else {
          //   setIsStreamActive(false)
          //   setIsRunning(false)
          // }
          checkThreadStatus()
          return {
            messages: (threadFetch?.messages as EdenMessage[]) ?? [],
          }
        } catch (error) {
          console.error('Error switching thread:', error)
          return { messages: [] }
        } finally {
          setIsLoadingThread(false)
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
          const messageIterable = createAsyncIterableFromEmitter(
            messageEmitter,
            {
              timeout: TIMEOUT_DURATION_MS,
              signal: abortController.current.signal,
            },
          )

          try {
            for await (const message of messageIterable) {
              const assistantMessage = message as AssistantMessage

              console.log('assistantMessage', assistantMessage)

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

  // Update thread state when thread data changes
  // useEffect(() => {
  //   if (!threadIdRef) return

  //   if (thread.active && thread.active.length > 0) {
  //     setIsStreamActive(true)
  //   } else {
  //     setIsStreamActive(false)
  //     setIsRunning(false)
  //   }
  // }, [threadIdRef, setIsRunning])

  // Add back checkThreadStatus for reconnection handling
  const checkThreadStatus = useCallback(async () => {
    if (!threadIdRef.current) return
    console.log('checkThreadStatus', threadIdRef.current)
    try {
      const thread = await getThread(threadIdRef.current)
      console.log('thread', thread)
      if (!thread) return

      // Reset message emitter when reconnecting
      if (wasDisconnected) {
        messageEmitterRef.current = new MessageEmitter()
      }

      // Update messages and ensure they're properly converted
      if (thread.messages) {
        console.log(
          'thread.messages',
          thread.messages[thread.messages.length - 1],
        )
        setMessages(thread.messages as EdenMessage[])
      }

      // Check if thread has active messages
      const hasActiveMessages = thread.active && thread.active.length > 0
      console.log(
        'hasActiveMessages',
        hasActiveMessages,
        thread.active,
        thread.active?.length,
      )
      setIsStreamActive(hasActiveMessages ?? false)
      setIsRunning(hasActiveMessages ?? false)

      // if (hasActiveMessages) {
      //   abortController.current = new AbortController()
      // }
    } catch (error) {
      console.error('Error checking thread status:', error)
    }
  }, [wasDisconnected, setMessages, setIsRunning])

  // Simplified initial load and thread switching
  useEffect(() => {
    const loadThread = async () => {
      if (!threadId && !threadIdRef.current) {
        return
      }

      // Only proceed if thread ID has changed
      if (threadId === threadIdRef.current) return

      try {
        setIsLoadingThread(true)
        threadIdRef.current = threadId

        if (threadIdRef.current) {
          runtime.switchToThread(threadIdRef.current)
          await checkThreadStatus()
        }
      } catch (error) {
        console.error('Error loading thread:', error)
      } finally {
        setIsLoadingThread(false)
      }
    }

    loadThread()
  }, [threadId, runtime, checkThreadStatus])

  // Connection monitoring effect remains the same but uses the restored checkThreadStatus
  useEffect(() => {
    const handleOnline = () => {
      if (wasDisconnected) {
        checkThreadStatus()
        setWasDisconnected(false)
      }
    }

    const handleOffline = () => {
      setWasDisconnected(true)
    }

    // Check WebSocket state
    if (readyState === ReadyState.CLOSED || readyState === ReadyState.CLOSING) {
      setWasDisconnected(true)
    } else if (wasDisconnected && readyState === ReadyState.OPEN) {
      checkThreadStatus()
      setWasDisconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (!navigator.onLine) {
      setWasDisconnected(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [readyState, wasDisconnected, checkThreadStatus])

  useEffect(() => {
    if (!websocketMessage || (!isStreamActive && !threadIdRef.current)) return

    const {
      thread_id,
      active: activeMessageIds,
      newMessages,
    } = websocketMessage.data

    if (!newMessages?.length) return

    // Verify message belongs to current thread
    if (threadIdRef.current && thread_id && threadIdRef.current !== thread_id) {
      console.log('Message not for current thread, ignoring!')
      return
    }

    // Process new messages
    newMessages.forEach(msg => {
      messageEmitterRef.current.emit(msg)
      addOrUpdateMessage(msg)
    })

    // Check if stream should be ended
    const lastMessage = newMessages[newMessages.length - 1]
    if (lastMessage.status?.type === 'complete' && !activeMessageIds?.length) {
      console.log('Stream complete - ending stream')
      setIsRunning(false)
      setIsStreamActive(false)
    }
  }, [websocketMessage, isStreamActive, setIsRunning, addOrUpdateMessage])

  useEffect(() => {
    setIsClientMounted(true)
  }, [])

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {isClientMounted && isLoadingThread && <LoadingOverlay />}
      {children}
    </AssistantRuntimeProvider>
  )
}

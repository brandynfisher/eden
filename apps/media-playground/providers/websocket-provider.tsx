'use client'

import { EdenMessage } from '@/features/sessions/components/eden-message-converter'
import {
  ReadyState,
  useSharedWebSocketWorker,
} from '@/hooks/use-shared-websocket-worker'
import { useWebSocketAuth } from '@/hooks/use-websocket-auth'
import { TaskV2, Thread } from '@edenlabs/eden-sdk'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type GenericObject = {
  [key: string]: string | boolean | number | GenericObject[]
}

export type JsonMessage = {
  event: string
  data: {
    task?: TaskV2
    thread?: Thread
    active?: string[]
    newMessages?: EdenMessage[]
  } & GenericObject
}

interface WorkerMessage {
  type: string
  readyState?: number
  data?: unknown
  error?: unknown
}

interface WorkerSendMessage {
  type: 'send'
  event?: string
  data: unknown
}

type WebSocketState = {
  sendJsonMessage: (message: unknown) => void
  sendMessage: (message: string) => void
  lastMessage?: WorkerMessage | null
  lastMessageJson?: JsonMessage | null
  readyState: ReadyState
  isAttemptingReconnect: boolean
}

const initialState: WebSocketState = {
  sendJsonMessage: () => undefined,
  sendMessage: () => undefined,
  lastMessage: null,
  lastMessageJson: null,
  readyState: ReadyState.UNINSTANTIATED,
  isAttemptingReconnect: false,
}

const WebSocketContext = createContext<WebSocketState>(initialState)
export const useWebSocketContext = () => useContext(WebSocketContext)

type Props = {
  endpoint: string
} & React.PropsWithChildren

export const WebSocketProvider = ({ endpoint, children }: Props) => {
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null)

  const {
    readyState,
    lastMessage: lastWorkerMessage,
    sendMessage: sendWorkerMessage,
    isAttemptingReconnect,
  } = useSharedWebSocketWorker(activeEndpoint)

  const sendAuthMessageToWorker = useCallback(
    (authData: { event: string; data: { userId: string; token: string } }) => {
      if (authData?.event === 'auth') {
        sendWorkerMessage({ type: 'auth', data: authData.data })
      } else {
        console.warn(
          'Provider received non-auth message for auth callback:',
          authData,
        )
      }
    },
    [sendWorkerMessage],
  )

  const { isSignedIn } = useWebSocketAuth(sendAuthMessageToWorker)

  useEffect(() => {
    setActiveEndpoint(isSignedIn ? endpoint : null)
  }, [isSignedIn, endpoint])

  const [lastMessageJson, setLastMessageJson] = useState<JsonMessage | null>(
    null,
  )

  useEffect(() => {
    if (lastWorkerMessage?.type === 'message' && lastWorkerMessage.data) {
      try {
        const parsed = JSON.parse(lastWorkerMessage.data as string)
        setLastMessageJson(parsed)
      } catch (error) {
        console.error(
          'Failed to parse WebSocket message from worker:',
          error,
          'Data:',
          lastWorkerMessage.data,
        )
        setLastMessageJson(null)
      }
    } else {
      setLastMessageJson(null)
    }
  }, [lastWorkerMessage])

  const sendMessage = useCallback(
    (message: string) => {
      sendWorkerMessage({
        type: 'send',
        event: 'message',
        data: { message },
      } satisfies WorkerSendMessage)
    },
    [sendWorkerMessage],
  )

  const sendJsonMessage = useCallback(
    (message: unknown) => {
      if (
        typeof message === 'object' &&
        message !== null &&
        'event' in message
      ) {
        sendWorkerMessage({
          type: 'send',
          event: (message as { event: string }).event,
          data: message,
        } satisfies WorkerSendMessage)
      } else {
        console.warn('Sending message without event field:', message)
        sendWorkerMessage({
          type: 'send',
          event: 'message',
          data: message,
        } satisfies WorkerSendMessage)
      }
    },
    [sendWorkerMessage],
  )

  const contextValue = useMemo(
    () => ({
      sendJsonMessage,
      sendMessage,
      lastMessage: lastWorkerMessage,
      lastMessageJson,
      readyState,
      isAttemptingReconnect,
    }),
    [
      lastWorkerMessage,
      lastMessageJson,
      readyState,
      isAttemptingReconnect,
      sendJsonMessage,
      sendMessage,
    ],
  )

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

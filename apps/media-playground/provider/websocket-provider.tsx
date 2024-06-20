'use client'

import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

type JsonMessage = {
  event: string
  data: { [key: string]: string }
}

type WebSocketMessageEvent = {
  data: string
  type: string
  target: WebSocket
}

type WebSocketState = {
  sendJsonMessage: (message: JsonMessage) => void
  sendMessage: (message: string) => void
  lastMessage?: WebSocketMessageEvent
  readyState: ReadyState
  messageHistory?: WebSocketMessageEvent[]
}

const initialState: WebSocketState = {
  sendJsonMessage: () => undefined,
  sendMessage: () => undefined,
  lastMessage: undefined,
  readyState: ReadyState.CONNECTING,
  messageHistory: [],
}

type Props = {
  endpoint: string
} & PropsWithChildren

const WebSocketContext = createContext<WebSocketState>(initialState)
export const useWebSocketContext = () => useContext(WebSocketContext)
export const WebSocketProvider = ({ endpoint, children }: Props) => {
  const [messageHistory, setMessageHistory] = useState<WebSocketMessageEvent[]>(
    [],
  )

  const { sendMessage, sendJsonMessage, lastMessage, readyState } =
    useWebSocket(endpoint, {
      onOpen: event => console.log('ws - onOpen', event),
      onClose: event => console.log('ws - onClose', event),
      onError: event => console.log('ws - onError', event),
      onMessage: event => console.log('ws - onMessage', event),
      shouldReconnect: event => {
        console.log('ws - shouldReconnect', event)
        return true
      },
      share: true,
    })

  useEffect(() => {
    console.log('ws - useEffect - lastMessage', lastMessage)
    if (lastMessage) {
      setMessageHistory(prev => [
        ...prev,
        lastMessage as unknown as WebSocketMessageEvent,
      ])
    }
  }, [lastMessage])

  return (
    <WebSocketContext.Provider
      value={{
        sendJsonMessage,
        sendMessage,
        lastMessage: lastMessage as unknown as WebSocketMessageEvent,
        readyState,
        messageHistory,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

'use client'

import { useAuth } from '@clerk/nextjs'
import { TaskV2 } from '@edenlabs/eden-sdk'
import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

export type GenericObject = {
  [key: string]: string | boolean | number
}

type JsonMessage = {
  event: string
  data:
    | {
        task?: TaskV2
      }
    | GenericObject
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
  lastMessageJson?: JsonMessage | null
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
  const [shouldConnect, setShouldConnect] = useState<boolean>(false)
  const [currentAuthToken, setCurrentAuthToken] = useState<string | null>()

  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const { sendMessage, sendJsonMessage, lastMessage, readyState } =
    useWebSocket(
      endpoint,
      {
        // onOpen: event => {
        //   console.log('ws - onOpen', event)
        // },
        onClose: event => console.log('ws - onClose', event),
        onError: event => console.log('ws - onError', event),
        // onMessage: event => console.log('ws - onMessage', event),
        shouldReconnect: event => {
          console.log('ws - shouldReconnect', isSignedIn, event)
          return !!isSignedIn
        },
        share: true,
      },
      shouldConnect,
    )

  const refreshToken = useCallback(async () => {
    const newToken = await getToken()
    if (newToken) {
      setCurrentAuthToken(prev =>
        newToken && newToken !== prev ? newToken : prev,
      )
    }
  }, [getToken, setCurrentAuthToken])

  const sendAuthMessage = useCallback(() => {
    if (!currentAuthToken) {
      return
    }

    sendJsonMessage({
      event: 'auth',
      data: {
        userId,
        token: currentAuthToken,
      },
    })
  }, [userId, sendJsonMessage, currentAuthToken])

  useEffect(() => {
    if (isLoaded) {
      setShouldConnect(!!isSignedIn)
    }
  }, [isLoaded, isSignedIn])

  useEffect(() => {
    let timerId: ReturnType<typeof setInterval>

    if (readyState === ReadyState.OPEN) {
      // console.log('WS::OPEN')
      refreshToken()

      timerId = setInterval(() => refreshToken(), 25000)
    }

    return () => {
      if (timerId) {
        clearInterval(timerId)
      }
    }
  }, [readyState, refreshToken])

  useEffect(() => {
    sendAuthMessage()
  }, [sendAuthMessage])

  const [lastMessageJson, setLastMessageJson] = useState(null)
  useEffect(() => {
    if (!lastMessage || !lastMessage.data) {
      return
    }

    const jsonData = JSON.parse(lastMessage.data)
    setLastMessageJson(jsonData)
  }, [lastMessage])

  return (
    <WebSocketContext.Provider
      value={{
        sendJsonMessage,
        sendMessage,
        lastMessage: lastMessage as unknown as WebSocketMessageEvent,
        lastMessageJson,
        readyState,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

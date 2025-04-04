import { useCallback, useEffect, useRef, useState } from 'react'
import { ReadyState } from 'react-use-websocket'
import useWebSocket from 'react-use-websocket'

type WebSocketConnection = WebSocket | null

interface WebSocketMessage extends MessageEvent {
  wsEndpoint?: string
}

// Singleton pattern for shared connection state
class ConnectionManager {
  private static instance: ConnectionManager
  private connections = new Map<string, WebSocketConnection>()
  private listeners = new Map<string, Set<(event: WebSocketMessage) => void>>()

  private constructor() {}

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  addListener(endpoint: string, callback: (event: WebSocketMessage) => void) {
    if (!this.listeners.has(endpoint)) {
      this.listeners.set(endpoint, new Set())
    }
    this.listeners.get(endpoint)!.add(callback)
  }

  removeListener(
    endpoint: string,
    callback: (event: WebSocketMessage) => void,
  ) {
    this.listeners.get(endpoint)?.delete(callback)
  }

  broadcast(endpoint: string, event: MessageEvent) {
    const wsMessage: WebSocketMessage = Object.assign(event, {
      wsEndpoint: endpoint,
    })
    this.listeners.get(endpoint)?.forEach(callback => callback(wsMessage))
  }

  hasConnection(endpoint: string): boolean {
    return this.connections.has(endpoint)
  }

  getConnection(endpoint: string): WebSocketConnection {
    return this.connections.get(endpoint) || null
  }

  setConnection(endpoint: string, ws: WebSocketConnection) {
    if (ws) {
      this.connections.set(endpoint, ws)
    }
  }

  removeConnection(endpoint: string) {
    this.connections.delete(endpoint)
  }
}

export const useWebSocketConnection = (
  endpoint: string,
  shouldConnect: boolean,
  onMessage?: (event: MessageEvent) => void,
) => {
  const manager = useRef(ConnectionManager.getInstance())
  const [readyState, setReadyState] = useState<ReadyState>(
    ReadyState.CONNECTING,
  )
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null)

  // Use react-use-websocket for the actual WebSocket connection
  const {
    sendMessage: wssSendMessage,
    sendJsonMessage: wssSendJsonMessage,
    lastMessage: wssLastMessage,
    readyState: wssReadyState,
    getWebSocket: wssGetWebSocket,
  } = useWebSocket(
    endpoint,
    {
      shouldReconnect: closeEvent => {
        return shouldConnect && closeEvent.code !== 1000
      },
      retryOnError: true,
      share: true, // Enable connection sharing within the same window
      onMessage: event => {
        // Broadcast to other tabs through the manager
        manager.current.broadcast(endpoint, event)
        // Handle the message in this tab
        setLastMessage(event)
        onMessage?.(event)
      },
      onOpen: () => {
        setReadyState(ReadyState.OPEN)
        manager.current.setConnection(
          endpoint,
          wssGetWebSocket() as WebSocketConnection,
        )
      },
      onClose: () => {
        setReadyState(ReadyState.CLOSED)
        manager.current.removeConnection(endpoint)
      },
      onError: () => {
        setReadyState(ReadyState.CLOSED)
        manager.current.removeConnection(endpoint)
      },
    },
    shouldConnect,
  )

  // Listen for broadcasts from other tabs
  useEffect(() => {
    if (!shouldConnect) return

    const handleBroadcast = (event: MessageEvent) => {
      if (event !== wssLastMessage) {
        setLastMessage(event)
        onMessage?.(event)
      }
    }

    manager.current.addListener(endpoint, handleBroadcast)

    return () => {
      manager.current.removeListener(endpoint, handleBroadcast)
    }
  }, [endpoint, shouldConnect, onMessage, wssLastMessage])

  // Sync state with the shared connection
  useEffect(() => {
    setReadyState(wssReadyState)
  }, [wssReadyState])

  const sendMessage = useCallback(
    (message: string) => {
      wssSendMessage(message)
    },
    [wssSendMessage],
  )

  const sendJsonMessage = useCallback(
    (message: unknown) => {
      wssSendJsonMessage(message)
    },
    [wssSendJsonMessage],
  )

  const getWebSocket = useCallback(() => {
    return wssGetWebSocket()
  }, [wssGetWebSocket])

  return {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    readyState,
    getWebSocket,
  }
}

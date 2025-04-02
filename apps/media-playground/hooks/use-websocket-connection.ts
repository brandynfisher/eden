import { useCallback, useEffect, useRef, useState } from 'react'
import useWebSocket from 'react-use-websocket'

export const useWebSocketConnection = (
  endpoint: string,
  shouldConnect: boolean,
  onMessage?: (event: MessageEvent) => void,
) => {
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const lastReconnectAttemptRef = useRef<number>(0)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval>>()
  const lastPongRef = useRef<number>(Date.now())
  const maxBackoff = 30000 // Maximum backoff of 30 seconds
  const [forceReconnect, setForceReconnect] = useState(false)

  // Calculate exponential backoff with jitter
  const getBackoffTime = useCallback((attempt: number) => {
    const baseDelay = Math.min(1000 * Math.pow(2, attempt), maxBackoff)
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    return baseDelay + jitter
  }, [])

  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(
    endpoint,
    {
      onOpen: () => {
        console.log('WebSocket connected')
        // Reset reconnection attempt counter on successful connection
        lastReconnectAttemptRef.current = 0

        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }
        pingIntervalRef.current = setInterval(() => {
          sendJsonMessage({ event: 'ping', ts: Date.now() })

          // Check if we haven't received a pong in 90 seconds
          if (Date.now() - lastPongRef.current > 90000) {
            // console.log('No pong received in 90s, closing connection')
            setForceReconnect(prev => !prev) // Toggle to force a reconnect
          }
        }, 30000)
      },
      onClose: e => {
        console.log('WebSocket closed', e)
        // Clear any existing reconnect timeout and ping interval
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }
      },
      onError: e => {
        console.error('WebSocket error', e)
        // Increment reconnection attempt counter
        lastReconnectAttemptRef.current += 1
      },
      onMessage: event => {
        try {
          const data = JSON.parse(event.data)
          if (data.event === 'pong') {
            // console.log('pong received')
            lastPongRef.current = Date.now()
          }
        } catch (e) {
          // Ignore parse errors for non-JSON messages
        }

        if (onMessage) {
          onMessage(event)
        }
      },
      shouldReconnect: closeEvent => {
        // Don't reconnect on clean closes (code 1000) or if shouldConnect is false
        if (closeEvent.code === 1000 || !shouldConnect) return false
        return true
      },
      reconnectInterval: (attemptNumber: number) =>
        getBackoffTime(attemptNumber),
      retryOnError: true,
      share: true,
    },
    shouldConnect || forceReconnect, // Add forceReconnect to the dependencies
  )

  // Cleanup on unmount
  useEffect(() => {
    const currentReconnectTimeout = reconnectTimeoutRef.current
    const currentPingInterval = pingIntervalRef.current

    return () => {
      if (currentReconnectTimeout) {
        clearTimeout(currentReconnectTimeout)
      }
      if (currentPingInterval) {
        clearInterval(currentPingInterval)
      }
    }
  }, [])

  // If the message is a pong, return null instead
  const processedLastMessage =
    lastMessage &&
    (() => {
      try {
        // console.log('lastMessage', lastMessage)
        const data = JSON.parse(lastMessage.data)
        return data.event === 'pong' ? null : lastMessage
      } catch (e) {
        return null
      }
    })()

  return {
    sendMessage,
    sendJsonMessage,
    lastMessage: processedLastMessage,
    readyState,
    getWebSocket,
  }
}

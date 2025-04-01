import { useCallback, useEffect, useRef } from 'react'
import useWebSocket from 'react-use-websocket'

export const useWebSocketConnection = (
  endpoint: string,
  shouldConnect: boolean,
  onMessage?: (event: MessageEvent) => void,
) => {
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const lastReconnectAttemptRef = useRef<number>(0)
  const maxBackoff = 30000 // Maximum backoff of 30 seconds

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
      },
      onClose: e => {
        console.log('WebSocket closed', e)
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      },
      onError: e => {
        console.error('WebSocket error', e)
        // Increment reconnection attempt counter
        lastReconnectAttemptRef.current = lastReconnectAttemptRef.current + 1
      },
      onMessage: event => {
        if (onMessage) {
          onMessage(event)
        }
      },
      shouldReconnect: closeEvent => {
        // Don't reconnect on clean closes (code 1000) or if shouldConnect is false
        if (closeEvent.code === 1000 || !shouldConnect) return false

        // Schedule reconnect with exponential backoff
        const backoff = getBackoffTime(lastReconnectAttemptRef.current)
        console.log(`Scheduling reconnect in ${backoff}ms`)
        reconnectTimeoutRef.current = setTimeout(() => {
          // Additional check before attempting reconnect
          if (shouldConnect) {
            return true
          }
          return false
        }, backoff)

        return true
      },
      reconnectInterval: (attemptNumber: number) =>
        getBackoffTime(attemptNumber),
      retryOnError: true,
      heartbeat: {
        message: () => JSON.stringify({ event: 'ping', ts: Date.now() }),
        interval: 30000, // Send heartbeat every 30 seconds
        timeout: 90000, // Consider connection dead after 90 seconds of no response
        returnMessage: JSON.stringify({ event: 'pong' }),
      },
      share: true,
    },
    shouldConnect,
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // If the message is a pong, return null instead
  const processedLastMessage =
    lastMessage &&
    (() => {
      try {
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

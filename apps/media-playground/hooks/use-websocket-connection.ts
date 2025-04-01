import useWebSocket from 'react-use-websocket'

export const useWebSocketConnection = (
  endpoint: string,
  shouldConnect: boolean,
  onMessage?: (event: MessageEvent) => void,
) => {
  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    readyState,
    getWebSocket,
    // messageHistory,
  } = useWebSocket(
    endpoint,
    {
      onOpen: () => console.log('WebSocket connected'),
      onReconnectStop: () => console.log('WebSocket onReconnectStop'),
      onClose: e => console.log('WebSocket closed', e),
      onError: e => console.error('WebSocket error', e),
      onMessage: event => {
        // Handle custom onMessage if provided
        if (onMessage) {
          onMessage(event)
        }
      },
      reconnectAttempts: Infinity,
      reconnectInterval: 3000, // Try to reconnect every 3 seconds
      retryOnError: true,
      shouldReconnect: closeEvent => {
        // Don't reconnect on clean closes (code 1000)
        if (closeEvent.code === 1000) return false
        return shouldConnect
      },
      heartbeat: {
        message: () => JSON.stringify({ event: 'ping', ts: Date.now() }),
        interval: 60000, // Send heartbeat every minute
        timeout: 180000, // Consider connection dead after 3 minutes of no response
        returnMessage: JSON.stringify({ event: 'pong' }), // Match the expected response format
      },
      share: true,
    },
    shouldConnect,
  )

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
    // messageHistory,
  }
}

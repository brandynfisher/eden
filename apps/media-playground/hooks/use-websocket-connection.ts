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
      onMessage: onMessage ? event => onMessage(event) : undefined,
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
        interval: 30000, // Send heartbeat every 30 seconds
        timeout: 60000, // Consider connection dead after 60 seconds of no response
        returnMessage: 'pong',
      },
      share: true,
      filter: message => {
        // Filter out heartbeat responses
        if (message.data === 'pong') return false
        return true
      },
    },
    shouldConnect,
  )

  return {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    readyState,
    getWebSocket,
    // messageHistory,
  }
}

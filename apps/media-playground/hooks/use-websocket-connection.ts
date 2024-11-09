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
      onClose: e => console.log('WebSocket closed', e),
      onError: e => console.error('WebSocket error', e),
      onMessage: onMessage ? event => onMessage(event) : undefined,
      shouldReconnect: () => shouldConnect,
      share: true,
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

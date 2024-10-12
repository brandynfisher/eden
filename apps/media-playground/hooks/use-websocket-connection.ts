import useWebSocket from 'react-use-websocket'

export const useWebSocketConnection = (
  endpoint: string,
  shouldConnect: boolean,
) => {
  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    readyState,
    // messageHistory,
  } = useWebSocket(
    endpoint,
    {
      onOpen: () => console.log('WebSocket connected'),
      onClose: e => console.log('WebSocket closed', e),
      onError: e => console.error('WebSocket error', e),
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
    // messageHistory,
  }
}

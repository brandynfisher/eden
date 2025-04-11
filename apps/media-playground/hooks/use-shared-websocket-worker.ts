import { useCallback, useEffect, useRef, useState } from 'react'

// Re-export ReadyState for consistency with react-use-websocket if needed elsewhere
// Alternatively, define your own enum/constants
export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
  UNINSTANTIATED = -1,
}

interface WorkerMessage {
  type: string
  readyState?: number
  data?: unknown
  error?: unknown
  message?: string
  timestamp?: string
}

// Define the types for messages sent TO the worker
interface ConnectMessage {
  type: 'connect'
  endpoint: string
}

interface DisconnectMessage {
  type: 'disconnect'
}

interface SendMessage {
  type: 'send'
  event?: string
  data: unknown
}

interface AuthMessage {
  type: 'auth'
  data: unknown
}

type MessageToWorker =
  | ConnectMessage
  | DisconnectMessage
  | SendMessage
  | AuthMessage

const WORKER_PATH = '/workers/websocket.worker.js' // Adjust if your build process changes the path/extension

// The worker path is handled by Turbopack's asset handling
function getWorkerUrl() {
  const version = Date.now() // Add timestamp to prevent caching
  return `${WORKER_PATH}?v=${version}`
}

export function useSharedWebSocketWorker(endpoint: string | null) {
  const [readyState, setReadyState] = useState<ReadyState>(
    ReadyState.UNINSTANTIATED,
  )
  const [lastMessage, setLastMessage] = useState<WorkerMessage | null>(null)
  const workerRef = useRef<SharedWorker | null>(null)
  const portRef = useRef<MessagePort | null>(null)
  const lastAuthMessageRef = useRef<AuthMessage | null>(null)
  const lastAuthSentTimeRef = useRef<number>(0)

  // Add a function to safely post messages
  const safePostMessage = useCallback(
    (port: MessagePort, message: MessageToWorker) => {
      try {
        port.postMessage(message)
        console.log('Successfully sent message to worker:', message)
        return true
      } catch (error) {
        console.error('Failed to send message to worker:', error)
        return false
      }
    },
    [],
  )

  useEffect(() => {
    if (!endpoint) {
      // If no endpoint, disconnect if we have a port
      if (portRef.current) {
        safePostMessage(portRef.current, { type: 'disconnect' })
        try {
          portRef.current.close()
        } catch (error) {
          console.error('Error closing port:', error)
        }
        portRef.current = null
        workerRef.current = null
        setReadyState(ReadyState.CLOSED)
      }
      return
    }

    // Prevent creating multiple workers/ports from the same hook instance
    if (workerRef.current && portRef.current) {
      // If endpoint changes, send connect message with new endpoint
      safePostMessage(portRef.current, { type: 'connect', endpoint })
      setReadyState(ReadyState.CONNECTING)
      return
    }

    let worker: SharedWorker | null = null
    let port: MessagePort | null = null

    try {
      const workerUrl = getWorkerUrl()
      console.log(`Initializing SharedWorker: ${workerUrl}`)

      // Create worker with error handling
      worker = new SharedWorker(workerUrl, {
        name: 'websocket-worker',
        credentials: 'same-origin',
        type: 'classic', // Explicitly set type to classic for better DevTools support
      })

      // Force worker to be kept alive
      worker.port.start()
      console.log('SharedWorker created successfully:', {
        url: workerUrl,
      })

      // Set up port communication
      port = worker.port
      console.log('Port reference obtained')

      // Set up error handlers first
      worker.onerror = error => {
        console.error('SharedWorker Error:', error)
        setReadyState(ReadyState.CLOSED)
      }

      worker.addEventListener('error', event => {
        console.error('SharedWorker addEventListener Error:', event)
        event.preventDefault()
      })

      port.onmessageerror = error => {
        console.error('Worker port message error:', error)
        setReadyState(ReadyState.CLOSED)
      }

      // Set up message handling
      port.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const message = event.data
        console.log('Raw message from worker:', message)

        if (message.type === 'debug') {
          console.log(
            `[Worker Debug ${message.timestamp}]`,
            message.message,
            message.data,
          )
          return
        }

        if (message.type === 'status') {
          const newState = message.readyState ?? ReadyState.CLOSED
          console.log('Setting new ready state:', newState)
          setReadyState(newState)

          // If connection just opened and we have a pending auth message, send it
          if (newState === ReadyState.OPEN && lastAuthMessageRef.current) {
            console.log('Connection opened, sending pending auth message')
            safePostMessage(port!, lastAuthMessageRef.current)
          }
        } else if (message.type === 'message') {
          setLastMessage(message)
        } else if (message.type === 'error') {
          console.error('WebSocket Worker Error:', message.error)
          setReadyState(ReadyState.CLOSED)
        }
      }

      // Start the port
      console.log('Starting port')
      port.start()
      console.log('Port started successfully')

      // Store references
      workerRef.current = worker
      portRef.current = port

      // Start the connection process in the worker
      console.log('Sending initial connect message')
      safePostMessage(port, { type: 'connect', endpoint })
      setReadyState(ReadyState.CONNECTING)
    } catch (error) {
      console.error('Failed to initialize SharedWorker:', error)
      if (port) {
        try {
          port.close()
        } catch (closeError) {
          console.error('Error closing port:', closeError)
        }
      }
      setReadyState(ReadyState.CLOSED)
      throw error // Re-throw to trigger error boundary
    }

    // Cleanup function
    return () => {
      if (portRef.current) {
        console.log('Cleanup: Closing worker port')
        safePostMessage(portRef.current, { type: 'disconnect' })
        try {
          portRef.current.close()
        } catch (error) {
          console.error('Error closing port during cleanup:', error)
        }
        portRef.current = null
      }
      setReadyState(ReadyState.CLOSED)
    }
  }, [endpoint, safePostMessage])

  const sendMessage = useCallback(
    (message: MessageToWorker) => {
      if (!portRef.current) {
        console.warn('Cannot send message, port is not available')
        return
      }

      // Handle auth messages with debouncing
      if (message.type === 'auth') {
        const now = Date.now()
        // Only store and send if it's been more than 1 second since the last auth message
        if (now - lastAuthSentTimeRef.current > 1000) {
          lastAuthMessageRef.current = message
          lastAuthSentTimeRef.current = now
          console.log('Storing new auth message and sending')
          safePostMessage(portRef.current, message)
        } else {
          console.log('Skipping duplicate auth message (sent too recently)')
        }
        return
      }

      if (readyState === ReadyState.OPEN) {
        console.log('Sending message to worker:', message)
        safePostMessage(portRef.current, message)
      } else {
        console.warn(
          'Cannot send message, WebSocket is not open',
          'ReadyState:',
          readyState,
          'Message:',
          message,
        )
      }
    },
    [readyState, safePostMessage],
  )

  return { readyState, lastMessage, sendMessage }
}

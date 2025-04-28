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
  version?: string
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

interface VersionCheckMessage {
  type: 'version_check'
}

type MessageToWorker =
  | ConnectMessage
  | DisconnectMessage
  | SendMessage
  | AuthMessage
  | VersionCheckMessage

const WORKER_PATH = '/workers/websocket.worker.js'
const WORKER_VERSION = '1.1' // Must match version in websocket.worker.js
const VERSION_CHECK_TIMEOUT = 2000 // 2 seconds timeout for version check

// The worker path is handled by Turbopack's asset handling
function getWorkerUrl() {
  // Only use the version, no timestamp to ensure sharing between tabs
  return `${WORKER_PATH}?v=${WORKER_VERSION}`
}

// Check if SharedWorker is supported
const isSharedWorkerSupported = typeof SharedWorker !== 'undefined'

// Function to terminate all shared workers with our name
async function terminateSharedWorkers() {
  if (!navigator.serviceWorker) return

  // First try to use the debug API
  // @ts-ignore - debug API types not available
  if (typeof navigator.serviceWorker.getRegistrations === 'function') {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      if (
        registration.active &&
        registration.active.scriptURL.includes(WORKER_PATH)
      ) {
        await registration.unregister()
      }
    }
  }

  // We don't need the temporary worker approach anymore since it was causing
  // unnecessary worker creation
}

class DirectWebSocketConnection {
  private ws: WebSocket | null = null
  private endpoint: string | null = null
  private messageHandler: ((msg: WorkerMessage) => void) | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private lastPongTime: number = Date.now()
  private onReconnectAttemptChange: (isAttempting: boolean) => void = () => {}

  constructor(
    onMessage: (msg: WorkerMessage) => void,
    onReconnectAttemptChange: (isAttempting: boolean) => void,
  ) {
    this.messageHandler = onMessage
    this.onReconnectAttemptChange = onReconnectAttemptChange
  }

  connect(endpoint: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('DirectWebSocket: Already connected')
      return
    }

    this.endpoint = endpoint
    this.cleanup()

    console.log('DirectWebSocket: Creating new connection', { endpoint })
    this.ws = new WebSocket(endpoint)

    this.ws.onopen = () => {
      console.log('DirectWebSocket: Connection opened')
      this.onReconnectAttemptChange(false)
      this.messageHandler?.({
        type: 'status',
        readyState: WebSocket.OPEN,
      })

      // Setup ping interval
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ event: 'ping', ts: Date.now() }))
          if (Date.now() - this.lastPongTime > 90000) {
            console.log('DirectWebSocket: Pong timeout, reconnecting')
            this.reconnect()
          }
        }
      }, 30000)
    }

    this.ws.onclose = () => {
      console.log('DirectWebSocket: Connection closed')
      this.messageHandler?.({
        type: 'status',
        readyState: WebSocket.CLOSED,
      })
      this.cleanup()
      this.scheduleReconnect()
    }

    this.ws.onerror = error => {
      console.error('DirectWebSocket: Connection error', error)
      this.onReconnectAttemptChange(false)
      this.messageHandler?.({
        type: 'error',
        error,
      })
      this.cleanup()
      this.scheduleReconnect()
    }

    this.ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)
        if (data.event === 'pong') {
          this.lastPongTime = Date.now()
          return
        }
        this.messageHandler?.({
          type: 'message',
          data: event.data,
        })
      } catch (e) {
        console.error('DirectWebSocket: Failed to parse message', e)
      }
    }
  }

  send(message: MessageToWorker) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('DirectWebSocket: Cannot send - connection not open')
      return
    }

    try {
      switch (message.type) {
        case 'connect':
          this.connect(message.endpoint)
          break
        case 'disconnect':
          this.disconnect()
          break
        case 'send': {
          const messageData =
            typeof message.data === 'object'
              ? message.data
              : { message: message.data }
          this.ws.send(
            JSON.stringify({
              event: message.event || 'message',
              ...(messageData as Record<string, unknown>),
            }),
          )
          break
        }
        case 'auth':
          this.ws.send(
            JSON.stringify({
              event: 'auth',
              data: message.data,
            }),
          )
          break
      }
    } catch (error) {
      console.error('DirectWebSocket: Failed to send message', error)
    }
  }

  disconnect() {
    console.log('DirectWebSocket: Disconnecting')
    this.cleanup()
    this.ws?.close()
    this.ws = null
    this.onReconnectAttemptChange(false)
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private reconnect() {
    this.disconnect()
    if (this.endpoint) {
      this.connect(this.endpoint)
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimeout && this.endpoint) {
      console.log('DirectWebSocket: Scheduling reconnect...')
      this.onReconnectAttemptChange(true)
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null
        this.connect(this.endpoint!)
      }, 5000)
    }
  }
}

export function useSharedWebSocketWorker(endpoint: string | null) {
  const [readyState, setReadyState] = useState<ReadyState>(
    ReadyState.UNINSTANTIATED,
  )
  const [lastMessage, setLastMessage] = useState<WorkerMessage | null>(null)
  const [isAttemptingReconnect, setIsAttemptingReconnect] = useState(false)
  const workerRef = useRef<SharedWorker | null>(null)
  const portRef = useRef<MessagePort | null>(null)
  const directWSRef = useRef<DirectWebSocketConnection | null>(null)
  const lastAuthMessageRef = useRef<AuthMessage | null>(null)
  const versionCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const versionVerifiedRef = useRef(false)

  const cleanupWorker = useCallback(async () => {
    if (portRef.current) {
      portRef.current.postMessage({ type: 'disconnect' })
      portRef.current.close()
      portRef.current = null
    }
    if (workerRef.current) {
      await terminateSharedWorkers()
      workerRef.current = null
    }
    versionVerifiedRef.current = false
  }, [])

  const handleMessage = useCallback((message: WorkerMessage) => {
    // Clear version check timeout if we get any message
    if (versionCheckTimeoutRef.current) {
      clearTimeout(versionCheckTimeoutRef.current)
      versionCheckTimeoutRef.current = null
    }

    // Handle version check response
    if (message.type === 'debug' && 'version' in message) {
      versionVerifiedRef.current = true
      if (message.version !== WORKER_VERSION) {
        console.warn('Worker version mismatch detected, reloading worker')
        cleanupWorker()
        return
      }
    }

    // Only log non-debug messages at debug level
    if (message.type !== 'debug') {
      const data = message.data
        ? JSON.parse(message.data as string)
        : message.data
      console.debug(
        'Worker message:',
        message.type,
        data ? data.event : undefined,
        data ? data.data : undefined,
      )
    }

    if (message.type === 'debug') {
      // Move debug logging to debug level
      console.debug(
        `[Worker ${message.timestamp}]`,
        message.message,
        message.data,
      )
      return
    }

    if (message.type === 'status') {
      const newState = message.readyState ?? ReadyState.CLOSED
      setReadyState(newState)

      if (newState === ReadyState.OPEN && lastAuthMessageRef.current) {
        // Only log auth resend at debug level
        console.debug('Connection opened, resending auth')
        if (isSharedWorkerSupported) {
          portRef.current?.postMessage(lastAuthMessageRef.current)
        } else {
          directWSRef.current?.send(lastAuthMessageRef.current)
        }
      }

      if (newState === ReadyState.OPEN || newState === ReadyState.CLOSED) {
        // setIsAttemptingReconnect(false) // Might need finer control based on worker message
      }
    } else if (message.type === 'message') {
      setLastMessage(message)
    } else if (message.type === 'error') {
      // Keep error logging as it's important
      console.error('Connection Error:', message.error)
      setReadyState(ReadyState.CLOSED)
    }

    if (message.type === 'reconnect_status') {
      setIsAttemptingReconnect(message.data === 'attempting')
    }
  }, [])

  // Initialize connection
  useEffect(() => {
    if (!endpoint) {
      cleanupWorker()
      setReadyState(ReadyState.CLOSED)
      setIsAttemptingReconnect(false)
      return
    }

    try {
      if (isSharedWorkerSupported) {
        // SharedWorker implementation
        if (!workerRef.current) {
          const workerUrl = getWorkerUrl()
          console.debug('Initializing SharedWorker:', workerUrl)

          // Attempt to terminate any existing workers first
          terminateSharedWorkers().then(() => {
            const worker = new SharedWorker(workerUrl, {
              name: 'websocket-worker',
              credentials: 'same-origin',
              type: 'classic',
            })

            // Ensure the worker is properly registered for debugging
            if ('onerror' in worker) {
              worker.onerror = error => {
                console.error('SharedWorker error:', error)
                setReadyState(ReadyState.CLOSED)
              }
            }

            worker.port.start()
            console.debug('SharedWorker created:', {
              url: workerUrl,
              options: {
                name: 'websocket-worker',
                type: 'classic',
              },
            })

            const port = worker.port
            port.onmessage = (event: MessageEvent<WorkerMessage>) =>
              handleMessage(event.data)
            port.onmessageerror = error => {
              console.error('Worker port message error:', error)
              setReadyState(ReadyState.CLOSED)
            }

            workerRef.current = worker
            portRef.current = port

            // Set up version check timeout
            if (versionCheckTimeoutRef.current) {
              clearTimeout(versionCheckTimeoutRef.current)
            }
            versionCheckTimeoutRef.current = setTimeout(() => {
              console.warn('Version check timeout - assuming legacy worker')
              cleanupWorker()
            }, VERSION_CHECK_TIMEOUT)

            // Check version immediately after connection
            port.postMessage({ type: 'version_check' })
            port.postMessage({ type: 'connect', endpoint })
          })
        } else if (portRef.current && versionVerifiedRef.current) {
          portRef.current.postMessage({ type: 'connect', endpoint })
        }
      } else {
        // Direct WebSocket implementation
        if (!directWSRef.current) {
          console.debug('Using direct WebSocket (SharedWorker not supported)')
          directWSRef.current = new DirectWebSocketConnection(
            handleMessage,
            setIsAttemptingReconnect,
          )
        }
        directWSRef.current.connect(endpoint)
      }

      setReadyState(ReadyState.CONNECTING)
    } catch (error) {
      console.error('Failed to initialize connection:', error)
      setReadyState(ReadyState.CLOSED)
    }

    return () => {
      cleanupWorker()
      setReadyState(ReadyState.CLOSED)
      setIsAttemptingReconnect(false)
    }
  }, [endpoint, handleMessage, cleanupWorker])

  const sendMessage = useCallback((message: MessageToWorker) => {
    if (isSharedWorkerSupported) {
      if (portRef.current) {
        portRef.current.postMessage(message)
      }
    } else {
      directWSRef.current?.send(message)
    }

    if (message.type === 'auth') {
      lastAuthMessageRef.current = message
    }
  }, [])

  return {
    readyState,
    lastMessage,
    sendMessage,
    isAttemptingReconnect,
  }
}

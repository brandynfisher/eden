// WebSocket Worker for connection pooling across tabs
self.name = 'websocket-worker'

// Worker version must match the version in useSharedWebSocketWorker.ts
self.WORKER_VERSION = '1.0'

// Enable debugging for the worker
self.DEBUG = true

// Keep track of all known worker instances
const knownWorkers = new Set()

// Function to attempt cleanup of other workers
function cleanupOtherWorkers() {
  try {
    // Broadcast a cleanup message that legacy workers will respond to
    const bc = new BroadcastChannel('websocket-worker-cleanup')
    bc.postMessage({ type: 'cleanup_request', timestamp: Date.now() })
    setTimeout(() => bc.close(), 1000)
  } catch (e) {
    debug('Failed to create BroadcastChannel', e)
  }
}

// Listen for cleanup messages
try {
  const bc = new BroadcastChannel('websocket-worker-cleanup')
  bc.onmessage = (event) => {
    if (event.data.type === 'cleanup_request') {
      // Legacy workers won't have a version and will self-terminate
      if (!self.WORKER_VERSION) {
        debug('Legacy worker detected, self-terminating')
        self.close()
      }
    }
  }
} catch (e) {
  debug('Failed to create BroadcastChannel listener', e)
}

// Ensure worker is registered for inspection
if (typeof SharedWorkerGlobalScope !== 'undefined' && self instanceof SharedWorkerGlobalScope) {
  // Log initialization with more details
  console.log('SharedWorker initialized:', {
    name: self.name,
    version: self.WORKER_VERSION,
    timestamp: new Date().toISOString(),
    location: self.location?.href,
    type: 'SharedWorker'
  })

  // Attempt to cleanup other workers on startup
  cleanupOtherWorkers()
}

// Add global error handler to prevent silent failures
self.onerror = (error) => {
  console.error('SharedWorker global error:', error)
}

// Store ports for broadcasting
const ports = new Set()

function debug(message, data) {
  if (!self.DEBUG) return

  const debugMessage = {
    type: 'debug',
    message,
    data,
    timestamp: new Date().toISOString(),
    workerName: self.name
  }

  // Log in worker context for inspection
  console.debug(`[Worker ${debugMessage.timestamp}]`, message, data)

  // In a SharedWorker, we can only send messages through ports
  ports.forEach(port => {
    try {
      port.postMessage(debugMessage)
    } catch (e) {
      console.warn('Failed to post to port:', e)
      ports.delete(port)
    }
  })
}

class WebSocketManager {
  constructor() {
    this.ws = null
    this.endpoint = null
    this.reconnectTimeout = null
    this.pingInterval = null
    this.lastPongTime = Date.now()
    this.isReconnecting = false

    // Initialize connection handling
    self.onconnect = (e) => {
      const port = e.ports[0]

      try {
        port.start()
        ports.add(port)
        debug('New client connected', { activePorts: ports.size })

        port.onmessage = (e) => {
          debug('Received message from client', e.data)
          this.handleMessage(e.data, port)
        }

        // If we already have a connection, inform the new client
        if (this.ws) {
          debug('Informing client of existing connection', { readyState: this.ws.readyState })
          port.postMessage({ type: 'status', readyState: this.ws.readyState })
        } else {
          debug('Informing client of CLOSED state')
          port.postMessage({ type: 'status', readyState: WebSocket.CLOSED })
        }
      } catch (error) {
        console.error('Error in onconnect handler:', error)
      }
    }

    debug('WebSocketManager initialized')
  }

  handleMessage(message, port) {
    debug('Handling message', message)
    switch (message.type) {
      case 'cleanup_legacy_workers':
        debug('Cleanup request received')
        cleanupOtherWorkers()
        break
      case 'version_check':
        debug('Version check requested', { version: self.WORKER_VERSION })
        port.postMessage({
          type: 'debug',
          message: 'Worker version',
          version: self.WORKER_VERSION,
          timestamp: new Date().toISOString()
        })
        break
      case 'connect':
        if (message.endpoint) {
          debug('Connecting to endpoint', { endpoint: message.endpoint })
          this.connect(message.endpoint)
        }
        break
      case 'disconnect':
        debug('Disconnecting')
        this.disconnect()
        break
      case 'send':
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const formattedMessage = {
            event: message.event || 'message',
            ...message.data
          }
          debug('Sending message', formattedMessage)
          this.ws.send(JSON.stringify(formattedMessage))
        }
        break
      case 'auth':
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          debug('Sending auth message')
          const authMessage = {
            event: 'auth',
            data: {
              userId: message.data.userId,
              token: message.data.token
            }
          }
          debug('Formatted auth message', authMessage)
          this.ws.send(JSON.stringify(authMessage))
        } else {
          debug('Cannot send auth - connection not open', { readyState: this.ws?.readyState })
        }
        break
    }
  }

  broadcast(message) {
    debug('Broadcasting message', { message, activePorts: ports.size })
    ports.forEach(port => {
      try {
        port.postMessage(message)
      } catch (e) {
        debug('Failed to send message to port', { error: e.message })
        ports.delete(port)
      }
    })
  }

  connect(endpoint) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      debug('Already connected')
      return
    }

    if (this.ws) {
      debug('Cleaning up existing connection')
      this.cleanup()
    }

    debug('Creating new WebSocket connection', { endpoint })

    try {
      // Create WebSocket with explicit protocols to help with debugging
      this.endpoint = endpoint
      this.ws = new WebSocket(endpoint, ['websocket'])

      // Log the WebSocket object details
      debug('WebSocket created', {
        url: this.ws.url,
        protocol: this.ws.protocol,
        readyState: this.ws.readyState,
        binaryType: this.ws.binaryType
      })

      this.ws.onopen = () => {
        try {
          if (!this.ws) return // Guard against null ws

          debug('Connection opened', {
            url: this.ws.url,
            protocol: this.ws.protocol,
            readyState: this.ws.readyState
          })

          this.broadcast({ type: 'status', readyState: WebSocket.OPEN })
          this.lastPongTime = Date.now() // Reset pong timer on successful connection
          this.isReconnecting = false

          // Setup ping interval
          if (this.pingInterval) {
            clearInterval(this.pingInterval)
          }

          this.pingInterval = self.setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              const pingData = JSON.stringify({ event: 'ping', ts: Date.now() })
              debug('Sending ping', pingData)
              this.ws.send(pingData)

              // Check for pong timeout
              if (Date.now() - this.lastPongTime > 90000) {
                debug('Pong timeout detected', {
                  lastPong: this.lastPongTime,
                  now: Date.now(),
                  diff: Date.now() - this.lastPongTime
                })
                if (!this.isReconnecting) {
                  this.reconnect()
                }
              }
            }
          }, 30000)
        } catch (error) {
          console.error('Error in onopen handler:', error)
          this.scheduleReconnect()
        }
      }

      this.ws.onclose = (event) => {
        debug('Connection closed', { code: event.code, reason: event.reason })
        this.broadcast({ type: 'status', readyState: WebSocket.CLOSED })
        this.cleanup()
        if (!this.isReconnecting) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        debug('Connection error', error)
        this.broadcast({ type: 'error', error })
        this.cleanup()
        if (!this.isReconnecting) {
          this.scheduleReconnect()
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          debug('Received WebSocket message', data)
          if (data.event === 'pong') {
            this.lastPongTime = Date.now()
            debug('Received pong, updated lastPongTime', this.lastPongTime)
            return
          }
          this.broadcast({ type: 'message', data: event.data })
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e, 'Raw data:', event.data)
          debug('Failed to parse WebSocket message', { error: e.message })
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      debug('Failed to create WebSocket', { error })
      this.scheduleReconnect()
    }
  }

  disconnect() {
    debug('Disconnecting WebSocket')
    this.cleanup()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  cleanup() {
    debug('Cleaning up resources')
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  reconnect() {
    if (this.isReconnecting) {
      debug('Already attempting to reconnect')
      return
    }

    this.isReconnecting = true
    debug('Initiating reconnection')
    this.disconnect()

    if (this.endpoint) {
      this.connect(this.endpoint)
    } else {
      this.isReconnecting = false
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout || !this.endpoint || this.isReconnecting) {
      debug('Skipping reconnect schedule', {
        hasTimeout: !!this.reconnectTimeout,
        hasEndpoint: !!this.endpoint,
        isReconnecting: this.isReconnecting
      })
      return
    }

    debug('Scheduling reconnection')
    this.reconnectTimeout = self.setTimeout(() => {
      this.reconnectTimeout = null
      if (!this.isReconnecting) {
        this.connect(this.endpoint)
      }
    }, 1000)
  }
}

debug('Creating WebSocketManager instance')
const manager = new WebSocketManager()
debug('WebSocketManager instance created') 
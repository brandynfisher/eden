// WebSocket Worker for connection pooling across tabs
self.name = 'websocket-worker'

// Store ports for broadcasting
const ports = new Set()

function debug(message, data) {
  const debugMessage = {
    type: 'debug',
    message,
    data,
    timestamp: new Date().toISOString()
  }

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
    this.endpoint = endpoint
    this.ws = new WebSocket(endpoint)

    this.ws.onopen = () => {
      debug('Connection opened')
      this.broadcast({ type: 'status', readyState: WebSocket.OPEN })

      this.pingInterval = self.setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          debug('Sending ping')
          this.ws.send(JSON.stringify({ event: 'ping', ts: Date.now() }))

          if (Date.now() - this.lastPongTime > 90000) {
            debug('Pong timeout, reconnecting')
            this.reconnect()
          }
        }
      }, 30000)
    }

    this.ws.onclose = () => {
      debug('Connection closed')
      this.broadcast({ type: 'status', readyState: WebSocket.CLOSED })
      this.cleanup()
      this.scheduleReconnect()
    }

    this.ws.onerror = (error) => {
      debug('Connection error', error)
      this.broadcast({ type: 'error', error })
      this.cleanup()
      this.scheduleReconnect()
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        debug('Received WebSocket message', data)
        if (data.event === 'pong') {
          this.lastPongTime = Date.now()
          debug('Received pong')
          return
        }
      } catch (e) {
        debug('Failed to parse WebSocket message', { error: e.message })
      }
      this.broadcast({ type: 'message', data: event.data })
    }
  }

  disconnect() {
    debug('Disconnecting WebSocket')
    if (this.ws) {
      this.ws.close()
      this.cleanup()
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
    this.ws = null
  }

  reconnect() {
    debug('Initiating reconnection')
    this.disconnect()
    if (this.endpoint) {
      this.connect(this.endpoint)
    }
  }

  scheduleReconnect() {
    if (!this.reconnectTimeout && this.endpoint) {
      debug('Scheduling reconnection')
      this.reconnectTimeout = self.setTimeout(() => {
        this.reconnectTimeout = null
        this.connect(this.endpoint)
      }, 1000)
    }
  }
}

debug('Creating WebSocketManager instance')
const manager = new WebSocketManager()
debug('WebSocketManager instance created') 
/// <reference lib="webworker" />

interface WebSocketWorkerMessage {
  type: 'connect' | 'disconnect' | 'send' | 'auth'
  endpoint?: string
  data?: {}
}

class WebSocketManager {
  private ws: WebSocket | null = null
  private ports: Set<MessagePort> = new Set()
  private endpoint: string | null = null
  private reconnectTimeout: number | null = null
  private pingInterval: number | null = null
  private lastPongTime: number = Date.now()

  constructor() {
    self.onconnect = (e: MessageEvent) => {
      const port = e.ports[0]
      this.ports.add(port)
      port.onmessage = (e: MessageEvent) => this.handleMessage(e.data, port)

      // If we already have a connection, inform the new client
      if (this.ws) {
        port.postMessage({ type: 'status', readyState: this.ws.readyState })
      }
    }
  }

  private handleMessage(message: WebSocketWorkerMessage, port: MessagePort) {
    console.log('handleMessage', message, port)
    switch (message.type) {
      case 'connect':
        if (message.endpoint) {
          this.connect(message.endpoint)
        }
        break
      case 'disconnect':
        this.disconnect()
        break
      case 'send':
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            typeof message.data === 'string'
              ? message.data
              : JSON.stringify(message.data),
          )
        }
        break
      case 'auth':
        // Store auth data and reconnect if needed
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(message.data))
        }
        break
    }
  }

  private connect(endpoint: string) {
    if (this.ws) {
      return // Already connected
    }

    this.endpoint = endpoint
    this.ws = new WebSocket(endpoint)

    this.ws.onopen = () => {
      this.broadcast({ type: 'status', readyState: WebSocket.OPEN })

      // Setup ping interval
      this.pingInterval = self.setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ event: 'ping', ts: Date.now() }))

          // Check for pong timeout
          if (Date.now() - this.lastPongTime > 90000) {
            this.reconnect()
          }
        }
      }, 30000)
    }

    this.ws.onclose = () => {
      this.broadcast({ type: 'status', readyState: WebSocket.CLOSED })
      this.cleanup()
      this.scheduleReconnect()
    }

    this.ws.onerror = error => {
      this.broadcast({ type: 'error', error })
      this.cleanup()
      this.scheduleReconnect()
    }

    this.ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)
        if (data.event === 'pong') {
          this.lastPongTime = Date.now()
          return // Don't broadcast pong messages
        }
      } catch (e) {
        // Ignore parse errors for non-JSON messages
      }
      this.broadcast({ type: 'message', data: event.data })
    }
  }

  private disconnect() {
    if (this.ws) {
      this.ws.close()
      this.cleanup()
    }
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
    this.ws = null
  }

  private reconnect() {
    this.disconnect()
    if (this.endpoint) {
      this.connect(this.endpoint)
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimeout && this.endpoint) {
      this.reconnectTimeout = self.setTimeout(() => {
        this.reconnectTimeout = null
        this.connect(this.endpoint!)
      }, 1000)
    }
  }

  private broadcast(message: {
    type?: string
    status?: number
    readyState?: number
    error?: Event
    message?: string
    data?: {}
  }) {
    this.ports.forEach(port => {
      try {
        port.postMessage(message)
      } catch (e) {
        // Remove dead ports
        this.ports.delete(port)
      }
    })
  }
}

// Start the WebSocket manager
new WebSocketManager()

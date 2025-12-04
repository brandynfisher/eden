import FastifyWebSocket, { WebsocketPluginOptions } from '@fastify/websocket'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { WebSocket } from 'ws'

interface BroadcastMessage {
  event: string
  clientId: string
  payload: any
}

const registerWebSocket: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  try {
    const baseAllowed = [
      fastify.config.FRONTEND_URL,
      fastify.config.EDEN2_FRONTEND_URL,
    ]

    // Also allow 127.0.0.1 variants when the configured host is localhost
    const allowedVariants = baseAllowed.flatMap(origin => {
      try {
        const url = new URL(origin)
        if (url.hostname === 'localhost') {
          const port = url.port ? `:${url.port}` : ''
          return [`${url.protocol}//127.0.0.1${port}`]
        }
      } catch (err) {
        fastify.log.debug({ err, origin }, 'websocket origin parse failed')
      }
      return [] as string[]
    })

    const allowedOrigins = [...baseAllowed, ...allowedVariants]

    const websocketOptions: WebsocketPluginOptions = {
      errorHandler: (error, socket, req, reply) => {
        fastify.log.error({ error, req, reply }, 'Websocket ErrorHandler')
        socket.terminate()
      },
      options: {
        clientTracking: true,
        maxPayload: 1048576, // limit message size to 1 MiB
        verifyClient: (info, next) => {
          if (!allowedOrigins.includes(info.origin)) {
            fastify.log.warn(
              {
                origin: info.origin,
                allowedOrigin: allowedOrigins,
              },
              'WebSocket connection rejected',
            )
            return next(false)
          }
          next(true)
        },
      },
    }

    // Store active connections by client ID
    const connections = new Map<string, WebSocket>()

    // Handle broadcast messages
    fastify.decorate('broadcastToClient', (clientId: string, message: any) => {
      const connection = connections.get(clientId)
      if (connection) {
        connection.send(JSON.stringify(message))
      }
    })

    // Handle WebSocket messages
    fastify.decorate(
      'handleWebSocketMessage',
      (socket: WebSocket, message: BroadcastMessage) => {
        const { clientId } = message
        connections.set(clientId, socket)

        socket.on('close', () => {
          connections.delete(clientId)
        })
      },
    )

    await fastify.register(FastifyWebSocket, websocketOptions)
    fastify.log.info('Successfully registered plugin: WebSocket')
  } catch (err) {
    fastify.log.error({ err }, 'Plugin: WebSocket, error on register')
  }
}

export default registerWebSocket

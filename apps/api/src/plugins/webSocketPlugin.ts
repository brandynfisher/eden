import FastifyWebSocket, { WebsocketPluginOptions } from '@fastify/websocket'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

const registerWebSocket: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  try {
    const websocketOptions: WebsocketPluginOptions = {
      errorHandler: (error, socket, req, reply) => {
        fastify.log.error('Websocket ErrorHandler', { error, req, reply })
        socket.terminate()
      },
      options: {
        clientTracking: true,
        maxPayload: 1048576, // limit message size to 1 MiB
        verifyClient: (info, next) => {
          if (info.origin !== fastify.config.FRONTEND_URL) {
            fastify.log.warn('WebSocket connection rejected', {
              origin: info.origin,
              allowedOrigin: fastify.config.FRONTEND_URL,
            })
            return next(false)
          }
          next(true)
        },
      },
    }

    await fastify.register(FastifyWebSocket, websocketOptions)
    fastify.log.info('Successfully registered plugin: WebSocket')
  } catch (err) {
    fastify.log.error('Plugin: WebSocket, error on register', err)
  }
}

export default registerWebSocket

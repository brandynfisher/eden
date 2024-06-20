import FastifyWebSocket from '@fastify/websocket'
import type { FastifyInstance } from 'fastify'

export const registerWebSocket = async (fastify: FastifyInstance) => {
  try {
    await fastify.register(FastifyWebSocket, {
      // options: {
      //   maxPayload: 1048576
      // }
    })
    fastify.log.info('Successfully registered WebSocketPlugin')
  } catch (err) {
    fastify.log.error('Plugin: WebSocket, error on register', err)
  }
}

export default registerWebSocket

// declare module 'fastify' {
//   interface FastifyInstance {
//     webSocket: FastifyWebSocket
//   }
// }

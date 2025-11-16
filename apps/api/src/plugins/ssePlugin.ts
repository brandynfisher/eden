import type { FastifyInstance } from 'fastify'
import { FastifySSEPlugin } from 'fastify-sse-v2'

export const registerSSE = async (fastify: FastifyInstance) => {
  try {
    await fastify.register(FastifySSEPlugin)
    fastify.log.info('Successfully registered plugin: SSE')
  } catch (err) {
    fastify.log.error({ err }, 'Plugin: SSE, error on register')
  }
}

export default registerSSE

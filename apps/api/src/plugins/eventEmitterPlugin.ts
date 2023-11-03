import EventEmitter from 'events'
import type { FastifyInstance } from 'fastify'
import { FastifySSEPlugin } from 'fastify-sse-v2'

export const registerEventEmitter = async (fastify: FastifyInstance) => {
  try {
    await fastify.register(FastifySSEPlugin)
    const eventEmitter = new EventEmitter()
    fastify.decorate('eventEmitter', eventEmitter)
    fastify.log.info('Successfully registered EventEmitterPlugin')
  } catch (err) {
    fastify.log.error('Plugin: EventEmitter, error on register', err)
  }
}

export default registerEventEmitter

declare module 'fastify' {
  interface FastifyInstance {
    eventEmitter: EventEmitter
  }
}

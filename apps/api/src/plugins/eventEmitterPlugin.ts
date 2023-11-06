import EventEmitter from 'events'
import type { FastifyInstance } from 'fastify'
import { FastifySSEPlugin } from 'fastify-sse-v2'

export interface TaskUpdateEvent {
  userId: string
  taskId: string
  status: string
  progress?: number
  result?: string
}

export const registerEventEmitter = async (fastify: FastifyInstance) => {
  try {
    await fastify.register(FastifySSEPlugin)
    const eventEmitter = new EventEmitter()
    eventEmitter.setMaxListeners(100 * 1000)
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

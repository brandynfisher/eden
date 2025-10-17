import EventEmitter from 'events'
import { FastifyPluginAsync } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

export enum InternalMessagesQueues {
  TaskUpdates = 'task-updates',
  // TaskUpdatesV2 = 'task-updates-v2',
}

export interface InternalMessagesOptions {
  queues?: {
    topic:
      | 'task-updates'
      | 'task-updates-v2'
      | 'thread-updates'
      | 'session-updates'
      | 'notifications'
    onMessage: (msg: unknown) => Promise<void>
  }[]
}

interface InternalMessagesPlugin {
  connection: EventEmitter
  publish: (
    topic:
      | 'task-updates'
      | 'task-updates-v2'
      | 'thread-updates'
      | 'session-updates'
      | 'notifications',
    message: unknown,
  ) => void
}

const fastifyInternalMessages: FastifyPluginAsync<
  InternalMessagesOptions
> = async (fastify, options) => {
  const { queues } = options

  if (!queues || queues.length === 0) {
    fastify.log.warn('No queues provided for InternalMessages plugin')
    return
  }

  const eventEmitter = new EventEmitter()
  eventEmitter.setMaxListeners(100)

  queues.forEach(({ topic, onMessage }) => {
    eventEmitter.on(topic, onMessage)
  })

  const internalMessages: InternalMessagesPlugin = {
    connection: eventEmitter,
    publish: (topic, message) => {
      eventEmitter.emit(topic, message)
    },
  }

  fastify.decorate('internalMessages', internalMessages)
}

export const registerInternalMessages: FastifyPluginAsync = async fastify => {
  try {
    await fastify.register(fastifyInternalMessages, {
      queues: [
        {
          topic: 'task-updates',
          onMessage: async _message => {},
        },
        {
          topic: 'task-updates-v2',
          onMessage: async _message => {},
        },
        {
          topic: 'thread-updates',
          onMessage: async _message => {},
        },
        {
          topic: 'session-updates',
          onMessage: async _message => {},
        },
        {
          topic: 'notifications',
          onMessage: async message => {
            // Broadcast to WebSocket clients
            const sockets = fastify.websocketServer.clients
            sockets.forEach(socket => {
              if (socket.readyState === 1) {
                socket.send(JSON.stringify(message))
              }
            })
          },
        },
      ],
    })
    fastify.log.info('Successfully registered plugin: InternalMessages')
  } catch (err) {
    fastify.log.error('Failed to register plugin: InternalMessages', { err })
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    internalMessages: InternalMessagesPlugin
  }
}

export default fastifyPlugin(fastifyInternalMessages)

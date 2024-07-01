import EventEmitter from 'events'
import { FastifyPluginAsync } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

export enum InternalMessagesQueues {
  TaskUpdates = 'task-updates',
}

export interface InternalMessagesOptions {
  queues?: {
    topic: InternalMessagesQueues
    onMessage: (msg: unknown) => Promise<void>
  }[]
}

interface InternalMessagesPlugin {
  connection: EventEmitter
  publish: (topic: InternalMessagesQueues, message: unknown) => void
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
          topic: InternalMessagesQueues.TaskUpdates,
          onMessage: async message => {
            fastify.log.info('Internal message received', { message })
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

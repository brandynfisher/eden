import { InternalMessagesQueues } from '../plugins/internalMessagesPlugin'
import { Type } from '@sinclair/typebox'
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify'

const triggerEventEmitter = (
  server: FastifyInstance,
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  server.eventEmitter.emit('task-update', {
    _id: '123',
    user: '456',
    workflow: 'TEST',
    args: {
      test: 'test',
    },
  })
  server.internalMessages.publish(InternalMessagesQueues.TaskUpdates, {
    _id: '123',
    user: '456',
    workflow: 'TEST',
    args: {
      test: 'test',
    },
  })

  return reply.status(200).send({
    sentUpdate: {
      _id: '123',
      user: '456',
      workflow: 'TEST',
      args: {
        test: 'test',
      },
    },
  })
}

const testRoutes: FastifyPluginAsync = async server => {
  server.get('/test/task-update', {
    schema: {
      tags: ['Tasks'],
      description: 'Trigger task update websocket event',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: Type.Object({
          state: Type.String(),
        }),
      },
    },
    handler: (request, reply) => triggerEventEmitter(server, request, reply),
  })
}

export default testRoutes

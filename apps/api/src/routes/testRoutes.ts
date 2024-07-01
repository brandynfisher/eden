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
    userId: '652bfd262ea937e07378268c',
    taskId: '9d72v3t615rgj0cgdt89nvyz0g',
    status: 'completed',
    progress: 1,
    task: {
      _id: '9d72v3t615rgj0cgdt89nvyz0g',
      user: '652bfd262ea937e07378268c',
      // ...task,
      // ...taskUpdateIntermediate,
    },
  })
  server.internalMessages.publish(InternalMessagesQueues.TaskUpdates, {
    event: 'task-update',
    data: {
      userId: 'test',
      taskId: '123123123',
      status: 'completed',
      progress: 1.0,
      // result: creationData.map(item => item.uri),
      task: {
        // ...task.toObject(),
        // ...taskUpdate,
        // creation: creationData[0],
        // generator: {
        //   generatorName: generator.generatorName,
        // },
      },
    },
  })

  return reply.status(200).send({
    state: 'Good!',
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

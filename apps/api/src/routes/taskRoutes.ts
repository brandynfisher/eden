import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  createChatCompletion,
  createCompletion,
  createTask,
  getTask,
  getTaskCost,
  listTasks,
  receiveTaskUpdate,
  subscribeTaskUpdates,
} from '../controllers/taskController'
import { isAuth } from '../middleware/authMiddleware'

const taskRoutes: FastifyPluginAsync = async server => {
  server.post('/tasks/cost', {
    schema: {
      body: {
        generatorName: Type.String(),
        versionId: Type.Optional(Type.String()),
        config: Type.Optional(Type.Any()),
      },
      response: {
        200: Type.Object({
          cost: Type.Number(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getTaskCost(server, request, reply),
  })

  server.post('/tasks/create', {
    schema: {
      body: {
        generatorName: Type.String(),
        versionId: Type.Optional(Type.String()),
        config: Type.Optional(Type.Any()),
        webhooks: Type.Optional(Type.Array(Type.String())),
      },
      response: {
        200: Type.Object({
          taskId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createTask(server, request, reply),
  })

  server.post('/tasks/complete', {
    schema: {
      body: {
        prompt: Type.String(),
      },
      response: {
        200: Type.Object({
          completion: Type.Object({
            id: Type.String(),
            text: Type.String(),
          }),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createCompletion(server, request, reply),
  })

  server.post('/tasks/chat', {
    schema: {
      body: {
        chat: Type.Array(
          Type.Object({
            sender: Type.String(),
            message: Type.String(),
          }),
        ),
      },
      response: {
        200: Type.Object({
          completion: Type.Object({
            id: Type.String(),
            text: Type.String(),
          }),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createChatCompletion(server, request, reply),
  })

  server.get('/tasks', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: ['string', 'array'] },
          taskId: { type: ['string', 'array'] },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listTasks(request, reply),
  })

  server.get('/tasks/:taskId', {
    schema: {
      params: {
        taskId: Type.String(),
      },
      response: {
        200: Type.Object({
          task: Type.Any(),
        }),
      },
    },
    handler: (request, reply) => getTask(request, reply),
  })

  server.post('/tasks/update', {
    schema: {
      querystring: {
        secret: Type.String(),
      },
    },
    handler: (request, reply) => receiveTaskUpdate(server, request, reply),
  })

  server.get('/tasks/events', {
    schema: {
      querystring: {
        taskId: Type.Optional(Type.String()),
      },
    },
    handler: (request, reply) => subscribeTaskUpdates(server, request, reply),
  })

  // server.options('/tasks/events', {
  //   handler: (request, reply) => {
  //     reply.header('Access-Control-Allow-Origin', '*')
  //     reply.header('Access-Control-Allow-Headers', '*')
  //     reply.header('Access-Control-Allow-Methods', '*')
  //     reply.send()
  //   },
  // })
}

export default taskRoutes

import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  createChatCompletion,
  createCompletion,
  createTask,
  getTask,
  listTasks,
  receiveTaskUpdate,
} from '../controllers/taskController'
import { isAuth } from '../middleware/authMiddleware'

const taskRoutes: FastifyPluginAsync = async server => {
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
    preHandler: [async request => isAuth(server, request)],
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
    preHandler: [async request => isAuth(server, request)],
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
    preHandler: [async request => isAuth(server, request)],
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
    preHandler: [async request => isAuth(server, request)],
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
}

export default taskRoutes

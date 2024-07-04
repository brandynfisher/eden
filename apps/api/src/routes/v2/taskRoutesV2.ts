import {
  getTask,
  getTaskCost,
  listTasks,
  subscribeTaskUpdates,
} from '../../controllers/taskController'
import { createTask } from '../../controllers/v2/taskControllerV2'
import { isAuth } from '../../middleware/authMiddleware'
import { argsType } from '../../types/routeTypes'
import { paginatedResponse, paginationProperties } from '../index'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const taskRoutesV2: FastifyPluginAsync = async server => {
  server.post('/tasks/cost', {
    schema: {
      tags: ['Tasks'],
      description: 'Get task cost',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        workflow: Type.String(),
        args: Type.Optional(argsType),
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
      tags: ['Tasks'],
      description: 'Create a task',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        workflow: Type.String(),
        args: Type.Optional(argsType),
      },
      response: {
        200: Type.Object({
          task: Type.Optional(Type.Any()),
        }),
        400: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        401: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        404: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        500: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createTask(server, request, reply),
  })

  server.get('/tasks', {
    schema: {
      tags: ['Tasks'],
      description: 'List tasks',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          status: { type: ['string', 'array'] },
          taskId: { type: ['string', 'array'] },
          type: Type.Optional(Type.String()),
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
      tags: ['Tasks'],
      description: 'Get a task',
      security: [
        {
          apiKey: [],
        },
      ],
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

  server.get('/tasks/events', {
    schema: {
      tags: ['Tasks'],
      description: 'Get task events',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        taskId: Type.Optional(Type.String()),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => subscribeTaskUpdates(server, request, reply),
  })
}

export default taskRoutesV2

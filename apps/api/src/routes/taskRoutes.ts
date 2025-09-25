import { paginatedResponse, paginationProperties } from '.'
import {
  createTask,
  getTask,
  getTaskCost,
  listTasks,
  receiveTaskUpdate,
  subscribeTaskUpdates,
} from '../controllers/taskController'
import { isAuth } from '../middleware/authMiddleware'
import { configType } from '../types/routeTypes'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const taskRoutes: FastifyPluginAsync = async server => {
  server.post('/tasks/cost', {
    schema: {
      hide: true,
      tags: ['Tasks'],
      summary: 'Calculate Task Cost',
      description:
        'Calculate the manna cost for running a task with the specified generator and configuration.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        generatorName: Type.String(),
        versionId: Type.Optional(Type.String()),
        config: Type.Optional(configType),
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
      hide: true,
      tags: ['Tasks'],
      summary: 'Create New Task',
      description:
        'Create and execute a new AI generation task with the specified generator and configuration.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        generatorName: Type.String(),
        versionId: Type.Optional(Type.String()),
        config: Type.Optional(configType),
      },
      response: {
        200: Type.Object({
          taskId: Type.String(),
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
      hide: true,
      tags: ['Tasks'],
      summary: 'List Tasks',
      description:
        'Get a paginated list of tasks with optional filtering by status, task ID, or type.',
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
      hide: true,
      tags: ['Tasks'],
      summary: 'Get Task Details',
      description:
        'Retrieve detailed information about a specific task including status and results.',
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

  server.post('/tasks/update', {
    schema: {
      hide: true,
      tags: ['Tasks'],
      summary: 'Update Task Status',
      description:
        'Webhook endpoint to receive task status updates from the execution service.',
      querystring: {
        secret: Type.String(),
      },
    },
    handler: (request, reply) => receiveTaskUpdate(server, request, reply),
  })

  server.get('/tasks/events', {
    schema: {
      hide: true,
      tags: ['Tasks'],
      summary: 'Subscribe to Task Events',
      description:
        'Subscribe to real-time task status updates via Server-Sent Events (SSE).',
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

export default taskRoutes

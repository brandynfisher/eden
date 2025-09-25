import { getTaskCost } from '../../controllers/taskController'
import {
  cancelTask,
  createTask,
  getTask,
  listTasks,
  subscribeTaskUpdates,
} from '../../controllers/v2/taskControllerV2'
import { isAuth } from '../../middleware/authMiddleware'
import { argsType, taskV2Type } from '../../types/routeTypes'
import { paginatedResponse, paginationProperties } from '../index'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const taskRoutesV2: FastifyPluginAsync = async server => {
  server.post('/v2/tasks/cost', {
    schema: {
      tags: ['Tasks'],
      summary: 'Calculate Task Cost',
      description:
        'Calculate the estimated cost in manna for executing a task with specified tool and arguments.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        tool: Type.String(),
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

  server.post('/v2/tasks/create', {
    schema: {
      tags: ['Tasks'],
      summary: 'Create New Task',
      description:
        'Create and execute a new task using a specified tool with optional arguments and visibility settings.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        tool: Type.String(),
        args: Type.Optional(argsType),
        makePublic: Type.Optional(Type.Boolean()),
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
          error: Type.Optional(Type.Any()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createTask(server, request, reply),
  })

  server.get('/v2/tasks', {
    schema: {
      tags: ['Tasks'],
      summary: 'List User Tasks',
      description:
        'Retrieve a paginated list of tasks for the authenticated user with optional filtering by status, type, or tool.',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          status: Type.Optional(Type.Any()), //{ type: ['string', 'array'] },
          taskId: Type.Optional(Type.Any()), //{ type: ['string', 'array'] },
          type: Type.Optional(Type.String()),
          output_type: Type.Optional(Type.String()),
          cost: Type.Optional(Type.Number()),
          tool: Type.Optional(Type.Any()),
          minDate: Type.Optional(Type.Boolean()),
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(taskV2Type),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listTasks(server, request, reply),
  })

  server.get('/v2/tasks/:taskId', {
    schema: {
      tags: ['Tasks'],
      summary: 'Get Task Details',
      description:
        'Retrieve detailed information about a specific task including its status and output.',
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
          task: taskV2Type,
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getTask(server, request, reply),
  })

  server.get('/v2/tasks/events', {
    schema: {
      tags: ['Tasks'],
      summary: 'Subscribe Task Events',
      description:
        'Subscribe to real-time task update events via Server-Sent Events (SSE).',
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

  server.post('/v2/tasks/cancel', {
    schema: {
      tags: ['Tasks'],
      summary: 'Cancel Running Task',
      description:
        'Cancel a task that is currently in progress or queued for execution.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        taskId: Type.String(),
      },
      response: {
        200: Type.Object({
          taskStatus: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => cancelTask(server, request, reply),
  })
}

export default taskRoutesV2

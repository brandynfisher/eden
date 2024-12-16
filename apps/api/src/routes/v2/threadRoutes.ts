import {
  addThreadMessageReaction,
  createThreadMessage,
  getThread,
  listThreads,
} from '../../controllers/v2/threadController'
import { isAuthEden2 } from '../../middleware/authMiddleware'
import { paginatedResponse, paginationProperties } from '../index'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const threadRoutes: FastifyPluginAsync = async server => {
  server.post('/v2/threads', {
    schema: {
      tags: ['Threads'],
      description: 'Add a thread message ',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        thread_id: Type.Optional(Type.String()),
        agent_id: Type.String(),
        content: Type.Optional(Type.String()),
        attachments: Type.Optional(Type.Array(Type.String())),
      },
      response: {
        200: Type.Object({
          thread_id: Type.String(),
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
    preHandler: [(request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) => createThreadMessage(server, request, reply),
  })

  server.post('/v2/threads/react', {
    schema: {
      tags: ['Threads'],
      description: 'Add a reaction to a thread message ',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        thread_id: Type.String(),
        message_id: Type.String(),
        reaction: Type.String(),
      },
      response: {
        200: Type.Object({
          thread_id: Type.String(),
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
    preHandler: [(request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) =>
      addThreadMessageReaction(server, request, reply),
  })

  server.get('/v2/threads', {
    schema: {
      tags: ['Threads'],
      description: 'List threads',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    preHandler: [(request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) => listThreads(server, request, reply),
  })

  server.get('/v2/threads/:thread_id', {
    schema: {
      tags: ['Threads'],
      description: 'Get a thread',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        thread_id: Type.String(),
      },
      response: {
        200: Type.Object({
          thread: Type.Any(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) => getThread(server, request, reply),
  })
}

export default threadRoutes

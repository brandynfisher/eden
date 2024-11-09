import { createThreadMessage } from '../../controllers/v2/threadController'
import { isAuthEden2 } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const threadRoutes: FastifyPluginAsync = async server => {
  server.post('/v2/threads/create', {
    schema: {
      tags: ['Threads'],
      description: 'Create a thread',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        threadId: Type.Optional(Type.String()),
        agentId: Type.String(),
        content: Type.String(),
        attachments: Type.Optional(Type.Array(Type.String())),
      },
      response: {
        200: Type.Any(),
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
}

export default threadRoutes

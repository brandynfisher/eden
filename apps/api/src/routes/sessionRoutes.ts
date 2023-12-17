import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  addCharactersToSession,
  addUsersToSession,
  createSession,
  deleteSession,
  getSession,
  getSessionEvents,
  interactSession,
  listSessions,
} from '../controllers/sessionController'
import { isAdmin, isAuth } from '../middleware/authMiddleware'

const sessionRoutes: FastifyPluginAsync = async server => {
  server.post('/sessions/create', {
    schema: {
      response: {
        200: Type.Object({
          sessionId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createSession(request, reply),
  })

  server.post('/sessions/delete', {
    schema: {
      body: Type.Object({
        sessionId: Type.String(),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteSession(request, reply),
  })

  server.post('/sessions/users/add', {
    schema: {
      body: Type.Object({
        sessionId: Type.String(),
        userIds: Type.Array(Type.String()),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => addUsersToSession(request, reply),
  })

  server.post('/sessions/characters/add', {
    schema: {
      body: Type.Object({
        sessionId: Type.String(),
        characterIds: Type.Array(Type.String()),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => addCharactersToSession(request, reply),
  })

  server.post('/sessions/interact', {
    schema: {
      body: Type.Object({
        sessionId: Type.String(),
        assistant: Type.Object({
          name: Type.String(),
          identity: Type.String(),
          knowledge: Type.String(),
          knowledge_summary: Type.String(),
        }),
        interaction: Type.Object({
          prompt: Type.String(),
          author_id: Type.String(),
          attachments: Type.Optional(Type.Array(Type.String())),
        }),
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
          config: Type.Optional(Type.Any()),
        }),
      },
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => interactSession(server, request, reply),
  })

  server.get('/sessions', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'array'] },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(
          Type.Object({
            id: Type.String(),
          }),
        ),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listSessions(request, reply),
  })

  server.get('/sessions/:sessionId', {
    schema: {
      params: Type.Object({
        sessionId: Type.String(),
      }),
      response: {
        200: Type.Object({
          session: Type.Object({
            id: Type.String(),
          }),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getSession(request, reply),
  })

  server.get('/sessions/:sessionId/events', {
    schema: {
      params: Type.Object({
        sessionId: Type.String(),
      }),
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
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getSessionEvents(request, reply),
  })
}

export default sessionRoutes

import { ScenarioType, SessionEventType } from '@edenlabs/eden-sdk'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  createSession,
  deleteSession,
  getSession,
  getSessionEvents,
  listSessions,
  updateSession,
} from '../controllers/sessionController'
import { isAdmin, isAuth } from '../middleware/authMiddleware'

const sessionRoutes: FastifyPluginAsync = async server => {
  server.post('/sessions/create', {
    schema: {
      body: Type.Object({
        type: Type.Enum(ScenarioType),
      }),
      response: {
        200: Type.Object({
          sessionId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createSession(request, reply),
  })

  server.post('/sessions/update', {
    schema: {
      body: Type.Object({
        sessionId: Type.String(),
        type: Type.Optional(Type.Enum(SessionEventType)),
        data: Type.Optional(Type.Any()),
      }),
      response: {
        200: Type.Object({
          eventId: Type.String(),
        }),
      },
    },
    preHandler: [async request => isAdmin(server, request)],
    handler: (request, reply) => updateSession(request, reply),
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
            type: Type.String(),
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
            type: Type.Enum(ScenarioType),
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

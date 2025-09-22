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
import { sessionType } from '../types/routeTypes'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const sessionRoutes: FastifyPluginAsync = async server => {
  server.post('/sessions/create', {
    schema: {
      hide: true,
      tags: ['Sessions'],
      summary: 'Create New Session',
      description:
        'Create a new conversation session for interacting with characters.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
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
      hide: true,
      tags: ['Sessions'],
      summary: 'Delete Session',
      description:
        'Permanently delete a conversation session and all associated messages.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
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
      hide: true,
      tags: ['Sessions'],
      summary: 'Add Users to Session',
      description:
        'Add additional users to an existing conversation session (admin only).',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
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
      hide: true,
      tags: ['Sessions'],
      summary: 'Add Characters to Session',
      description:
        'Add characters to an existing conversation session for multi-character interactions (admin only).',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
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
      hide: true,
      tags: ['Sessions'],
      summary: 'Interact with Session',
      description:
        'Send a message in a conversation session and receive character responses (admin only).',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      body: Type.Object({
        character_id: Type.String(),
        session_id: Type.String(),
        message: Type.String(),
        attachments: Type.Optional(Type.Array(Type.String())),
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
      hide: true,
      tags: ['Sessions'],
      summary: 'List Sessions',
      description:
        'Get a paginated list of conversation sessions with optional filtering by user ID.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'array'] },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(sessionType),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listSessions(request, reply),
  })

  server.get('/sessions/:sessionId', {
    schema: {
      hide: true,
      tags: ['Sessions'],
      summary: 'Get Session Details',
      description:
        'Retrieve detailed information about a specific conversation session.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      params: Type.Object({
        sessionId: Type.String(),
      }),
      response: {
        200: Type.Object({
          session: sessionType,
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getSession(request, reply),
  })

  server.get('/sessions/:sessionId/events', {
    schema: {
      hide: true,
      tags: ['Sessions'],
      summary: 'Get Session Events',
      description:
        'Get a paginated list of events (messages, actions) from a conversation session.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
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

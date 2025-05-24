import {
  addSessionMessageReaction,
  createSession,
  createSessionMessage,
  deleteSession,
  getSession,
  listSessions,
  pinSessionMessage,
  renameSession,
  unpinSessionMessage,
} from '../../controllers/v2/sessionControllerV2'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { paginatedResponse, paginationProperties } from '../index'
import {
  SessionsV2CreateArguments,
  SessionsV2DeleteArguments,
  SessionsV2GetArguments,
  SessionsV2ListArguments,
  SessionsV2MessageArguments,
  SessionsV2MessageReactArguments,
  SessionsV2PinMessageArguments,
  SessionsV2RenameArguments,
} from '@edenlabs/eden-sdk'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const sessionRoutesV2: FastifyPluginAsync = async server => {
  server.post<{
    Body: SessionsV2CreateArguments
  }>('/v2/sessions/create', {
    schema: {
      tags: ['Sessions'],
      description: 'Create a new session',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        agent_ids: Type.Array(Type.String(), { minItems: 1 }),
        scenario: Type.String({ minLength: 10, maxLength: 1000 }),
        budget: Type.Number({ minimum: 100, maximum: 5000 }),
      },
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          session: Type.Any(),
        }),
        400: {
          message: Type.Optional(Type.String()),
        },
        401: {
          message: Type.Optional(Type.String()),
        },
        404: {
          message: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.Any()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createSession(server, request, reply),
  })

  server.post<{
    Body: SessionsV2MessageArguments
  }>('/v2/sessions', {
    schema: {
      tags: ['Sessions'],
      description: 'Add a message to session',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        session_id: Type.Optional(Type.String()),
        content: Type.Optional(Type.String()),
        attachments: Type.Optional(Type.Array(Type.String())),
      },
      response: {
        200: Type.Object({
          session_id: Type.String(),
          message_id: Type.Optional(Type.String()),
        }),
        400: {
          message: Type.Optional(Type.String()),
        },
        401: {
          message: Type.Optional(Type.String()),
        },
        404: {
          message: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.Any()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createSessionMessage(server, request, reply),
  })

  server.post<{
    Body: SessionsV2MessageReactArguments
  }>('/v2/sessions/react', {
    schema: {
      tags: ['Sessions'],
      description: 'Add a reaction to a session message',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        message_id: Type.String(),
        reaction: Type.String(),
      },
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.Any(),
        }),
        400: {
          message: Type.Optional(Type.String()),
        },
        401: {
          message: Type.Optional(Type.String()),
        },
        404: {
          message: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.Any()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) =>
      addSessionMessageReaction(server, request, reply),
  })

  server.post<{
    Body: SessionsV2PinMessageArguments
  }>('/v2/sessions/pin', {
    schema: {
      tags: ['Sessions'],
      description: 'Pin a session message',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        message_id: Type.String(),
      },
      response: {
        200: Type.Object({
          success: Type.Boolean(),
        }),
        400: {
          message: Type.Optional(Type.String()),
        },
        401: {
          message: Type.Optional(Type.String()),
        },
        404: {
          message: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.Any()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => pinSessionMessage(server, request, reply),
  })

  server.post<{
    Body: SessionsV2PinMessageArguments
  }>('/v2/sessions/unpin', {
    schema: {
      tags: ['Sessions'],
      description: 'Unpin a session message',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        message_id: Type.String(),
      },
      response: {
        200: Type.Object({
          success: Type.Boolean(),
        }),
        400: {
          message: Type.Optional(Type.String()),
        },
        401: {
          message: Type.Optional(Type.String()),
        },
        404: {
          message: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.Any()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => unpinSessionMessage(server, request, reply),
  })

  server.get<{
    Querystring: SessionsV2ListArguments
  }>('/v2/sessions', {
    schema: {
      tags: ['Sessions'],
      description: 'List sessions',
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
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listSessions(server, request, reply),
  })

  server.get<{
    Params: SessionsV2GetArguments
  }>('/v2/sessions/:session_id', {
    schema: {
      tags: ['Sessions'],
      description: 'Get a session',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        session_id: Type.String(),
      },
      response: {
        200: Type.Object({
          session: Type.Any(),
        }),
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getSession(server, request, reply),
  })

  server.patch<{
    Params: Pick<SessionsV2RenameArguments, 'session_id'>
    Body: Pick<SessionsV2RenameArguments, 'title'>
  }>('/v2/sessions/:session_id', {
    schema: {
      tags: ['Sessions'],
      description: 'Rename a session',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        session_id: Type.String(),
      },
      body: {
        title: Type.String(),
      },
      response: {
        200: Type.Object({
          success: Type.Boolean(),
        }),
        400: {
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        401: {
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        404: {
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => renameSession(request, reply),
  })

  server.delete<{
    Params: SessionsV2DeleteArguments
  }>('/v2/sessions/:session_id', {
    schema: {
      tags: ['Sessions'],
      description: 'Delete a session',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        session_id: Type.String(),
      },
      response: {
        200: Type.Object({
          success: Type.Boolean(),
        }),
        400: {
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        401: {
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        404: {
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteSession(request, reply),
  })
}

export default sessionRoutesV2

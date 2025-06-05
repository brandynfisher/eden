import {
  addSessionMessageReaction,
  createSession,
  createSessionMessage,
  createSessionMessageStream,
  deleteSession,
  getSession,
  listSessions,
  renameSession,
} from '../../controllers/v2/sessionControllerV2'
import { hasFeatureFlag, isAuth } from '../../middleware/authMiddleware'
import { paginatedResponse, paginationProperties } from '../index'
import {
  FeatureFlag,
  SessionsV2CreateArguments,
  SessionsV2DeleteArguments,
  SessionsV2GetArguments,
  SessionsV2ListArguments,
  SessionsV2MessageArguments,
  SessionsV2MessageReactArguments,
  SessionsV2RenameArguments,
} from '@edenlabs/eden-sdk'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

const sessionRoutesV2: FastifyPluginAsync = async server => {
  // Helper to create consistent preHandlers
  const sessionPreHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    await isAuth(server, request, reply)
    await hasFeatureFlag(request, reply, FeatureFlag.SessionsV2)
  }

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
        scenario: Type.Optional(Type.String({ maxLength: 1000 })),
        budget: Type.Optional(
          Type.Object({
            manna_budget: Type.Optional(
              Type.Number({ minimum: 100, maximum: 50000 }),
            ),
            token_budget: Type.Optional(
              Type.Number({ minimum: 1000, maximum: 1000000 }),
            ),
            turn_budget: Type.Optional(
              Type.Number({ minimum: 1, maximum: 1000 }),
            ),
          }),
        ),
        title: Type.Optional(Type.String({ maxLength: 1000 })),
        autonomy_settings: Type.Optional(
          Type.Object({
            auto_reply: Type.Boolean(),
            reply_interval: Type.Number({ minimum: 0, maximum: 3600 }),
            actor_selection_method: Type.Union([
              Type.Literal('random'),
              Type.Literal('random_exclude_last'),
            ]),
          }),
        ),
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
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => createSession(server, request, reply),
  })

  server.post<{
    Body: SessionsV2MessageArguments
  }>('/v2/sessions', {
    schema: {
      tags: ['Sessions'],
      description: 'Interact with a session',
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
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => createSessionMessage(server, request, reply),
  })

  server.post<{
    Body: SessionsV2MessageArguments & { stream?: boolean }
  }>('/v2/sessions/stream', {
    schema: {
      tags: ['Sessions'],
      description: 'Interact with a session (streaming)',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        session_id: Type.Optional(Type.String()),
        content: Type.Optional(Type.String()),
        attachments: Type.Optional(Type.Array(Type.String())),
        stream: Type.Optional(Type.Boolean()),
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) =>
      createSessionMessageStream(server, request, reply),
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
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => addSessionMessageReaction(request, reply),
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
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
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
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => getSession(server, request, reply),
  })

  server.patch<{
    Params: Pick<SessionsV2RenameArguments, 'session_id'>
    Body: Pick<SessionsV2RenameArguments, 'title'>
  }>('/v2/sessions/:session_id', {
    schema: {
      tags: ['Sessions'],
      description: 'Modify a session',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        session_id: Type.String(),
      },
      body: {
        title: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
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
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
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
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => deleteSession(request, reply),
  })
}

export default sessionRoutesV2

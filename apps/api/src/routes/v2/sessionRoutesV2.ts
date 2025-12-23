import { getSessionTriggers } from '../../controllers/agentServicesController'
import {
  isSessionActive,
  trackSessionView,
  untrackSessionView,
} from '../../controllers/sessionTrackingController'
import {
  addPassiveMessage,
  addSessionMessageReaction,
  addSessionToolCallReaction,
  cancelSession,
  createSession,
  createSessionMessage,
  createSessionShare,
  deleteSession,
  deleteSessionShare,
  getSession,
  getSessionMessages,
  getSessionPermissions,
  getSharedSession,
  getSharedSessions,
  listSessions,
  listUserShares,
  renameSession,
  updateSessionPermissions,
  updateSessionStatus,
} from '../../controllers/v2/sessionControllerV2'
import { isAdmin, isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { paginatedResponse, paginationProperties } from '../index'
import {
  SessionsV2CreateArguments,
  SessionsV2DeleteArguments,
  SessionsV2ListArguments,
  SessionsV2MessageArguments,
  SessionsV2MessageReactArguments,
  SessionsV2RenameArguments,
  SessionsV2ToolCallReactArguments,
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
  }

  server.post<{
    Body: SessionsV2CreateArguments
  }>('/v2/sessions/create', {
    schema: {
      tags: ['Sessions'],
      summary: 'Create New Session',
      description:
        'Create a new conversation session with one or more agents, including budget and autonomy settings.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        agent_ids: Type.Array(Type.String(), { minItems: 1 }),
        context: Type.Optional(Type.String({ maxLength: 5000 })),
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
        session_type: Type.Optional(
          Type.Union([
            Type.Literal('passive'),
            Type.Literal('natural'),
            Type.Literal('automatic'),
          ]),
        ),
        status: Type.Optional(
          Type.Union([
            Type.Literal('active'),
            Type.Literal('paused'),
            Type.Literal('stopped'),
            Type.Literal('archived'),
          ]),
        ),
        settings: Type.Optional(
          Type.Object({
            conductor_prompt: Type.Optional(Type.String({ maxLength: 2000 })),
            delay_interval: Type.Optional(
              Type.Number({ minimum: 0, maximum: 86400 }),
            ),
            mention_force_reply: Type.Optional(Type.Boolean()),
          }),
        ),
        extras: Type.Optional(
          Type.Object({
            exclude_memory: Type.Optional(Type.Boolean()),
          }),
        ),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          session: Type.Any(),
        }),
        400: Type.Object({
          message: Type.Optional(Type.String()),
        }),
        401: Type.Object({
          message: Type.Optional(Type.String()),
        }),
        404: Type.Object({
          message: Type.Optional(Type.String()),
        }),
        500: Type.Object({
          error: Type.Optional(Type.Any()),
          message: Type.Optional(Type.String()),
        }),
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => createSession(server, request, reply),
  })

  server.post<{
    Body: SessionsV2MessageArguments & {
      stream?: boolean
      thinking?: boolean
      agent_ids?: string[]
      context?: string
      budget?: {
        manna_budget?: number
        token_budget?: number
        turn_budget?: number
      }
      title?: string
      session_type?: 'passive' | 'natural' | 'automatic'
      settings?: {
        conductor_prompt?: string
        delay_interval: number
        mention_force_reply: boolean
      }
      extras?: {
        exclude_memory?: boolean
        is_public?: boolean
      }
    }
  }>('/v2/sessions', {
    schema: {
      tags: ['Sessions'],
      summary: 'Interact with Session',
      description:
        'Send a message to an existing session or create a new session with the first message.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        session_id: Type.Optional(Type.String()),
        content: Type.Optional(Type.String()),
        attachments: Type.Optional(Type.Array(Type.String())),
        stream: Type.Optional(Type.Boolean()),
        thinking: Type.Optional(Type.Boolean()),
        agent_ids: Type.Optional(Type.Array(Type.String())),
        context: Type.Optional(Type.String({ maxLength: 5000 })),
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
        session_type: Type.Optional(
          Type.Union([
            Type.Literal('passive'),
            Type.Literal('natural'),
            Type.Literal('automatic'),
          ]),
        ),
        settings: Type.Optional(
          Type.Object({
            conductor_prompt: Type.Optional(Type.String({ maxLength: 2000 })),
            delay_interval: Type.Optional(
              Type.Number({ minimum: 0, maximum: 86400 }),
            ),
            mention_force_reply: Type.Optional(Type.Boolean()),
          }),
        ),
        extras: Type.Optional(
          Type.Object({
            exclude_memory: Type.Optional(Type.Boolean()),
          }),
        ),
      }),
      response: {
        200: Type.Object({
          session_id: Type.String(),
        }),
        400: Type.Object({
          message: Type.Optional(Type.String()),
        }),
        401: Type.Object({
          message: Type.Optional(Type.String()),
        }),
        404: Type.Object({
          message: Type.Optional(Type.String()),
        }),
        500: Type.Object({
          error: Type.Optional(Type.Any()),
          message: Type.Optional(Type.String()),
        }),
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => createSessionMessage(server, request, reply),
  })

  server.post<{
    Body: SessionsV2MessageReactArguments
  }>('/v2/sessions/react', {
    schema: {
      tags: ['Sessions'],
      summary: 'React to Message',
      description:
        'Add an emoji reaction to a specific message within a session.',
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

  server.post<{
    Body: SessionsV2ToolCallReactArguments
  }>('/v2/sessions/tool-react', {
    schema: {
      tags: ['Sessions'],
      summary: 'React to Tool Call',
      description:
        'Add a text reaction to a specific tool call within a message.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        message_id: Type.String(),
        tool_call_id: Type.String(),
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
        403: {
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
    handler: (request, reply) =>
      addSessionToolCallReaction(server, request, reply),
  })

  server.get<{
    Querystring: SessionsV2ListArguments
  }>('/v2/sessions', {
    schema: {
      tags: ['Sessions'],
      summary: 'List User Sessions',
      description:
        'Retrieve a paginated list of sessions for the authenticated user, optionally filtered by agent.',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          ...paginationProperties(),
          agent_id: Type.Optional(Type.String()),
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
    Params: { session_id: string }
    Querystring: { parent_session_id?: string }
  }>('/v2/sessions/:session_id', {
    schema: {
      tags: ['Sessions'],
      summary: 'Get Session Details',
      description:
        'Retrieve detailed information about a specific session with the latest 25 messages. Use the dedicated messages endpoint for pagination. Public sessions can be accessed without authentication if is_public is true. Child sessions can be accessed without authentication if their parent session is public (pass parent_session_id query param).',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        session_id: Type.String(),
      },
      querystring: Type.Object({
        parent_session_id: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          session: Type.Any(),
          hasMore: Type.Optional(Type.Boolean()),
          nextCursor: Type.Optional(Type.String()),
        }),
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getSession(server, request, reply),
  })

  server.get<{
    Params: { session_id: string }
    Querystring: { cursor?: string; limit?: string }
  }>('/v2/sessions/:session_id/messages', {
    schema: {
      tags: ['Sessions'],
      summary: 'Get Session Messages (Paginated)',
      description:
        'Fetch messages for a session with cursor-based pagination. Returns messages in chronological order (oldest first). Public sessions can be accessed without authentication if is_public is true.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        session_id: Type.String(),
      },
      querystring: {
        cursor: Type.Optional(Type.String()),
        limit: Type.Optional(Type.String()),
      },
      response: {
        200: Type.Object({
          messages: Type.Array(Type.Any()),
          hasMore: Type.Boolean(),
          nextCursor: Type.Optional(Type.String()),
        }),
        400: {
          message: Type.Optional(Type.String()),
        },
        403: {
          message: Type.Optional(Type.String()),
        },
        404: {
          message: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getSessionMessages(server, request, reply),
  })

  server.patch<{
    Params: Pick<SessionsV2RenameArguments, 'session_id'>
    Body: Omit<SessionsV2RenameArguments, 'session_id'>
  }>('/v2/sessions/:session_id', {
    schema: {
      tags: ['Sessions'],
      summary: 'Update Session',
      description:
        'Update session properties such as title, pinned status, type, settings, context, and budget.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: Type.Object({
        session_id: Type.String(),
      }),
      body: Type.Object({
        title: Type.Optional(Type.String({ minLength: 1, maxLength: 1000 })),
        pinned: Type.Optional(Type.Boolean()),
        extras: Type.Optional(
          Type.Object({
            exclude_memory: Type.Optional(Type.Boolean()),
            is_public: Type.Optional(Type.Boolean()),
          }),
        ),
        agent_ids: Type.Optional(Type.Array(Type.String())),
        session_type: Type.Optional(
          Type.Union([
            Type.Literal('passive'),
            Type.Literal('natural'),
            Type.Literal('automatic'),
          ]),
        ),
        settings: Type.Optional(
          Type.Object({
            conductor_prompt: Type.Optional(Type.String({ maxLength: 2000 })),
            delay_interval: Type.Optional(
              Type.Number({ minimum: 0, maximum: 3600 }),
            ),
            mention_force_reply: Type.Optional(Type.Boolean()),
          }),
        ),
        context: Type.Optional(Type.String({ maxLength: 5000 })),
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
        status: Type.Optional(
          Type.Union([
            Type.Literal('active'),
            Type.Literal('paused'),
            Type.Literal('stopped'),
            Type.Literal('archived'),
          ]),
        ),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
        }),
        400: Type.Object({
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        }),
        401: Type.Object({
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        }),
        404: Type.Object({
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        }),
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => renameSession(server, request, reply),
  })

  server.delete<{
    Params: SessionsV2DeleteArguments
  }>('/v2/sessions/:session_id', {
    schema: {
      tags: ['Sessions'],
      summary: 'Delete Session',
      description:
        'Permanently delete a session and all its associated messages and data.',
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
        400: Type.Object({
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        }),
        401: Type.Object({
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        }),
        404: Type.Object({
          error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        }),
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => deleteSession(request, reply),
  })

  server.post<{
    Params: { session_id: string }
    Body: {
      tool_call_id?: string
      tool_call_index?: number
    }
  }>('/v2/sessions/:session_id/cancel', {
    schema: {
      tags: ['Sessions'],
      summary: 'Cancel Session',
      description:
        'Cancel a currently running session and stop any ongoing tool executions.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        session_id: Type.String(),
      },
      body: Type.Object({
        tool_call_id: Type.Optional(Type.String()),
        tool_call_index: Type.Optional(Type.Number()),
      }),
      response: {
        200: Type.Object({
          status: Type.String(),
          session_id: Type.String(),
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
    handler: (request, reply) => cancelSession(server, request, reply),
  })

  server.post<{
    Body: {
      session_id: string
      status: string
    }
  }>('/v2/sessions/status', {
    schema: {
      tags: ['Sessions'],
      summary: 'Update Session Status',
      description:
        'Update the status of a session (active, paused, stopped, or archived).',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        session_id: Type.String(),
        status: Type.Union([
          Type.Literal('active'),
          Type.Literal('paused'),
          Type.Literal('stopped'),
          Type.Literal('archived'),
        ]),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          error: Type.Optional(Type.String()),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        401: Type.Object({
          message: Type.String(),
        }),
        403: Type.Object({
          message: Type.String(),
        }),
        404: Type.Object({
          message: Type.String(),
        }),
        500: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => updateSessionStatus(server, request, reply),
  })

  // Session Share Routes
  server.post<{
    Params: { session_id: string }
    Body: { message_id: string; title?: string }
  }>('/v2/sessions/:session_id/share', {
    schema: {
      tags: ['Sessions'],
      summary: 'Share Session',
      description:
        'Create a shareable public link for a session up to a specific message point.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        session_id: Type.String(),
      },
      body: {
        message_id: Type.String(),
        title: Type.Optional(Type.String({ maxLength: 200 })),
      },
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          share_id: Type.String(),
          share_url: Type.String(),
        }),
        400: {
          error: Type.Optional(Type.String()),
        },
        403: {
          error: Type.Optional(Type.String()),
        },
        404: {
          error: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => createSessionShare(server, request, reply),
  })

  server.get<{
    Params: { share_id: string }
  }>('/v2/sessions/share/:share_id', {
    schema: {
      tags: ['Sessions'],
      summary: 'Get Shared Session',
      description:
        'Retrieve a publicly shared session using its share ID (no authentication required).',
      params: {
        share_id: Type.String(),
      },
      response: {
        200: Type.Object({
          share: Type.Object({
            share_id: Type.String(),
            title: Type.Optional(Type.String()),
            session: Type.Any(),
            messages: Type.Array(Type.Any()),
            owner: Type.Any(),
            createdAt: Type.String(),
            child_shares: Type.Optional(
              Type.Record(Type.String(), Type.String()),
            ),
          }),
        }),
        404: {
          error: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.String()),
        },
      },
    },
    // No auth required - this is a public endpoint
    handler: (request, reply) => getSharedSession(server, request, reply),
  })

  server.delete<{
    Params: { share_id: string }
  }>('/v2/sessions/share/:share_id', {
    schema: {
      tags: ['Sessions'],
      summary: 'Delete Session Share',
      description:
        'Delete a session share link, making it no longer accessible publicly.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        share_id: Type.String(),
      },
      response: {
        200: Type.Object({
          success: Type.Boolean(),
        }),
        400: {
          error: Type.Optional(Type.String()),
        },
        403: {
          error: Type.Optional(Type.String()),
        },
        404: {
          error: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => deleteSessionShare(server, request, reply),
  })

  server.get('/v2/sessions/shares', {
    schema: {
      tags: ['Sessions'],
      summary: 'List User Shares',
      description:
        'Retrieve all session shares created by the authenticated user.',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: Type.Object({
          shares: Type.Array(Type.Any()),
        }),
        400: {
          error: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => listUserShares(server, request, reply),
  })

  // server.get<{
  //   Params: { session_id: string }
  // }>('/v2/sessions/:session_id/stream', {
  //   schema: {
  //     tags: ['Sessions'],
  //     summary: 'Stream Session Updates',
  //     description:
  //       'Establish a Server-Sent Events connection to receive real-time updates for a session.',
  //     security: [
  //       {
  //         apiKey: [],
  //       },
  //     ],
  //     params: {
  //       session_id: Type.String(),
  //     },
  //     response: {
  //       404: {
  //         error: Type.Optional(Type.String()),
  //         message: Type.Optional(Type.String()),
  //       },
  //       400: {
  //         error: Type.Optional(Type.String()),
  //         message: Type.Optional(Type.String()),
  //       },
  //       403: {
  //         error: Type.Optional(Type.String()),
  //         message: Type.Optional(Type.String()),
  //       },
  //     },
  //   },
  //   preHandler: [(request, reply) => sessionPreHandler(request, reply)],
  //   handler: (request, reply) => streamSession(server, request, reply),
  // })

  // Session Permissions Routes
  server.get<{
    Params: { session_id: string }
  }>('/v2/sessions/:session_id/permissions', {
    schema: {
      tags: ['Sessions - Permissions'],
      summary: 'Get Session Permissions',
      description:
        'Retrieve the list of users who have been granted access to a session.',
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
          permissions: Type.Array(Type.Any()),
        }),
        401: {
          error: Type.Optional(Type.String()),
        },
        404: {
          error: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => getSessionPermissions(request, reply),
  })

  server.put<{
    Params: { session_id: string }
    Body: {
      permissions: Array<{
        username: string
        level: 'editor' | 'owner' | 'participant' | 'viewer'
      }>
    }
  }>('/v2/sessions/:session_id/permissions', {
    schema: {
      tags: ['Sessions - Permissions'],
      summary: 'Update Session Permissions',
      description:
        'Grant or update user permissions for a session. Only the session owner can modify permissions.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        session_id: Type.String(),
      },
      body: {
        permissions: Type.Array(
          Type.Object({
            username: Type.String(),
            level: Type.Union([
              Type.Literal('editor'),
              Type.Literal('owner'),
              Type.Literal('participant'),
              Type.Literal('viewer'),
            ]),
          }),
        ),
      },
      response: {
        200: Type.Object({
          success: Type.Boolean(),
        }),
        401: {
          error: Type.Optional(Type.String()),
        },
        404: {
          error: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) =>
      updateSessionPermissions(server, request, reply),
  })

  server.get('/v2/sessions/shared', {
    schema: {
      tags: ['Sessions - Permissions'],
      summary: 'Get Shared Sessions',
      description:
        'Retrieve all sessions that have been shared with the authenticated user.',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: Type.Object({
          sharedSessions: Type.Array(Type.Any()),
        }),
        401: {
          error: Type.Optional(Type.String()),
        },
        500: {
          error: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => getSharedSessions(request, reply),
  })

  // Session Tracking Routes (for notification system)
  server.post('/v2/sessions/track-view', {
    schema: {
      hide: true,
      tags: ['Sessions - Tracking'],
      summary: 'Track Session View',
      description:
        'Mark a session as actively being viewed by the current user (used for notification system).',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        session_id: Type.String(),
      }),
      response: {
        200: Type.Object({
          tracked: Type.Boolean(),
          reason: Type.Optional(Type.String()),
        }),
        500: Type.Object({
          tracked: Type.Boolean(),
          reason: Type.Optional(Type.String()),
          error: Type.Optional(Type.String()),
        }),
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => trackSessionView(server, request, reply),
  })

  server.post('/v2/sessions/untrack-view', {
    schema: {
      hide: true,
      tags: ['Sessions - Tracking'],
      summary: 'Untrack Session View',
      description:
        'Mark a session as no longer being viewed by the current user.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        session_id: Type.String(),
      }),
      response: {
        200: Type.Object({
          tracked: Type.Boolean(),
          reason: Type.Optional(Type.String()),
        }),
        500: Type.Object({
          tracked: Type.Boolean(),
          reason: Type.Optional(Type.String()),
          error: Type.Optional(Type.String()),
        }),
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => untrackSessionView(server, request, reply),
  })

  server.get('/v2/sessions/is-active', {
    schema: {
      hide: true,
      tags: ['Sessions - Tracking'],
      summary: 'Check if Session is Active',
      description:
        'Check if a user is actively viewing a session (admin only - used by backend).',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: Type.Object({
        user_id: Type.String(),
        session_id: Type.String(),
      }),
      response: {
        200: Type.Object({
          is_active: Type.Boolean(),
          redis_available: Type.Boolean(),
          error: Type.Optional(Type.String()),
        }),
      },
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => isSessionActive(server, request, reply),
  })

  // Add passive message endpoint (for realtime voice conversations)
  server.post<{
    Body: {
      session_id: string
      user_id: string
      role: 'user' | 'assistant'
      content: string
    }
  }>('/v2/sessions/add-message', {
    schema: {
      tags: ['Sessions'],
      summary: 'Add Passive Message',
      description:
        'Add a message to a session without triggering agent responses. Used for realtime voice conversations where messages are recorded but should not trigger the async prompt flow.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        session_id: Type.String(),
        user_id: Type.String(),
        role: Type.Union([Type.Literal('user'), Type.Literal('assistant')]),
        content: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message_id: Type.String(),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        404: Type.Object({
          message: Type.String(),
        }),
        500: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => addPassiveMessage(server, request, reply),
  })

  // Get all triggers for a specific session
  server.get<{
    Params: { sessionId: string }
  }>('/v2/sessions/:sessionId/triggers', {
    schema: {
      tags: ['Sessions', 'Triggers'],
      summary: 'Get Session Triggers',
      description: 'Retrieve all triggers for a specific session.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: Type.Object({
        sessionId: Type.String(),
      }),
      response: {
        200: Type.Object({
          triggers: Type.Array(Type.Any()),
        }),
        401: Type.Object({
          error: Type.String(),
        }),
        500: Type.Object({
          error: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => sessionPreHandler(request, reply)],
    handler: (request, reply) => getSessionTriggers(server, request, reply),
  })
}

export default sessionRoutesV2

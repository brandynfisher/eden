import {
  SubmitFeedbackBody,
  addLastAgent,
  hideAgent,
  listTransactions,
  pinAgent,
  requestAccountDeletion,
  submitUserFeedback,
  unpinAgent,
} from '../../controllers/v2/userControllerV2'
import { isAuth } from '../../middleware/authMiddleware'
import { paginatedResponse, paginationProperties } from '../index'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync, FastifyRequest } from 'fastify'

const userRoutes: FastifyPluginAsync = async server => {
  server.get('/v2/user/transactions', {
    schema: {
      tags: ['User'],
      summary: 'List User Transactions',
      description:
        'Retrieve a paginated list of transactions for the authenticated user.',
      hide: true,
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
    handler: (request, reply) => listTransactions(request, reply),
  })

  server.post('/v2/user/request-deletion', {
    schema: {
      tags: ['User'],
      summary: 'Request Account Deletion',
      description:
        'Submit a request to delete the authenticated user account. Rate limited to one request per 24 hours.',
      hide: true,
      response: {
        200: Type.Object({
          message: Type.String(),
          requestId: Type.Any(),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        429: Type.Object({
          message: Type.String(),
        }),
        500: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => requestAccountDeletion(request, reply),
  })

  server.post('/v2/user-preferences/add-last-agent', {
    schema: {
      tags: ['User'],
      summary: 'Add Last Agent',
      description:
        'Update user preferences by adding an agent to the last_agents list. Maintains a stack of up to 10 unique agents.',
      hide: true,
      body: Type.Object({
        agent_id: Type.String(),
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
          preferences: Type.Any(),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        500: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => addLastAgent(request, reply),
  })

  server.post('/v2/user-preferences/pin-agent', {
    schema: {
      tags: ['User'],
      summary: 'Pin Agent',
      description: 'Pin an agent to show it at the top of the agents list.',
      hide: true,
      body: Type.Object({
        agent_id: Type.String(),
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        500: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => pinAgent(request, reply),
  })

  server.post('/v2/user-preferences/unpin-agent', {
    schema: {
      tags: ['User'],
      summary: 'Unpin Agent',
      description: 'Unpin an agent from the pinned agents list.',
      hide: true,
      body: Type.Object({
        agent_id: Type.String(),
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        500: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => unpinAgent(request, reply),
  })

  server.post('/v2/user-preferences/hide-agent', {
    schema: {
      tags: ['User'],
      summary: 'Hide Agent',
      description: 'Hide an agent from the agents list.',
      hide: true,
      body: Type.Object({
        agent_id: Type.String(),
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        500: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => hideAgent(request, reply),
  })

  server.post('/v2/user/feedback', {
    schema: {
      tags: ['User'],
      summary: 'Submit Feedback',
      description:
        'Submit a feedback request that notifies Eden support. Limited to five submissions per day.',
      body: Type.Object({
        message: Type.String({ minLength: 5, maxLength: 5000 }),
        subject: Type.Optional(Type.String({ maxLength: 200 })),
        category: Type.Optional(Type.String({ maxLength: 120 })),
      }),
      response: {
        201: Type.Object({
          message: Type.String(),
          feedbackId: Type.String(),
          remainingSubmissionsToday: Type.Number(),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        429: Type.Object({
          message: Type.String(),
        }),
        500: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request: FastifyRequest<{ Body: SubmitFeedbackBody }>, reply) =>
      submitUserFeedback(request, reply),
  })
}

export default userRoutes

import { paginatedResponse, paginationProperties } from '..'
import {
  checkUsernameAvailability,
  getCreator,
  getCreatorMe,
  listCreators,
  updateCreator,
} from '../../controllers/creatorsController'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const creatorRoutes: FastifyPluginAsync = async server => {
  server.get('/v2/creators', {
    schema: {
      tags: ['Creators'],
      summary: 'List Creators',
      description:
        'Retrieve a paginated list of creators, optionally filtered by user ID or Discord ID.',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'array'] },
          discordId: { type: ['string', 'array'] },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    handler: (request, reply) => listCreators(request, reply),
  })

  server.get('/v2/creators/me', {
    schema: {
      tags: ['Creators'],
      summary: 'Get Authenticated Creator Profile',
      description:
        'Retrieve your own creator profile information including balances and subscription details.',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: Type.Object({
          creator: Type.Optional(Type.Any()),
          balance: Type.Number(),
          subscriptionBalance: Type.Number(),
          foreverBalance: Type.Number(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getCreatorMe(request, reply),
  })

  server.get('/v2/creators/check-username', {
    schema: {
      tags: ['Creators'],
      summary: 'Check Username Availability',
      description:
        'Check if a username is available for use. Performs case-insensitive lookup across all users.',
      querystring: Type.Object({
        username: Type.String({ minLength: 1 }),
      }),
      response: {
        200: Type.Object({
          available: Type.Boolean(),
          username: Type.String(),
        }),
        400: Type.Object({
          available: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
    handler: (request, reply) => checkUsernameAvailability(request, reply),
  })

  server.get('/v2/creators/:userId', {
    schema: {
      tags: ['Creators'],
      summary: 'Get Creator Details',
      description:
        'Retrieve detailed information about a specific creator by their user ID.',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: {
          creator: Type.Any(),
        },
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getCreator(request, reply),
  })

  server.post('/v2/creators/update', {
    schema: {
      tags: ['Creators'],
      summary: 'Update Creator Profile',
      description:
        'Update your creator profile settings including username, image, and preferences.',
      security: [
        {
          apiKey: [],
        },
      ],
      request: {
        body: Type.Object({
          username: Type.Optional(Type.String()),
          userImage: Type.Optional(Type.String()),
          preferences: Type.Optional(
            Type.Object({
              agent_spend_threshold: Type.Optional(Type.Number()),
            }),
          ),
        }),
      },
      response: {
        200: {
          creator: Type.Any(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateCreator(request, reply),
  })
}

export default creatorRoutes

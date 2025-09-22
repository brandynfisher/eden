import { paginatedResponse, paginationProperties } from '.'
import {
  creationDelete,
  creationRate,
  creationReact,
  creationUnreact,
  creationUpdate,
  getCreation,
  listCreations,
} from '../controllers/creationsController'
import { isAuth, maybeAuth } from '../middleware/authMiddleware'
import { ReactionType } from '@edenlabs/eden-sdk'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const creationRoutes: FastifyPluginAsync = async server => {
  server.get('/creations', {
    schema: {
      hide: true,
      tags: ['Creations'],
      summary: 'List Creations',
      description:
        'Retrieve a paginated list of creations with optional filtering by user ID or name.',
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
          name: { type: 'string' },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    handler: (request, reply) => listCreations(request, reply),
  })

  server.get('/creations/:creationId', {
    schema: {
      hide: true,
      tags: ['Creations'],
      summary: 'Get Creation Details',
      description:
        'Retrieve detailed information about a specific creation by its ID.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      params: {
        creationId: Type.String(),
      },
      response: {
        200: {
          creation: Type.Any(),
        },
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
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getCreation(request, reply),
  })

  server.patch('/creations/:creationId', {
    schema: {
      hide: true,
      tags: ['Creations'],
      summary: 'Update Creation',
      description:
        'Update creation properties such as privacy settings or soft delete status.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      params: {
        creationId: Type.String(),
      },
      body: Type.Object({
        deleted: Type.Optional(Type.Boolean()),
        isPrivate: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: {
          creation: Type.Any(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => creationUpdate(request, reply),
  })

  server.delete('/creations/:creationId', {
    schema: {
      hide: true,
      tags: ['Creations'],
      summary: 'Delete Creation',
      description:
        'Permanently delete a creation. This action cannot be undone.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      params: {
        creationId: Type.String(),
      },
      response: {
        200: {
          success: Type.Boolean(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => creationDelete(request, reply),
  })

  server.post('/creations/rate', {
    schema: {
      hide: true,
      tags: ['Creations'],
      summary: 'Rate Creation',
      description:
        'Submit a rating for a creation. Ratings help improve content quality and recommendations.',
      body: Type.Object({
        creationId: Type.String(),
        rating: Type.Strict(Type.Number()),
      }),
      response: {
        200: {
          success: Type.Boolean(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => creationRate(request, reply),
  })

  server.post('/creations/reactions/add', {
    schema: {
      hide: true,
      tags: ['Creations'],
      summary: 'Add Reaction',
      description:
        'Add a reaction (like, love, etc.) to a creation to express appreciation or feedback.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      body: Type.Object({
        creationId: Type.String(),
        reaction: Type.Enum(ReactionType),
      }),
      response: {
        200: {
          success: Type.Boolean(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => creationReact(request, reply),
  })

  server.post('/creations/reactions/remove', {
    schema: {
      hide: true,
      tags: ['Creations'],
      summary: 'Remove Reaction',
      description: 'Remove a previously added reaction from a creation.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      body: Type.Object({
        creationId: Type.String(),
        reaction: Type.Enum(ReactionType),
      }),
      response: {
        200: {
          success: Type.Boolean(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => creationUnreact(request, reply),
  })
}

export default creationRoutes

import { paginatedResponse, paginationProperties } from '..'
import { listCreations } from '../../controllers/creationsController'
import {
  creationBulkUpdate,
  creationUpdate,
  getCreation,
  likeCreation,
  searchCreations,
  unlikeCreation,
} from '../../controllers/v2/creationControllerV2'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const creationRoutesV2: FastifyPluginAsync = async server => {
  server.get('/v2/creations', {
    schema: {
      tags: ['Creations'],
      summary: 'List Creations',
      description:
        'Retrieve a paginated list of creations, optionally filtered by user ID or name.',
      security: [
        {
          apiKey: [],
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

  server.get('/v2/creations/:creationId', {
    schema: {
      tags: ['Creations'],
      summary: 'Get Creation Details',
      description:
        'Retrieve detailed information about a specific creation by its ID.',
      security: [
        {
          apiKey: [],
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
    handler: (request, reply) => getCreation(server, request, reply),
  })

  server.patch('/v2/creations/:creationId', {
    schema: {
      tags: ['Creations'],
      summary: 'Update Creation',
      description:
        'Update the visibility or deletion status of a specific creation.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        creationId: Type.String(),
      },
      body: Type.Object({
        public: Type.Optional(Type.Boolean()),
        deleted: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: {
          creation: Type.Any(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => creationUpdate(server, request, reply),
  })

  server.patch('/v2/creations/bulk', {
    schema: {
      tags: ['Creations'],
      summary: 'Bulk Update Creations',
      description:
        'Update the visibility or deletion status of multiple creations at once.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        creationIds: Type.Array(Type.String()),
        public: Type.Optional(Type.Boolean()),
        deleted: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: {
          results: Type.Array(
            Type.Object({
              creationId: Type.String(),
              status: Type.String(),
              error: Type.Optional(Type.Any()),
              creation: Type.Optional(Type.Any()),
            }),
          ),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => creationBulkUpdate(request, reply),
  })

  server.post('/v2/creations/:creationId/like', {
    schema: {
      tags: ['Creations'],
      summary: 'Like Creation',
      description:
        'Add a like to a creation, showing appreciation and boosting its visibility.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        creationId: Type.String(),
      },
      response: {
        200: {
          message: Type.String(),
        },
        400: {
          message: Type.String(),
        },
        404: {
          message: Type.String(),
        },
        500: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => likeCreation(server, request, reply),
  })

  server.delete('/v2/creations/:creationId/like', {
    schema: {
      tags: ['Creations'],
      summary: 'Unlike Creation',
      description: 'Remove a previously given like from a creation.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        creationId: Type.String(),
      },
      response: {
        200: {
          message: Type.String(),
        },
        400: {
          message: Type.String(),
        },
        404: {
          message: Type.String(),
        },
        500: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => unlikeCreation(server, request, reply),
  })

  server.get('/v2/creations/search', {
    schema: {
      tags: ['Creations'],
      summary: 'Search Creations by Embedding',
      description:
        'Search for creations using semantic search with CLIP embeddings.',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          agentId: { type: 'string' },
          userId: { type: 'string' },
          tool: { type: 'string' },
          ...paginationProperties(),
        },
        required: ['query'],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => searchCreations(server, request, reply),
  })
}

export default creationRoutesV2

import { ReactionType } from '@edenlabs/eden-sdk'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  creationDelete,
  creationRate,
  creationReact,
  creationUnreact,
  creationUpdate,
  getCreation,
  getCreationSimilar,
  listCreations,
} from '../controllers/creationsController'
import { isAuth, maybeAuth } from '../middleware/authMiddleware'

const creationRoutes: FastifyPluginAsync = async server => {
  server.get('/creations', {
    schema: {
      tags: ['Creations'],
      description: 'List creations',
      security: [
        {
          apiKey: [],
          apiSecret: [],
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
      tags: ['Creations'],
      description: 'Get a creation',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      params: {
        creationId: Type.String(),
      },
      response: {
        200: {
          creation: Type.Any(),
        },
      },
    },
    preHandler: [(request, reply) => maybeAuth(server, request, reply)],
    handler: (request, reply) => getCreation(request, reply),
  })

  server.patch('/creations/:creationId', {
    schema: {
      tags: ['Creations'],
      description: 'Update a creation',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      params: {
        creationId: Type.String(),
      },
      body: Type.Object({
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
      tags: ['Creations'],
      description: 'Delete a creation',
      security: [
        {
          apiKey: [],
          apiSecret: [],
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

  server.get('/creations/:creationId/similar', {
    schema: {
      tags: ['Creations'],
      description: 'Get similar creations',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      params: {
        creationId: Type.String(),
        n: Type.Number(),
      },
      response: {
        200: {
          similarCreations: Type.Array(Type.Any()),
        },
      },
    },
    handler: (request, reply) => getCreationSimilar(server, request, reply),
  })

  server.post('/creations/rate', {
    schema: {
      tags: ['Creations'],
      description: 'Rate a creation',
      hide: true,
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
      tags: ['Creations'],
      description: 'React to a creation',
      security: [
        {
          apiKey: [],
          apiSecret: [],
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
      tags: ['Creations'],
      description: 'Unreact to a creation',
      security: [
        {
          apiKey: [],
          apiSecret: [],
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

import { ReactionType } from '@edenlabs/eden-sdk'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  creationDelete,
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
      querystring: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'array'] },
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
      params: {
        creationId: Type.String(),
      },
      request: {
        body: Type.Object({
          isPrivate: Type.Optional(Type.Boolean()),
        }),
      },
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

  server.post('/creations/reactions/add', {
    schema: {
      request: {
        body: Type.Object({
          creationId: Type.String(),
          reaction: Type.Strict(Type.String(), ReactionType),
        }),
      },
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
      request: {
        body: Type.Object({
          creationId: Type.String(),
          reaction: Type.Strict(Type.String(), ReactionType),
        }),
      },
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

import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  followCreator,
  getCreator,
  listCreators,
  unfollowCreator,
  updateCreator,
} from '../controllers/creatorsController'
import { isAuth, maybeAuth } from '../middleware/authMiddleware'

const creatorRoutes: FastifyPluginAsync = async server => {
  server.get('/creators', {
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
    handler: (request, reply) => listCreators(request, reply),
  })

  server.get('/creators/:userId', {
    schema: {
      response: {
        200: {
          creator: Type.Any(),
        },
      },
    },
    preHandler: [async request => maybeAuth(server, request)],
    handler: (request, reply) => getCreator(request, reply),
  })

  server.post('/creators/update', {
    schema: {
      request: {
        body: Type.Object({
          username: Type.Optional(Type.String()),
        }),
      },
      response: {
        200: {
          creator: Type.Any(),
        },
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => updateCreator(request, reply),
  })

  server.post('/creators/follow', {
    schema: {
      request: {
        body: Type.Object({
          userId: Type.String(),
        }),
      },
      response: {
        200: {
          success: Type.Boolean(),
        },
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => followCreator(request, reply),
  })

  server.post('/creators/unfollow', {
    schema: {
      request: {
        body: Type.Object({
          userId: Type.String(),
        }),
      },
      response: {
        200: {
          success: Type.Boolean(),
        },
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => unfollowCreator(request, reply),
  })
}

export default creatorRoutes

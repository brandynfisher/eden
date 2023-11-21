import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  followCreator,
  getCreator,
  getCreatorMe,
  listCreatorFollowers,
  listCreatorFollowing,
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

  server.get('/creators/:userId/followers', {
    schema: {
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
    preHandler: [(request, reply) => maybeAuth(server, request, reply)],
    handler: (request, reply) => listCreatorFollowers(request, reply),
  })

  server.get('/creators/:userId/following', {
    schema: {
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
    preHandler: [(request, reply) => maybeAuth(server, request, reply)],
    handler: (request, reply) => listCreatorFollowing(request, reply),
  })

  server.get('/creators/:userId', {
    schema: {
      response: {
        200: {
          creator: Type.Any(),
        },
      },
    },
    preHandler: [(request, reply) => maybeAuth(server, request, reply)],
    handler: (request, reply) => getCreator(request, reply),
  })

  server.post('/creators/update', {
    schema: {
      request: {
        body: Type.Object({
          username: Type.Optional(Type.String()),
          userImage: Type.Optional(Type.String()),
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
    preHandler: [(request, reply) => isAuth(server, request, reply)],
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
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => unfollowCreator(request, reply),
  })

  server.get('/creators/me', {
    schema: {
      response: {
        200: Type.Object({
          creator: Type.Optional(Type.Any()),
          balance: Type.Number(),
          pendingTasks: Type.Optional(Type.Any()),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getCreatorMe(request, reply),
  })
}

export default creatorRoutes

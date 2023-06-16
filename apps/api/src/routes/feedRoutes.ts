import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginationProperties } from '.'
import { getFeed } from '../controllers/feedController'
import { maybeAuth } from '../middleware/authMiddleware'

const authRoutes: FastifyPluginAsync = async server => {
  server.get('/feed', {
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
        200: Type.Object({
          docs: Type.Array(Type.Any()),
          bookmarks: Type.Optional(Type.Record(Type.String(), Type.Boolean())),
          reactions: Type.Optional(
            Type.Record(
              Type.String(),
              Type.Record(Type.String(), Type.Boolean()),
            ),
          ),
          total: Type.Number(),
          limit: Type.Number(),
          pages: Type.Number(),
          page: Type.Number(),
          pagingCounter: Type.Number(),
          hasPrevPage: Type.Boolean(),
          hasNextPage: Type.Boolean(),
          prevPage: Type.Optional(Type.Number()),
          nextPage: Type.Optional(Type.Number()),
        }),
      },
    },
    preHandler: [async request => maybeAuth(server, request)],
    handler: (request, reply) => getFeed(request, reply),
  })
}

export default authRoutes

import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
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
        200: paginatedResponse(Type.Any()),
      },
    },
    preHandler: [async request => maybeAuth(server, request)],
    handler: (request, reply) => getFeed(request, reply),
  })
}

export default authRoutes

import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginationProperties } from '.'
import {
  getConceptsFeed,
  getCreationsFeed,
} from '../controllers/feedController'
import { maybeAuth } from '../middleware/authMiddleware'

const feedRoutes: FastifyPluginAsync = async server => {
  server.get('/feed/creations', {
    schema: {
      tags: ['Feed'],
      description: 'Get creations feed',
      hide: true,
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
          characterId: { type: ['string', 'array'] },
          collectionId: { type: ['string', 'array'] },
          conceptId: { type: ['string', 'array'] },
          name: { type: 'string' },
          dateCutOff: { type: 'string' },
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
    preHandler: [(request, reply) => maybeAuth(server, request, reply)],
    handler: (request, reply) => getCreationsFeed(request, reply),
  })

  server.get('/feed/concepts', {
    schema: {
      tags: ['Feed'],
      description: 'Get concepts feed',
      hide: true,
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
          collectionId: { type: ['string', 'array'] },
          name: { type: 'string' },
          dateCutOff: { type: 'string' },
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
    preHandler: [(request, reply) => maybeAuth(server, request, reply)],
    handler: (request, reply) => getConceptsFeed(request, reply),
  })
}

export default feedRoutes

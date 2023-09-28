import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import { getConcept, listConcepts } from '../controllers/conceptsController'
import { maybeAuth } from '../middleware/authMiddleware'

const conceptRoutes: FastifyPluginAsync = async server => {
  server.get('/concepts', {
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
    handler: (request, reply) => listConcepts(request, reply),
  })

  server.get('/concepts/:conceptId', {
    schema: {
      params: {
        conceptId: Type.String(),
      },
      response: {
        200: {
          concept: Type.Any(),
        },
      },
    },
    preHandler: [(request, reply) => maybeAuth(server, request, reply)],
    handler: (request, reply) => getConcept(request, reply),
  })
}

export default conceptRoutes

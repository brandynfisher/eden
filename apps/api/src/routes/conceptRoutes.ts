import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  conceptDelete,
  conceptUpdate,
  getConcept,
  listConcepts,
} from '../controllers/conceptsController'
import { isAuth, maybeAuth } from '../middleware/authMiddleware'

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
    preHandler: [async request => maybeAuth(server, request)],
    handler: (request, reply) => getConcept(request, reply),
  })

  server.patch('/concepts/:conceptId', {
    schema: {
      params: {
        conceptId: Type.String(),
      },
      request: {
        update: Type.Object({
          private: Type.Boolean(),
        }),
      },
      response: {
        200: {
          concept: Type.Any(),
        },
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => conceptUpdate(request, reply),
  })

  server.delete('/concepts/:conceptId', {
    schema: {
      params: {
        conceptId: Type.String(),
      },
      response: {
        200: {
          success: Type.Boolean(),
        },
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => conceptDelete(request, reply),
  })
}

export default conceptRoutes

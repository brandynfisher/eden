import { paginatedResponse, paginationProperties } from '..'
import { listCollections } from '../../controllers/v2/collectionControllerV2'
import { maybeAuthEden2 } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const collectionRoutesV2: FastifyPluginAsync = async server => {
  server.get('/v2/collections', {
    schema: {
      tags: ['Collections'],
      description: 'List collections',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'array'] },
          creationId: Type.Optional(Type.String()),
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    preHandler: [request => maybeAuthEden2(server, request)],
    handler: (request, reply) => listCollections(server, request, reply),
  })
}

export default collectionRoutesV2

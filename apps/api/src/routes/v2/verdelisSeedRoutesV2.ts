import { paginatedResponse, paginationProperties } from '..'
import {
  getVerdelisSeed,
  listVerdelisSeeds,
} from '../../controllers/v2/verdelisSeedControllerV2'
import { maybeAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const verdelisSeedRoutesV2: FastifyPluginAsync = async server => {
  // List verdelis seeds
  server.get('/v2/verdelis-seeds', {
    schema: {
      tags: ['Verdelis Seeds'],
      summary: 'List Verdelis Seeds',
      description:
        'Retrieve a paginated list of verdelis seeds, optionally filtered by agent.',
      security: [{ apiKey: [] }],
      querystring: {
        type: 'object',
        properties: {
          agentId: { type: 'string' },
          ...paginationProperties(),
        },
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => listVerdelisSeeds(server, request, reply),
  })

  // Get single verdelis seed
  server.get('/v2/verdelis-seeds/:seedId', {
    schema: {
      tags: ['Verdelis Seeds'],
      summary: 'Get Verdelis Seed Details',
      description:
        'Retrieve detailed information about a specific verdelis seed by its ID.',
      security: [{ apiKey: [] }],
      params: {
        seedId: Type.String(),
      },
      response: {
        200: { seed: Type.Any() },
        404: { message: Type.String() },
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getVerdelisSeed(server, request, reply),
  })
}

export default verdelisSeedRoutesV2

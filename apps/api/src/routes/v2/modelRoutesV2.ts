import { getModel, listModels } from '../../controllers/v2/modelControllerV2'
import { isAuthEden2 } from '../../middleware/authMiddleware'
import { modelV2Type } from '../../types/routeTypes'
import { paginatedResponse, paginationProperties } from '../index'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const modelRoutesV2: FastifyPluginAsync = async server => {
  server.get('/v2/models', {
    schema: {
      tags: ['Models'],
      description: 'List Models',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(modelV2Type),
      },
    },
    preHandler: [(request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) => listModels(request, reply),
  })

  server.get('/v2/models/:modelId', {
    schema: {
      tags: ['Models'],
      description: 'Get a Model',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        modelId: Type.String(),
      },
      response: {
        200: Type.Object({
          model: modelV2Type,
        }),
      },
    },
    preHandler: [(request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) => getModel(request, reply),
  })
}

export default modelRoutesV2

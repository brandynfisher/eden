import { getModel } from '../../controllers/v2/modelControllerV2'
import { maybeAuthEden2 } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const modelRoutesV2: FastifyPluginAsync = async server => {
  // server.get('/v2/models', {
  //   schema: {
  //     tags: ['Models'],
  //     description: 'List Models',
  //     security: [
  //       {
  //         apiKey: [],
  //       },
  //     ],
  //     querystring: {
  //       type: 'object',
  //       properties: {
  //         ...paginationProperties(),
  //       },
  //       required: [],
  //     },
  //     response: {
  //       200: paginatedResponse(modelV2Type),
  //     },
  //   },
  //   preHandler: [(request) => maybeAuthEden2(server, request)],
  //   handler: (request, reply) => listModels(request, reply),
  // })

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
        200: {
          model: Type.Any(),
        },
        400: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        401: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        404: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        500: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [request => maybeAuthEden2(server, request)],
    handler: (request, reply) => getModel(request, reply),
  })
}

export default modelRoutesV2

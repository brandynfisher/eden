import { getModel, modelUpdate } from '../../controllers/v2/modelControllerV2'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const modelRoutesV2: FastifyPluginAsync = async server => {
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getModel(server, request, reply),
  })

  server.patch('/v2/models/:modelId', {
    schema: {
      tags: ['Models'],
      description: 'Update a model',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        modelId: Type.String(),
      },
      body: Type.Object({
        public: Type.Optional(Type.Boolean()),
        deleted: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: {
          model: Type.Any(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => modelUpdate(request, reply),
  })
}

export default modelRoutesV2

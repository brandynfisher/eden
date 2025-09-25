import {
  getModel,
  likeModel,
  modelUpdate,
  unlikeModel,
} from '../../controllers/v2/modelControllerV2'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const modelRoutesV2: FastifyPluginAsync = async server => {
  server.get('/v2/models/:modelId', {
    schema: {
      tags: ['Models'],
      summary: 'Get Model Details',
      description:
        'Retrieve detailed information about a specific AI model by its ID.',
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
      summary: 'Update Model',
      description:
        'Update the visibility or deletion status of a specific model.',
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

  server.post('/v2/models/:modelId/like', {
    schema: {
      tags: ['Models'],
      summary: 'Like Model',
      description:
        'Add a like to a model, showing appreciation and boosting its visibility.',
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
          message: Type.String(),
        },
        400: {
          message: Type.String(),
        },
        404: {
          message: Type.String(),
        },
        500: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => likeModel(server, request, reply),
  })

  server.delete('/v2/models/:modelId/like', {
    schema: {
      tags: ['Models'],
      summary: 'Unlike Model',
      description: 'Remove a previously given like from a model.',
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
          message: Type.String(),
        },
        400: {
          message: Type.String(),
        },
        404: {
          message: Type.String(),
        },
        500: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => unlikeModel(server, request, reply),
  })
}

export default modelRoutesV2

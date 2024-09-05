import { paginatedResponse, paginationProperties } from '..'
import { listCreations } from '../../controllers/creationsController'
import { getCreation } from '../../controllers/v2/creationControllerV2'
import { creationUpdate } from '../../controllers/v2/creationControllerV2'
import { isAuthEden2, maybeAuthEden2 } from '../../middleware/authMiddleware'
// import { ReactionType } from '@edenlabs/eden-sdk'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const creationRoutesV2: FastifyPluginAsync = async server => {
  server.get('/v2/creations', {
    schema: {
      tags: ['Creations'],
      description: 'List creations',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'array'] },
          name: { type: 'string' },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    handler: (request, reply) => listCreations(request, reply),
  })

  server.get('/v2/creations/:creationId', {
    schema: {
      tags: ['Creations'],
      description: 'Get a creation',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        creationId: Type.String(),
      },
      response: {
        200: {
          creation: Type.Any(),
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
    handler: (request, reply) => getCreation(server, request, reply),
  })

  // server.patch('/v2/creations/:creationId', {
  //   schema: {
  //     tags: ['Creations'],
  //     description: 'Update a creation',
  //     security: [
  //       {
  //         apiKey: [],
  //         // apiSecret: [],
  //       },
  //     ],
  //     params: {
  //       creationId: Type.String(),
  //     },
  //     body: Type.Object({
  //       deleted: Type.Optional(Type.Boolean()),
  //       isPrivate: Type.Optional(Type.Boolean()),
  //     }),
  //     response: {
  //       200: {
  //         creation: Type.Any(),
  //       },
  //     },
  //   },
  //   preHandler: [async (request, reply) => isAuth(server, request, reply)],
  //   handler: (request, reply) => creationUpdate(request, reply),
  // })

  // server.delete('/v2/creations/:creationId', {
  //   schema: {
  //     tags: ['Creations'],
  //     description: 'Delete a creation',
  //     security: [
  //       {
  //         apiKey: [],
  //         // apiSecret: [],
  //       },
  //     ],
  //     params: {
  //       creationId: Type.String(),
  //     },
  //     response: {
  //       200: {
  //         success: Type.Boolean(),
  //       },
  //     },
  //   },
  //   preHandler: [async (request, reply) => isAuth(server, request, reply)],
  //   handler: (request, reply) => creationDelete(request, reply),
  // })

  // server.post('/v2/creations/rate', {
  //   schema: {
  //     tags: ['Creations'],
  //     description: 'Rate a creation',
  //     hide: true,
  //     body: Type.Object({
  //       creationId: Type.String(),
  //       rating: Type.Strict(Type.Number()),
  //     }),
  //     response: {
  //       200: {
  //         success: Type.Boolean(),
  //       },
  //     },
  //   },
  //   preHandler: [(request, reply) => isAuth(server, request, reply)],
  //   handler: (request, reply) => creationRate(request, reply),
  // })

  // server.post('/v2/creations/reactions/add', {
  //   schema: {
  //     tags: ['Creations'],
  //     description: 'React to a creation',
  //     security: [
  //       {
  //         apiKey: [],
  //         // apiSecret: [],
  //       },
  //     ],
  //     body: Type.Object({
  //       creationId: Type.String(),
  //       reaction: Type.Enum(ReactionType),
  //     }),
  //     response: {
  //       200: {
  //         success: Type.Boolean(),
  //       },
  //     },
  //   },
  //   preHandler: [(request, reply) => isAuth(server, request, reply)],
  //   handler: (request, reply) => creationReact(request, reply),
  // })

  // server.post('/v2/creations/reactions/remove', {
  //   schema: {
  //     tags: ['Creations'],
  //     description: 'Unreact to a creation',
  //     security: [
  //       {
  //         apiKey: [],
  //         // apiSecret: [],
  //       },
  //     ],
  //     body: Type.Object({
  //       creationId: Type.String(),
  //       reaction: Type.Enum(ReactionType),
  //     }),
  //     response: {
  //       200: {
  //         success: Type.Boolean(),
  //       },
  //     },
  //   },
  //   preHandler: [(request, reply) => isAuth(server, request, reply)],
  //   handler: (request, reply) => creationUnreact(request, reply),
  // })

  server.patch('/v2/creations/:creationId', {
    schema: {
      tags: ['Creations'],
      description: 'Update a creation',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      params: {
        creationId: Type.String(),
      },
      body: Type.Object({
        public: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: {
          creation: Type.Any(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) => creationUpdate(request, reply),
  })
}

export default creationRoutesV2

import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import { getCreation, listCreations } from '../controllers/creationsController'

const creationRoutes: FastifyPluginAsync = async server => {
  server.get('/creations', {
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
    handler: (request, reply) => listCreations(request, reply),
  })

  server.get('/creations/:creationId', {
    schema: {
      params: {
        creationId: Type.String(),
      },
      response: {
        200: {
          creation: Type.Any(),
        },
      },
    },
    handler: (request, reply) => getCreation(request, reply),
  })

  // server.get('/creation/:creationId/collections', {
  //   schema: {
  //     response: {
  //       200: {
  //         collections: Type.Array(Type.Any()),
  //       },
  //     },
  //   },
  //   handler: (request, reply) => getCollections(request, reply),
  // })

  // server.get('/creation/:creationId/recreations', {
  //   schema: {
  //     response: {
  //       200: {
  //         creations: Type.Array(Type.Any()),
  //       },
  //     },
  //   },
  //   handler: (request, reply) => getRecreations(request, reply),
  // })

  // server.post('/creation/:creationId/reactions', {
  //   schema: {
  //     request: {
  //       body: Type.Object({
  //         reactions: Type.Array(Type.String()),
  //       }),
  //     },
  //     response: {
  //       200: {
  //         reactions: Type.Array(Type.Any()),
  //       },
  //     },
  //   },
  //   handler: (request, reply) => getReactions(request, reply),
  // })

  // server.post('/creation/:creationId/react', {
  //   schema: {
  //     request: {
  //       body: Type.Object({
  //         reaction: Type.String(),
  //         unreact: Type.Boolean(),
  //       }),
  //     },
  //     response: {
  //       200: {
  //         success: Type.Boolean(),
  //       },
  //     },
  //   },
  //   preHandler: [async request => isAuth(server, request)],
  //   handler: (request, reply) => react(request, reply),
  // })
}

export default creationRoutes

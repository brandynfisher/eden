import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  createCapability,
  deleteCapability,
  getCapability,
  listCapabilities,
  updateCapability,
} from '../controllers/capabilityController'
import { isAuth } from '../middleware/authMiddleware'

const capabilityRoutes: FastifyPluginAsync = async server => {
  server.post('/capabilities/create', {
    schema: {
      body: Type.Object({
        characterId: Type.String(),
        name: Type.String(),
        type: Type.String(),
        data: Type.Any(),
      }),
      response: {
        200: Type.Object({
          capabilityId: Type.String(),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => createCapability(request, reply),
  })

  server.post('/capabilities/update', {
    schema: {
      body: Type.Object({
        capabilityId: Type.String(),
        name: Type.String(),
        data: Type.Any(),
      }),
      response: {
        200: Type.Object({
          capabilityId: Type.String(),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => updateCapability(request, reply),
  })

  server.post('/capabilities/delete', {
    schema: {
      body: Type.Object({
        capabilityId: Type.String(),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => deleteCapability(request, reply),
  })

  server.get('/capabilities', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          characterId: { type: ['string', 'array'] },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(
          Type.Object({
            id: Type.String(),
            name: Type.String(),
            type: Type.String(),
            data: Type.Any(),
          }),
        ),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => listCapabilities(request, reply),
  })

  server.get('/capabilities/:capabilityId', {
    schema: {
      params: Type.Object({
        capabilityId: Type.String(),
      }),
      response: {
        200: Type.Object({
          capability: Type.Object({
            name: Type.String(),
            type: Type.String(),
            data: Type.Any(),
          }),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => getCapability(request, reply),
  })
}

export default capabilityRoutes

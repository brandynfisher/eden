import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  createAgent,
  deleteAgent,
  getAgent,
  listAgents,
} from '../controllers/agentController'
import { isAuth } from '../middleware/authMiddleware'

const agentRoutes: FastifyPluginAsync = async server => {
  server.post('/agents/create', {
    schema: {
      body: Type.Object({
        name: Type.String(),
        capabilites: Type.Array(
          Type.Object({
            name: Type.String(),
            type: Type.String(),
            data: Type.Any(),
          }),
        ),
      }),
      response: {
        200: Type.Object({
          agentId: Type.String(),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => createAgent(request, reply),
  })

  server.post('/agents/delete', {
    schema: {
      body: Type.Object({
        agentId: Type.String(),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => deleteAgent(request, reply),
  })

  server.get('/agents', {
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
        200: paginatedResponse(
          Type.Object({
            id: Type.String(),
            name: Type.String(),
            capabilites: Type.Array(
              Type.Object({
                name: Type.String(),
                type: Type.String(),
                data: Type.Any(),
              }),
            ),
          }),
        ),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => listAgents(request, reply),
  })

  server.get('/agents/:agentId', {
    schema: {
      params: Type.Object({
        agentId: Type.String(),
      }),
      response: {
        200: Type.Object({
          agent: Type.Object({
            id: Type.String(),
            name: Type.String(),
            capabilites: Type.Array(
              Type.Object({
                name: Type.String(),
                type: Type.String(),
                data: Type.Any(),
              }),
            ),
          }),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => getAgent(request, reply),
  })
}

export default agentRoutes

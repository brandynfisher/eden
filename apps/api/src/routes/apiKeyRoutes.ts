import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { listQuery, paginatedResponse } from '.'
import {
  createApiKey,
  deleteApiKey,
  getApiKeys,
} from '../controllers/apiKeyController'
import { isAuth } from '../middleware/authMiddleware'

const apiKeyRoutes: FastifyPluginAsync = async server => {
  server.post('/apikeys/create', {
    schema: {
      body: Type.Object({
        note: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          apiKey: Type.Object({
            apiKey: Type.String(),
            apiSecret: Type.String(),
          }),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => createApiKey(request, reply),
  })

  server.post('/apikeys/delete', {
    schema: {
      body: Type.Object({
        apiKey: Type.String(),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => deleteApiKey(request, reply),
  })

  server.get('/apikeys', {
    schema: {
      querystring: listQuery(Type.Object({})),
      response: {
        200: paginatedResponse(
          Type.Object({
            apiKey: Type.String(),
            apiSecret: Type.String(),
            note: Type.Optional(Type.String()),
            createdAt: Type.String(),
          }),
        ),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => getApiKeys(request, reply),
  })
}

export default apiKeyRoutes

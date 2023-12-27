import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
} from '../controllers/apiKeyController'
import {
  hasFeatureFlag,
  isAuth,
  isSubscriber,
} from '../middleware/authMiddleware'
import { FeatureFlag } from '../models/Creator'

const apiKeyCreatePreHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const subscriber = await isSubscriber(request)
  const previewUser = await hasFeatureFlag(request, FeatureFlag.Preview)
  if (!subscriber && !previewUser) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
    })
  }
}

const apiKeyRoutes: FastifyPluginAsync = async server => {
  server.post('/apikeys/create', {
    schema: {
      tags: ['API Keys'],
      description: 'Create an API key',
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
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
    },
    preHandler: [
      (request, reply) => isAuth(server, request, reply),
      (request, reply) => apiKeyCreatePreHandler(request, reply),
    ],
    handler: (request, reply) => createApiKey(request, reply),
  })

  server.post('/apikeys/delete', {
    schema: {
      tags: ['API Keys'],
      description: 'Delete an API key',
      body: Type.Object({
        apiKey: Type.String(),
      }),
      response: {
        200: Type.Object({}),
      },
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteApiKey(request, reply),
  })

  server.get('/apikeys', {
    schema: {
      tags: ['API Keys'],
      description: 'List API keys',
      querystring: {
        type: 'object',
        properties: {
          ...paginationProperties(),
        },
        required: [],
      },
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
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listApiKeys(request, reply),
  })
}

export default apiKeyRoutes

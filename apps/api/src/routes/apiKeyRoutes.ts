import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
} from '../controllers/apiKeyController'
import { apiKeyCreatePreHandler } from '../lib/authorization'
import { isAuth } from '../middleware/authMiddleware'
import {
  ApiKeysCreateBodySchema,
  ApiKeysCreateResponseSchema,
  ApiKeysDeleteBodySchema,
  ApiKeysDeleteResponseSchema,
  ApiKeysListQuerySchema,
  ApiKeysListResponseSchema,
} from '@edenlabs/eden-sdk'
import { FastifyPluginAsync } from 'fastify'

const apiKeyRoutes: FastifyPluginAsync = async server => {
  server.post('/apikeys', {
    schema: {
      tags: ['API Keys'],
      summary: 'Create API Key',
      description:
        'Create a new API key for authentication. You can optionally provide a note to help identify the key.',
      body: ApiKeysCreateBodySchema,
      response: ApiKeysCreateResponseSchema,
      security: [
        {
          apiKey: [],
        },
      ],
    },
    preHandler: [
      (request, reply) => isAuth(server, request, reply),
      (request, reply) => apiKeyCreatePreHandler(request, reply),
    ],
    handler: (request, reply) => createApiKey(request, reply),
  })

  server.delete('/apikeys', {
    schema: {
      tags: ['API Keys'],
      summary: 'Delete API Key',
      description:
        'Permanently delete an API key. This action cannot be undone and the key will immediately become invalid.',
      body: ApiKeysDeleteBodySchema,
      response: ApiKeysDeleteResponseSchema,
      security: [
        {
          apiKey: [],
        },
      ],
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteApiKey(request, reply),
  })

  server.get('/apikeys', {
    schema: {
      tags: ['API Keys'],
      summary: 'List API Keys',
      description:
        'Retrieve a paginated list of your API keys. Only partial key values are returned for security.',
      querystring: ApiKeysListQuerySchema,
      response: ApiKeysListResponseSchema,
      security: [
        {
          apiKey: [],
        },
      ],
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listApiKeys(request, reply),
  })
}

export default apiKeyRoutes

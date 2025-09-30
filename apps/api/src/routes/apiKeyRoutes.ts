import { paginatedResponse, paginationProperties } from '.'
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
} from '../controllers/apiKeyController'
import { apiKeyCreatePreHandler } from '../lib/authorization'
import { isAuth } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const apiKeyRoutes: FastifyPluginAsync = async server => {
  server.post('/apikeys', {
    schema: {
      tags: ['API Keys'],
      summary: 'Create API Key',
      description:
        'Create a new API key for authentication. You can optionally provide a note to help identify the key.',
      body: Type.Object({
        note: Type.Optional(
          Type.String({
            description: 'Optional note to help identify this API key',
          }),
        ),
      }),
      response: {
        200: Type.Object({
          apiKey: Type.Object({
            apiKey: Type.String({
              description:
                "The generated API key - store this securely as it won't be shown again",
            }),
          }),
        }),
      },
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
      body: Type.Object({
        apiKey: Type.String({
          description: 'The API key to delete',
        }),
      }),
      response: {
        200: Type.Object({}),
      },
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
            apiKey: Type.String({
              description: 'Partial API key for identification',
            }),
            note: Type.Optional(
              Type.String({
                description: 'Optional note associated with this API key',
              }),
            ),
            createdAt: Type.String({
              description: 'ISO timestamp when the API key was created',
            }),
          }),
        ),
      },
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

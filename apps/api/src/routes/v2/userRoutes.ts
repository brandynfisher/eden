import {
  listTransactions,
  requestAccountDeletion,
} from '../../controllers/v2/userControllerV2'
import { isAuth } from '../../middleware/authMiddleware'
import { paginatedResponse, paginationProperties } from '../index'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const userRoutes: FastifyPluginAsync = async server => {
  server.get('/v2/user/transactions', {
    schema: {
      tags: ['User'],
      summary: 'List User Transactions',
      description:
        'Retrieve a paginated list of transactions for the authenticated user.',
      hide: true,
      querystring: {
        type: 'object',
        properties: {
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listTransactions(request, reply),
  })

  server.post('/v2/user/request-deletion', {
    schema: {
      tags: ['User'],
      summary: 'Request Account Deletion',
      description:
        'Submit a request to delete the authenticated user account. Rate limited to one request per 24 hours.',
      hide: true,
      response: {
        200: Type.Object({
          message: Type.String(),
          requestId: Type.Any(),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        429: Type.Object({
          message: Type.String(),
        }),
        500: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => requestAccountDeletion(request, reply),
  })
}

export default userRoutes

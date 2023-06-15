import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { createChallenge } from '../controllers/authController'
import { createMannaVoucher, modifyManna } from '../controllers/mannaController'
import { isAdmin } from '../middleware/authMiddleware'

export interface MannaModifyRequestBody {
  userId: string
  amount: number
}

const mannaRoutes: FastifyPluginAsync = async server => {
  server.post('/admin/manna/modify', {
    schema: {
      request: {
        body: Type.Object({
          userId: Type.String(),
          amount: Type.Number(),
        }),
      },
      response: {
        200: Type.Object({
          userId: Type.String(),
          manna: Type.Number(),
          transactionId: Type.String(),
        }),
      },
    },
    preHandler: [request => isAdmin(server, request)],
    handler: (request, reply) => modifyManna(request, reply),
  })

  server.post('/admin/manna/vouchers/create', {
    schema: {
      request: {
        body: Type.Object({
          amount: Type.Number(),
          allowedUserIds: Type.Optional(Type.Array(Type.String())),
        }),
      },
      response: {
        200: Type.Object({
          code: Type.String(),
        }),
      },
    },
    preHandler: [request => isAdmin(server, request)],
    handler: (request, reply) => createMannaVoucher(request, reply),
  })

  server.post('/admin/auth/challenge', {
    schema: {
      body: Type.Object({
        address: Type.String(),
        isWeb2: Type.Boolean(),
      }),
      response: {
        200: Type.Object({
          nonce: Type.String(),
        }),
      },
    },
    preHandler: [request => isAdmin(server, request)],
    handler: (request, reply) => createChallenge(request, reply),
  })
}

export default mannaRoutes

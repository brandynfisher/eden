import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { createChallenge } from '../controllers/authController'
import { createMannaVoucher, modifyManna } from '../controllers/mannaController'
import { uploadMediaAdmin } from '../controllers/mediaController'
import { isAdmin } from '../middleware/authMiddleware'

export interface MannaModifyRequestBody {
  userId: string
  amount: number
}

const adminRoutes: FastifyPluginAsync = async server => {
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
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
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
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
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
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => createChallenge(server, request, reply),
  })

  server.post('/admin/media/upload', {
    schema: {
      response: {
        200: Type.Object({
          url: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (req, reply) => uploadMediaAdmin(server, req, reply),
  })
}

export default adminRoutes

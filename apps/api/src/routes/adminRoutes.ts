import { createMannaVoucher, modifyManna } from '../controllers/mannaController'
import { isAdmin } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

export interface MannaModifyRequestBody {
  userId: string
  amount: number
  source?: string
}

const adminRoutes: FastifyPluginAsync = async server => {
  server.post('/admin/manna/modify', {
    schema: {
      tags: ['Admin'],
      summary: 'Modify User Manna Balance',
      description:
        'Adjust the manna balance for a specific user account. This allows administrators to add or subtract manna from user accounts.',
      hide: true,
      request: {
        body: Type.Object({
          userId: Type.String(),
          amount: Type.Number(),
          source: Type.Optional(Type.String()),
        }),
      },
      response: {
        200: Type.Object({
          userId: Type.String(),
          manna: Type.Number(),
          transactionId: Type.String(),
        }),
      },
      // security: [
      //   {
      //     apiKey: [],
      //   },
      // ],
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => modifyManna(request, reply),
  })

  server.post('/admin/manna/vouchers/create', {
    schema: {
      tags: ['Admin'],
      summary: 'Create Manna Vouchers',
      description:
        'Generate redeemable manna voucher codes with configurable restrictions such as allowed users, usage limits, and associated actions.',
      hide: true,
      request: {
        body: Type.Object({
          amount: Type.Number(),
          allowedUserIds: Type.Optional(Type.Array(Type.String())),
          numberOfUses: Type.Optional(Type.Number()),
          code: Type.Optional(Type.String()),
          action: Type.Optional(Type.String()),
          ttlSeconds: Type.Optional(Type.Number()),
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
}

export default adminRoutes

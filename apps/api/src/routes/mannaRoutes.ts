import { redeemMannaVoucher } from '../controllers/mannaController'
import { isAuth } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const mannaRoutes: FastifyPluginAsync = async server => {
  server.post('/manna/vouchers/redeem', {
    schema: {
      tags: ['Manna'],
      summary: 'Redeem Manna Voucher',
      description:
        "Redeem a manna voucher code to add manna to the authenticated user's account.",
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        code: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Optional(Type.Boolean()),
          action: Type.Optional(Type.String()),
          manna: Type.Optional(Type.Number()),
          transactionId: Type.Optional(Type.String()),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => redeemMannaVoucher(request, reply),
  })
}

export default mannaRoutes

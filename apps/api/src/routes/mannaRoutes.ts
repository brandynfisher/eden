import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { getBalance, redeemMannaVoucher } from '../controllers/mannaController'
import { isAuth } from '../middleware/authMiddleware'

const mannaRoutes: FastifyPluginAsync = async server => {
  server.get('/manna/balance', {
    schema: {
      response: {
        200: Type.Object({
          manna: Type.Number(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getBalance(request, reply),
  })

  server.post('/manna/vouchers/redeem', {
    schema: {
      body: Type.Object({
        code: Type.String(),
      }),
      response: {
        200: Type.Object({
          manna: Type.Number(),
          transactionId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => redeemMannaVoucher(request, reply),
  })
}

export default mannaRoutes

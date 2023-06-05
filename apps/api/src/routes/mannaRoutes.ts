import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { getBalance } from '../controllers/mannaController'
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
    preHandler: [request => isAuth(server, request)],
    handler: (request, reply) => getBalance(request, reply),
  })

  // server.post(`${MANNA_BASE_ROUTE}/vouchers`, {
  //   schema: {
  //     request: {
  //       body: Type.Object({
  //         allowedUsers: Type.Array(Type.String()) || Type.Null(),
  //         balance: Type.Number(),
  //       }),
  //     },
  //     response: {
  //       200: Type.Object({
  //         mannaVoucher: Type.String(),
  //       }),
  //     },
  //   },
  //   preHandler: [(request) => isAdmin(server, request)],
  //   handler: (request, reply) => createMannaVoucher(request, reply),
  // });

  // server.get(`${MANNA_BASE_ROUTE}/vouchers/:voucherId/redeem`, {
  //   schema: {
  //     response: {
  //       200: Type.Object({
  //         manna: Type.Number(),
  //         transactionId: Type.String(),
  //       }),
  //     },
  //   },
  //   preHandler: [(request) => isAuth(server, request)],
  //   handler: (request, reply) => redeemMannaVoucher(request, reply),
  // });
}

export default mannaRoutes

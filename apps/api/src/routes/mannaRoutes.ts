import { redeemMannaVoucher } from '../controllers/mannaController'
import { isAuth } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const mannaRoutes: FastifyPluginAsync = async server => {
  server.post('/manna/vouchers/redeem', {
    config: {
      // Redeeming is not the risk — the unique {voucher,user} index already
      // caps that at one per person. Guessing is: admin-chosen codes can be
      // low-entropy words, the lookup is case-insensitive, and the global
      // limit is 10k/min per IP, so a dictionary attack is free. Key on the
      // user so it survives IP rotation.
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
        // Must run on preHandler: @fastify/rate-limit defaults to onRequest,
        // which fires BEFORE isAuth (itself a preHandler), so request.user was
        // always undefined here and the limiter silently degraded to per-IP —
        // exactly the IP-rotation case the keyGenerator below exists to defeat.
        hook: 'preHandler',
        keyGenerator: (request: any) =>
          String(request.user?.userId ?? request.ip),
      },
    },
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

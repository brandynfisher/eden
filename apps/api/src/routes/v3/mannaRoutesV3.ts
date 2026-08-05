import { redeemMannaVoucher } from '../../controllers/mannaController'
import { MannaV3Domain } from '../../domain/v3/manna'
import { isAuth } from '../../middleware/authMiddleware'
import { Static } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const mannaRoutesV3: FastifyPluginAsync = async server => {
  server.post<{
    Body: Static<typeof MannaV3Domain.request.redeemVoucher>
  }>(
    '/v3/manna/vouchers/redeem',
    {
      config: {
        // Redeeming is not the risk — the unique {voucher,user} index already
        // caps that at one per person. Guessing is: admin-chosen codes can be
        // low-entropy words, the lookup is case-insensitive, and the global
        // limit is 10k/min per IP, so a dictionary attack is free. Key on the
        // user so it survives IP rotation.
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
          keyGenerator: (request: any) =>
            String(request.user?.userId ?? request.ip),
        },
      },
      schema: {
        tags: ['Manna'],
        summary: 'Redeem Manna Voucher',
        description:
          "Redeem a manna voucher code to add manna to the authenticated user's account.",
        security: [{ apiKey: [] }],
        body: MannaV3Domain.request.redeemVoucher,
        response: {
          200: MannaV3Domain.response.redeemVoucher,
          400: MannaV3Domain.response.error,
          401: MannaV3Domain.response.error,
        },
      },
      preHandler: [(request, reply) => isAuth(server, request, reply)],
    },
    (request, reply) => redeemMannaVoucher(request, reply),
  )
}

export default mannaRoutesV3

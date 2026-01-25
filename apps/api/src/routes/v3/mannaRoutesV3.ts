import { redeemMannaVoucher } from '../../controllers/mannaController'
import { isAuth } from '../../middleware/authMiddleware'
import registerOpenApiSchemas from '../../plugins/openapiSchemas'
import { MannaVoucherRedeemRequest } from '@edenlabs/eden-sdk-v3'
import { FastifyPluginAsync } from 'fastify'

const mannaRoutesV3: FastifyPluginAsync = async server => {
  await server.register(registerOpenApiSchemas, { id: 'manna-v3' })

  server.post<{ Body: MannaVoucherRedeemRequest }>(
    '/v3/manna/vouchers/redeem',
    {
      schema: {
        tags: ['MannaV3'],
        summary: 'Redeem Manna Voucher',
        description:
          "Redeem a manna voucher code to add manna to the authenticated user's account.",
        security: [{ apiKey: [] }],
        body: {
          $ref: 'manna-v3#/components/schemas/MannaVoucherRedeemRequest',
        },
        response: {
          200: {
            $ref: 'manna-v3#/components/schemas/MannaVoucherRedeemResponse',
          },
          400: { $ref: 'manna-v3#/components/schemas/ErrorResponse' },
          401: { $ref: 'manna-v3#/components/schemas/ErrorResponse' },
        },
      },
      preHandler: [(request, reply) => isAuth(server, request, reply)],
    },
    (request, reply) => redeemMannaVoucher(request, reply),
  )
}

export default mannaRoutesV3

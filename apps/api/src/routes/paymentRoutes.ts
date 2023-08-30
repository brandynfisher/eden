import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import {
  createCheckoutSession,
  getPriceList,
  handlePaymentEvent,
} from '../controllers/paymentController'
import { isAuth } from '../middleware/authMiddleware'

const paymentRoutes: FastifyPluginAsync = async server => {
  server.post('/payments/create', {
    schema: {
      body: {
        priceId: Type.String(),
        paymentMode: Type.String(),
      },
      response: {
        200: Type.Object({
          url: Type.String(),
        }),
      },
    },
    preHandler: [request => isAuth(server, request)],
    handler: (request, reply) => createCheckoutSession(server, request, reply),
  })

  server.post('/payments/event', {
    config: {
      rawBody: true,
    },
    schema: {
      body: {
        id: Type.String(),
      },
    },

    handler: async (request, reply) =>
      handlePaymentEvent(server, request, reply),
  })

  server.get('/payments/prices', {
    schema: {
      response: {
        200: Type.Array(
          Type.Object({
            priceId: Type.String(),
            price: Type.Number(),
            isSubscription: Type.Boolean(),
            mannaAmount: Type.Number(),
          }),
        ),
      },
    },
    handler: async (_, reply) => getPriceList(reply),
  })
}

export default paymentRoutes

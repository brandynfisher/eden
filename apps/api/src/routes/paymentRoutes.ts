import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import {
  createCheckoutSession,
  createSubscriptionSession,
  getProducts,
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
    preHandler: [(request, reply) => isAuth(server, request, reply)],
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

  server.get('/payments/products', {
    schema: {
      response: {
        200: Type.Object({
          products: Type.Array(Type.Any()),
        }),
      },
    },
    handler: async (_, reply) => getProducts(server, reply),
  })

  server.post('/payments/subscription', {
    schema: {
      body: {
        stripeCustomerId: Type.String(),
      },
      response: {
        200: Type.Object({
          url: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) =>
      createSubscriptionSession(server, request, reply),
  })
}

export default paymentRoutes

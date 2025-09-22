import {
  createCheckoutSession,
  createSubscriptionSession,
  getProducts,
  handlePaymentEvent,
} from '../controllers/paymentController'
import { isAuth } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const paymentRoutes: FastifyPluginAsync = async server => {
  server.post('/payments/create', {
    schema: {
      hide: true,
      tags: ['Payments'],
      description: 'Create a payment',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        priceId: Type.String(),
        paymentMode: Type.String(),
        analyticsClientId: Type.Optional(Type.String()),
        returnUrl: Type.Optional(Type.String()),
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
      hide: true,
      tags: ['Payments'],
      description: 'Handle a payment event',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      body: {
        id: Type.String(),
      },
    },
    handler: async (request, reply) =>
      handlePaymentEvent(server, request, reply),
  })

  server.get('/payments/products', {
    schema: {
      hide: true,
      tags: ['Payments'],
      description: 'Get products',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: Type.Object({
          products: Type.Array(Type.Any()),
          subscriptions: Type.Array(Type.Any()),
        }),
      },
    },
    handler: async (_, reply) => getProducts(server, reply),
  })

  server.post('/payments/subscription', {
    schema: {
      hide: true,
      tags: ['Payments'],
      description: 'Create a subscription',
      security: [
        {
          apiKey: [],
        },
      ],
      body: {
        stripeCustomerId: Type.String(),
        returnUrl: Type.Optional(Type.String()),
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

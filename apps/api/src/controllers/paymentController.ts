import { PaymentsCreateArguments } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { getAdminHeaders } from '../lib/util'
import { User } from '../models/Creator'

export const createCheckoutSession = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { priceId } = request.body as PaymentsCreateArguments

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: `User ${userId} not found`,
    })
  }

  const userAddress = user.userId

  if (!priceId) {
    return reply.status(400).send({
      message: 'You must provide a priceId',
    })
  }

  if (!server.stripe) {
    return reply.status(500).send({
      message: 'Stripe is not configured',
    })
  }

  const session = await server.stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    client_reference_id: userAddress,
    success_url: `${server.config.FRONTEND_URL}`,
    cancel_url: `${server.config.FRONTEND_URL}`,
  })

  return reply.status(200).send({
    url: session.url,
  })
}

export const handlePaymentEvent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!server.stripe) {
    return reply.status(500).send({
      message: 'Stripe is not configured',
    })
  }

  if (!request.rawBody) {
    return reply.status(400).send({
      message: 'Raw body not configured',
    })
  }

  const sig = request.headers['stripe-signature'] as string
  const event = server.stripe.webhooks.constructEvent(
    request.rawBody,
    sig,
    server.config.STRIPE_WEBHOOK_SECRET,
  )

  if (event.type === 'checkout.session.completed') {
    const adminHeaders = getAdminHeaders(server)
    const userId = event.data.object.client_reference_id
    console.log('yyy', userId)
    try {
      await axios.post(
        `${server.config.API_URL}/admin/manna/modify`,
        {
          userId,
          amount: 1000,
        },
        {
          headers: adminHeaders,
        },
      )

      return reply.status(200).send({})
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        message: 'Error adding manna',
      })
    }
  }
}

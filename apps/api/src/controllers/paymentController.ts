import { PaymentsCreateArguments } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { getAdminHeaders } from '../lib/util'
import { User } from '../models/Creator'

const handlePaymentSuccess = async (
  server: FastifyInstance,
  reply: FastifyReply,
  userId: string,
  sessionId: string,
) => {
  if (!server.stripe) {
    return reply.status(500).send({
      message: 'Stripe is not configured',
    })
  }

  const session = await server.stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product'],
  })
  if (
    !session.line_items ||
    session.line_items.data.length === 0 ||
    !session.line_items.data[0].price ||
    !session.line_items.data[0].price.product
  ) {
    return reply.status(400).send({
      message: 'No line items found',
    })
  }
  // @ts-ignore
  const mannaAmount = session.line_items.data[0].price.product.metadata
    .manna as string
  if (!mannaAmount) {
    return reply.status(400).send({
      message: 'No manna amount found',
    })
  }

  let mannaAmountInt: number
  try {
    mannaAmountInt = parseInt(mannaAmount)
  } catch (error) {
    return reply.status(400).send({
      message: 'Invalid manna amount',
    })
  }

  try {
    await axios.post(
      `${server.config.API_URL}/admin/manna/modify`,
      {
        userId,
        amount: mannaAmountInt,
      },
      {
        headers: getAdminHeaders(server),
      },
    )
  } catch (error) {
    console.error(error)
    return reply.status(500).send({
      message: 'Error adding manna',
    })
  }
}

export const createCheckoutSession = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { priceId, paymentMode } = request.body as PaymentsCreateArguments

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
    mode: paymentMode,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    client_reference_id: userAddress,
    success_url: `${server.config.FRONTEND_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${server.config.FRONTEND_URL}/order/cancelled?session_id={CHECKOUT_SESSION_ID}`,
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

  // @ts-ignore
  const userId = event.data.object.client_reference_id

  // Get the priceId
  // @ts-ignore
  const sessionId = event.data.object.id

  switch (event.type) {
    case 'checkout.session.completed':
      await handlePaymentSuccess(server, reply, userId, sessionId)
      return reply.status(200).send({})
    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(server, reply, userId, sessionId)
      return reply.status(200).send({})
    default:
      console.log(`Stripe: Unhandled event type ${event.type}`)
      return reply.status(200).send({})
  }
}

export const getProducts = async (
  server: FastifyInstance,
  reply: FastifyReply,
) => {
  if (!server.stripe) {
    return reply.status(500).send({
      message: 'Stripe is not configured',
    })
  }
  const products = await server.stripe.products.list({})
  const activeProducts = products.data.filter(product => product.active)
  const productsWithPrices = await Promise.all(
    activeProducts.map(async product => {
      // @ts-ignore
      const prices = await server.stripe.prices.list({ product: product.id })
      return {
        ...product,
        displayPrice: {
          currency: prices.data[0].currency,
          unit_amount: prices.data[0].unit_amount,
        },
      }
    }),
  )

  return reply.status(200).send({
    products: productsWithPrices,
  })
}

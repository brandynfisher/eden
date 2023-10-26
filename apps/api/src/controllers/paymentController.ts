import {
  PaymentsCreateArguments,
  PaymentsSubscriptionArguments,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import Stripe from 'stripe'

import { getAdminHeaders } from '../lib/util'
import { User, UserDocument } from '../models/Creator'

interface TopUpMetadata {
  manna: string
}

interface NewSubscriptionMetadata {
  subscriptionTier: string
}

const updateStripeCustomer = async (
  server: FastifyInstance,
  user: UserDocument,
  session: Stripe.Checkout.Session,
) => {
  // update metadata of stripe customer
  if (!server.stripe) {
    throw new Error('Stripe is not configured')
  }

  const customerId = session.customer?.toString()
  if (!customerId) {
    throw new Error('No customer id found')
  }

  const stripeCustomer = await server.stripe.customers.retrieve(customerId)

  if (!stripeCustomer) {
    throw new Error('Stripe customer not found')
  }

  await server.stripe.customers.update(customerId, {
    metadata: {
      edenUserId: user.userId,
    },
  })

  // Update the user in the database
  user.stripeCustomerId = customerId
  await user.save()
}

const handleTopUp = async (
  server: FastifyInstance,
  reply: FastifyReply,
  metadata: TopUpMetadata,
  user: UserDocument,
) => {
  const mannaAmount = metadata.manna
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
        userId: user.userId,
        amount: mannaAmountInt,
      },
      {
        headers: getAdminHeaders(server),
      },
    )
  } catch (error) {
    return reply.status(500).send({
      message: 'Error adding manna',
    })
  }

  return reply.status(200).send({})
}

const handleNewSubscription = async (
  reply: FastifyReply,
  metadata: NewSubscriptionMetadata,
  user: UserDocument,
) => {
  const subscriptionTier = metadata.subscriptionTier
  try {
    await user.updateOne({
      subscriptionTier,
    })

    return reply.status(200).send({})
  } catch (error) {
    console.error(error)
    return reply.status(500).send({
      message: 'Error updating subscription',
    })
  }
}

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

  const user = await User.findOne({
    userId,
  })

  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
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

  await updateStripeCustomer(server, user, session)

  // @ts-ignore
  const metadata = session.line_items.data[0].price.product.metadata
  console.log('mmm', metadata)
  if (!metadata) {
    return reply.status(400).send({
      message: 'No metadata found',
    })
  }

  if (metadata.manna) {
    await handleTopUp(server, reply, metadata as TopUpMetadata, user)
  } else if (metadata.subscriptionTier) {
    await handleNewSubscription(
      reply,
      metadata as NewSubscriptionMetadata,
      user,
    )
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
    customer_creation: user.stripeCustomerId ? undefined : 'always',
    customer: user.stripeCustomerId,
    client_reference_id: user.userId,
    success_url: `${server.config.FRONTEND_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${server.config.FRONTEND_URL}/order/cancelled?session_id={CHECKOUT_SESSION_ID}`,
  })

  return reply.status(200).send({
    url: session.url,
  })
}

export const createSubscriptionSession = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { stripeCustomerId } = request.body as PaymentsSubscriptionArguments

  if (!server.stripe) {
    return reply.status(500).send({
      message: 'Stripe is not configured',
    })
  }

  // get stripe customer
  const customer = await server.stripe.customers.retrieve(stripeCustomerId)
  const user = await User.findById(userId)

  // make sure customer matches user
  // @ts-ignore
  if (customer.metadata.edenUserId !== user.userId) {
    return reply.status(400).send({
      message: 'Customer does not match user',
    })
  }

  const session = await server.stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${server.config.FRONTEND_URL}`,
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
      return
    // case 'invoice.payment_succeeded':
    //   await handlePaymentSuccess(server, reply, userId, sessionId)
    //   return reply.status(200).send({})
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
      const defaultPrice = prices.data.find(
        price => price.id === product.default_price,
      )
      const priceToDisplay = defaultPrice || prices.data[0]
      return {
        ...product,
        displayPrice: {
          currency: priceToDisplay.currency,
          unit_amount: priceToDisplay.unit_amount,
          type: priceToDisplay.type,
        },
      }
    }),
  )

  return reply.status(200).send({
    products: productsWithPrices,
  })
}

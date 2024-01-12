import { getAdminHeaders } from '../lib/util'
import { User, UserDocument } from '../models/Creator'
import {
  PaymentsCreateArguments,
  PaymentsSubscriptionArguments,
  SubscriptionTier,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import Stripe from 'stripe'

interface StripeDataObject {
  userId: string
  customerId: string
  sessionId: string
  productId: string
  current_period_start?: number
  current_period_end?: number
}

interface TopUpMetadata {
  manna: string
}

interface SubscriptionMetadata {
  subscriptionTier: string
  manna: string
}

const discountMap = (
  server: FastifyInstance,
  subscriptionTier?: SubscriptionTier,
) => {
  const map = {
    [SubscriptionTier.Free]: undefined,
    [SubscriptionTier.Basic]: server.config.STRIPE_DISCOUNT_CODE_BASIC,
    [SubscriptionTier.Pro]: server.config.STRIPE_DISCOUNT_CODE_PRO,
    [SubscriptionTier.Believer]: server.config.STRIPE_DISCOUNT_CODE_BELIEVER,
  }
  return map[subscriptionTier || SubscriptionTier.Free]
}

const mannaTierMap = (subscriptionTier?: SubscriptionTier) => {
  const map = {
    [SubscriptionTier.Free]: 0,
    [SubscriptionTier.Basic]: 1000,
    [SubscriptionTier.Pro]: 5000,
    [SubscriptionTier.Believer]: 10000,
  }
  return map[subscriptionTier || SubscriptionTier.Free]
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
  server: FastifyInstance,
  reply: FastifyReply,
  metadata: SubscriptionMetadata,
  user: UserDocument,
  proration?: number,
) => {
  const subscriptionTier = parseInt(metadata.subscriptionTier)
  let mannaAmountInt: number

  try {
    await user.updateOne({
      subscriptionTier,
      highestMonthlySubscriptionTier: subscriptionTier,
    })

    try {
      const previousTierManna = mannaTierMap(user.subscriptionTier || undefined)
      const newTierManna = mannaTierMap(subscriptionTier)
      mannaAmountInt = Math.ceil(
        (newTierManna - previousTierManna) * (proration || 1),
      )
    } catch (error) {
      return reply.status(400).send({
        message: 'Invalid manna amount',
      })
    }
    if (mannaAmountInt > 0) {
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
    }

    return reply.status(200).send({})
  } catch (error) {
    console.error(error)
    return reply.status(500).send({
      message: 'Error updating subscription',
    })
  }
}

const handleSubscriptionUpdated = async (
  server: FastifyInstance,
  reply: FastifyReply,
  {
    customerId,
    productId,
    current_period_end,
    current_period_start,
  }: StripeDataObject,
) => {
  if (!server.stripe) {
    return reply.status(500).send({
      message: 'Stripe is not configured',
    })
  }

  const user = await User.findOne({
    stripeCustomerId: customerId,
  })

  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const product = await server.stripe.products.retrieve(productId)
  const metadata = {
    subscriptionTier: product.metadata.subscriptionTier,
    manna: product.metadata.manna,
  }

  if (!metadata) {
    return reply.status(400).send({
      message: 'No metadata found',
    })
  }

  if (
    metadata.subscriptionTier &&
    parseInt(metadata.subscriptionTier) >=
      (user.highestMonthlySubscriptionTier || 0)
  ) {
    const currentDate = Math.floor(Date.now() / 1000) // Convert to seconds since Stripe uses seconds

    if (!current_period_end || !current_period_start) {
      return reply.status(400).send({
        message: 'No current period found',
      })
    }

    const totalSecondsInCurrentPeriod =
      current_period_end - current_period_start
    const secondsLeftInCurrentPeriod = current_period_end - currentDate

    const proration = secondsLeftInCurrentPeriod / totalSecondsInCurrentPeriod
    console.log(`Proration: ${proration}`)

    await handleNewSubscription(server, reply, metadata, user, proration)
  } else {
    return reply.status(400).send({
      message: 'No subscription tier found',
    })
  }
}

const handleSubscriptionDeleted = async (
  server: FastifyInstance,
  reply: FastifyReply,
  { customerId }: StripeDataObject,
) => {
  const user = await User.findOne({
    stripeCustomerId: customerId,
  })

  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  if (!server.stripe) {
    return reply.status(500).send({
      message: 'Stripe is not configured',
    })
  }

  try {
    user.subscriptionTier = SubscriptionTier.Free
    await user.save()

    return reply.status(200).send({})
  } catch (error) {
    return reply.status(500).send({
      message: 'Error updating subscription',
    })
  }
}

const handlePaymentSuccess = async (
  server: FastifyInstance,
  reply: FastifyReply,
  { userId, sessionId }: StripeDataObject,
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
  if (!metadata) {
    return reply.status(400).send({
      message: 'No metadata found',
    })
  }

  if (metadata.subscriptionTier) {
    await handleNewSubscription(
      server,
      reply,
      metadata as SubscriptionMetadata,
      user,
    )
  } else {
    await handleTopUp(server, reply, metadata as TopUpMetadata, user)
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

  const customer_creation =
    paymentMode === 'payment' && !user.stripeCustomerId ? 'always' : undefined

  const discountCode = discountMap(server, user.subscriptionTier)

  const session = await server.stripe.checkout.sessions.create({
    mode: paymentMode,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    discounts:
      paymentMode === 'payment' && discountCode
        ? [{ coupon: discountCode }]
        : undefined,
    customer_creation,
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

  const dataObject = event.data.object
  // @ts-ignore
  const userId = dataObject.client_reference_id
  // @ts-ignore
  const customerId = dataObject.customer
  // @ts-ignore
  const sessionId = dataObject.id
  // @ts-ignore
  const productId = dataObject.items?.data[0]?.price?.product
  // @ts-ignore
  const current_period_end = dataObject.current_period_end
  // @ts-ignore
  const current_period_start = dataObject.current_period_start

  const stripeDataObject: StripeDataObject = {
    userId,
    customerId,
    sessionId,
    productId,
    current_period_start,
    current_period_end,
  }

  switch (event.type) {
    // checkout events
    case 'checkout.session.completed':
      await handlePaymentSuccess(server, reply, stripeDataObject)
      return

    // subscription events
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(server, reply, stripeDataObject)
      return

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(server, reply, stripeDataObject)
      return

    case 'invoicce.payment_succeeded':
      // TODO: handle subscription renewal.

      return
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
        isSubscription: priceToDisplay.type === 'recurring',
        displayPrice: {
          currency: priceToDisplay.currency,
          unit_amount: priceToDisplay.unit_amount,
          type: priceToDisplay.type,
        },
      }
    }),
  )

  return reply.status(200).send({
    products: productsWithPrices.filter(product => !product.isSubscription),
    subscriptions: productsWithPrices.filter(product => product.isSubscription),
  })
}

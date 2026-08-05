import { trackCheckoutBegin, trackCheckoutComplete } from '../lib/analytics'
import { Manna } from '../models/Manna'
import { Transaction } from '../models/Transaction'
import { User, UserDocument } from '../models/User'
import {
  PaymentsCreateArguments,
  PaymentsSubscriptionArguments,
  SubscriptionTier,
} from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import Stripe from 'stripe'

interface StripeDataObject {
  eventId: string
  eventType: string
  eventData: Stripe.Event.Data
  userId: string
  customerId: string
  sessionId: string
  productId: string
  renewalPriceId?: string
  current_period_start?: number
  current_period_end?: number
}

interface TopUpMetadata {
  manna: string
  analyticsClientId?: string
}

interface SubscriptionMetadata {
  subscriptionTier: string
  manna: string
  analyticsClientId?: string
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
    [SubscriptionTier.Admin]: undefined,
  }
  return map[subscriptionTier || SubscriptionTier.Free]
}

const mannaTierMap = (subscriptionTier?: SubscriptionTier) => {
  const map = {
    [SubscriptionTier.Free]: 0,
    [SubscriptionTier.Basic]: 1000,
    [SubscriptionTier.Pro]: 5000,
    [SubscriptionTier.Believer]: 10000,
    [SubscriptionTier.Admin]: 0,
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

const extractPaymentIntentId = (
  eventData?: Stripe.Event.Data,
): string | undefined => {
  const object = (eventData as { object?: Record<string, unknown> })?.object
  const paymentIntent = object?.payment_intent
  if (typeof paymentIntent === 'string') return paymentIntent
  if (paymentIntent && typeof paymentIntent === 'object') {
    const id = (paymentIntent as { id?: unknown }).id
    return typeof id === 'string' ? id : undefined
  }
  return undefined
}

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: number }).code === 11000

/**
 * Credit manna for a Stripe event exactly once.
 *
 * The transaction is written FIRST, so the unique sparse index on
 * {stripeEventId, stripeEventType} is what arbitrates a duplicate delivery —
 * the loser gets a duplicate-key error and never touches the balance. The
 * balance is then moved with an atomic $inc rather than a read-modify-write,
 * so it cannot clobber a concurrent spend.
 *
 * Returns false when the event was already processed.
 */
const creditMannaForStripeEvent = async ({
  mannaId,
  amount,
  bucket,
  eventId,
  eventType,
  eventData,
  source,
  paymentIntentId,
}: {
  mannaId: unknown
  amount: number
  bucket: 'balance' | 'subscriptionBalance'
  eventId: string
  eventType: string
  eventData?: Stripe.Event.Data
  source?: string
  paymentIntentId?: string
}): Promise<boolean> => {
  try {
    await new Transaction({
      stripeEventId: eventId,
      stripeEventType: eventType,
      stripeEventData: eventData,
      type: 'credit_stripe',
      manna: mannaId,
      amount,
      source,
      stripePaymentIntentId: paymentIntentId,
    }).save()
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return false
    }
    throw error
  }

  await Manna.updateOne({ _id: mannaId }, { $inc: { [bucket]: amount } })
  return true
}

const handleTopUp = async (
  server: FastifyInstance,
  reply: FastifyReply,
  metadata: TopUpMetadata,
  user: UserDocument,
  stripeEventData: StripeDataObject,
) => {
  const { eventId, eventType, eventData } = stripeEventData

  const mannaAmount = metadata.manna
  if (!mannaAmount) {
    return reply.status(400).send({
      message: 'No manna amount found',
    })
  }

  if (!eventId || !eventType) {
    return reply.status(400).send({
      message: 'No eventId or eventType found in payload',
    })
  }

  // parseInt never throws, so the old try/catch was dead code and a malformed
  // metadata value reached the credit as NaN ("1e10" also silently became 1).
  const mannaAmountInt = Number(mannaAmount)
  if (!Number.isInteger(mannaAmountInt) || mannaAmountInt <= 0) {
    return reply.status(400).send({
      message: `Invalid manna amount: ${mannaAmount}`,
    })
  }

  const manna = await Manna.findOne({ user: user._id })
  if (!manna) {
    return reply.status(400).send({ message: 'Manna not found' })
  }

  // Previously this POSTed to its own /admin/manna/modify endpoint, which wrote
  // an `admin_modify` transaction carrying no Stripe event id. The unique index
  // is sparse, so those rows were exempt from it and every Stripe retry —
  // routine after a timeout, a deploy mid-webhook, or a dashboard resend —
  // credited the manna again. Crediting inline puts top-ups under the same
  // idempotency guard as every other credit path, and stops shipping the admin
  // API key + secret over the network on each purchase.
  const credited = await creditMannaForStripeEvent({
    mannaId: manna._id,
    amount: mannaAmountInt,
    bucket: 'balance',
    eventId,
    eventType,
    eventData,
    source: 'stripe_topup',
    paymentIntentId: extractPaymentIntentId(eventData),
  })

  if (!credited) {
    server.log.info(
      { eventId, eventType },
      'stripe top-up already processed, ignoring duplicate delivery',
    )
  }

  return reply.status(200).send({})
}

const handleNewSubscription = async (
  //@ts-ignore - unused
  server: FastifyInstance,
  reply: FastifyReply,
  metadata: SubscriptionMetadata,
  user: UserDocument,
  stripeEventData: StripeDataObject,
  proration?: number,
) => {
  const subscriptionTier = parseInt(metadata.subscriptionTier)
  let mannaAmountInt: number

  try {
    // The ceiling is the only thing gating repeat proration credits, so it must
    // never move DOWN here: buying a cheaper second subscription used to lower
    // it, which re-armed the credit for a tier the customer already holds.
    await user.updateOne({
      subscriptionTier,
      highestMonthlySubscriptionTier: Math.max(
        subscriptionTier,
        user.highestMonthlySubscriptionTier || 0,
      ),
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
      const manna = await Manna.findOne({
        user: user._id,
      })

      if (!manna) {
        return reply.status(400).send({
          message: 'Manna not found',
        })
      }

      // An already-processed event is the SUCCESS case for an at-least-once
      // webhook. This used to answer 500, so Stripe retried it for three days
      // and — after enough sustained failures — disables the endpoint, at
      // which point legitimate purchases stop being credited at all.
      const credited = await creditMannaForStripeEvent({
        mannaId: manna._id,
        amount: mannaAmountInt,
        bucket: 'subscriptionBalance',
        eventId: stripeEventData.eventId,
        eventType: stripeEventData.eventType,
        eventData: stripeEventData.eventData,
        source: 'stripe_subscription',
      })

      if (!credited) {
        return reply.status(200).send({
          message: 'event already processed',
        })
      }
    }

    return reply.status(200).send({
      message: 'new subscription created',
      newSubscriptionTier: subscriptionTier,
      existingTier: user.subscriptionTier,
      highestTier: user.highestMonthlySubscriptionTier,
    })
  } catch (error) {
    console.error(error)
    return reply.status(500).send({
      message: 'Error updating subscription',
      newSubscriptionTier: subscriptionTier,
      existingTier: user.subscriptionTier,
      highestTier: user.highestMonthlySubscriptionTier,
    })
  }
}

type GenericStripeEventDataObject = {
  [K in keyof Stripe.Event.Data.Object]?: any
}

const handleSubscriptionUpdated = async (
  server: FastifyInstance,
  reply: FastifyReply,
  stripeEventData: StripeDataObject,
  rawStripeEventDataObject: Stripe.Event.Data.Object,
  previousAttributes?: Stripe.Event.Data.PreviousAttributes,
) => {
  const {
    customerId,
    productId,
    current_period_end,
    current_period_start,
    eventId,
    eventType,
    eventData,
  } = stripeEventData

  if (!server.stripe) {
    return reply.status(500).send({
      message: 'Stripe is not configured',
    })
  }

  if (!eventId) {
    return reply.status(400).send({
      message: 'No eventId found in payload',
    })
  }

  if (!eventType) {
    return reply.status(400).send({
      message: 'No eventType found in payload',
    })
  }

  if (!eventData) {
    return reply.status(400).send({
      message: 'No eventData found in payload',
    })
  }

  const user = await User.findOne({
    stripeCustomerId: customerId,
  })

  if (!user) {
    return reply.status(404).send({
      message: 'User not found',
    })
  }

  const product = await server.stripe.products.retrieve(productId)

  if (!product || !product.metadata) {
    return reply.status(400).send({
      message: 'No metadata found',
    })
  }

  if (product.metadata.subscriptionTier === undefined) {
    return reply.status(400).send({
      message: 'Product metadata is missing subscription tier',
    })
  }

  const metadata = {
    subscriptionTier: product.metadata.subscriptionTier,
    manna: product.metadata.manna,
  }

  // is this update trying to upgrade the tier?
  if (
    parseInt(metadata.subscriptionTier) >
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

    await handleNewSubscription(
      server,
      reply,
      metadata,
      user,
      stripeEventData,
      proration,
    )
  } else {
    // nothing to do here, report acknowledgement

    // gather updates
    const updatedAttributes: GenericStripeEventDataObject = {}
    if (previousAttributes && rawStripeEventDataObject) {
      Object.keys(previousAttributes).forEach(attributeKey => {
        if (attributeKey in rawStripeEventDataObject) {
          updatedAttributes[
            attributeKey as keyof GenericStripeEventDataObject
          ] =
            rawStripeEventDataObject[
              attributeKey as keyof GenericStripeEventDataObject
            ]
        }
      })
    }

    return reply.status(200).send({
      message:
        'noop - event is informal change to subscription (renewal date change, address, ...)',
      previousAttributes: previousAttributes || {},
      updatedAttributes,
    })
    // return reply.status(400).send({
    //   message: `New subscription tier is equal or lower current tier, no-op - metadata:${metadata.subscriptionTier} | highestMonthlySubscriptionTier:${user.highestMonthlySubscriptionTier || 0}`,
    // })
  }
}

/**
 * Debit manna in response to a Stripe event (cancellation, refund, dispute),
 * recording it so the ledger explains the movement. Idempotent per event via
 * the same unique {stripeEventId, stripeEventType} index used for credits.
 *
 * The balance is allowed to go negative: clamping at zero would let a user
 * spend everything and then charge back for free. A negative balance simply
 * blocks further spending until it is settled.
 */
const debitMannaForStripeEvent = async ({
  mannaId,
  amount,
  bucket,
  eventId,
  eventType,
  eventData,
  source,
}: {
  mannaId: unknown
  amount: number
  bucket: 'balance' | 'subscriptionBalance'
  eventId: string
  eventType: string
  eventData?: Stripe.Event.Data
  source: string
}): Promise<boolean> => {
  if (amount <= 0) return false

  try {
    await new Transaction({
      stripeEventId: eventId,
      stripeEventType: eventType,
      stripeEventData: eventData,
      type: 'spend',
      manna: mannaId,
      amount: -amount,
      source,
    }).save()
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return false
    }
    throw error
  }

  await Manna.updateOne({ _id: mannaId }, { $inc: { [bucket]: -amount } })
  return true
}

const expireSubscriptionBalance = async (
  user: UserDocument,
  source: string,
  { eventId, eventType, eventData }: StripeDataObject,
) => {
  const manna = await Manna.findOne({ user: user._id })
  const remaining = manna?.subscriptionBalance || 0
  if (!manna || remaining <= 0 || !eventId || !eventType) return

  await debitMannaForStripeEvent({
    mannaId: manna._id,
    amount: remaining,
    bucket: 'subscriptionBalance',
    eventId,
    eventType,
    eventData,
    source,
  })
}

/**
 * Claw manna back when Stripe reverses a payment (refund or dispute).
 *
 * Before this existed, `charge.refunded` and `charge.dispute.*` fell through to
 * the default no-op: a user could buy manna, spend it, charge back, and keep
 * the output. The reversal is linked to its funding credit through the payment
 * intent so the exact granted amount is debited (prorated for a partial
 * refund) — never a guess. A credit predating this linkage cannot be matched,
 * so it is logged loudly for manual handling rather than silently ignored.
 */
const handleChargeReversal = async (
  server: FastifyInstance,
  reply: FastifyReply,
  stripeEventData: StripeDataObject,
  rawStripeEventDataObject: Stripe.Event.Data.Object,
) => {
  const { eventId, eventType, eventData } = stripeEventData
  const charge = rawStripeEventDataObject as unknown as Record<string, any>

  const paymentIntentId =
    typeof charge?.payment_intent === 'string'
      ? charge.payment_intent
      : charge?.payment_intent?.id

  if (!paymentIntentId) {
    server.log.error(
      { eventId, eventType },
      'stripe reversal carried no payment_intent; manna NOT clawed back',
    )
    return reply.status(200).send({ message: 'no payment intent' })
  }

  const credit = await Transaction.findOne({
    stripePaymentIntentId: paymentIntentId,
    type: 'credit_stripe',
  })

  if (!credit) {
    server.log.error(
      { eventId, eventType, paymentIntentId },
      'stripe reversal could not be matched to a credit (likely predates payment-intent linkage); manna NOT clawed back — handle manually',
    )
    return reply.status(200).send({ message: 'unmatched reversal' })
  }

  // Partial refunds claw back the same fraction of the manna that was granted.
  const amountRefunded = Number(charge?.amount_refunded ?? 0)
  const amountTotal = Number(charge?.amount ?? 0)
  const fraction =
    eventType.startsWith('charge.dispute') || !amountTotal || !amountRefunded
      ? 1
      : Math.min(amountRefunded / amountTotal, 1)

  const clawback = Math.round(credit.amount * fraction)

  const debited = await debitMannaForStripeEvent({
    mannaId: credit.manna,
    amount: clawback,
    bucket: 'balance',
    eventId,
    eventType,
    eventData,
    source: `stripe_reversal:${eventType}`,
  })

  server.log.warn(
    { eventId, eventType, paymentIntentId, clawback, debited },
    'stripe payment reversed; manna clawed back',
  )

  return reply.status(200).send({ message: 'reversal processed' })
}

const handleSubscriptionDeleted = async (
  server: FastifyInstance,
  reply: FastifyReply,
  stripeEventData: StripeDataObject,
) => {
  const { customerId } = stripeEventData
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
    // A customer can hold more than one subscription, and this fires per
    // subscription. Zeroing the tier and the proration ceiling unconditionally
    // meant cancelling a cheap second subscription reset the ceiling to 0 while
    // a higher-tier subscription was still active — which re-armed the
    // proration credit on the surviving subscription, repeatable every cycle.
    // 116 users currently sit with highestMonthlySubscriptionTier below their
    // subscriptionTier, which is the footprint of exactly this reset.
    let remainingTier = SubscriptionTier.Free
    try {
      const active = await server.stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 100,
        expand: ['data.items.data.price.product'],
      })
      for (const subscription of active.data) {
        const product = subscription.items.data[0]?.price
          ?.product as Stripe.Product
        const tier = parseInt(product?.metadata?.subscriptionTier ?? '0')
        if (Number.isInteger(tier) && tier > remainingTier) {
          remainingTier = tier
        }
      }
    } catch (error) {
      server.log.error(
        { err: error, customerId },
        'could not list remaining subscriptions; treating customer as unsubscribed',
      )
    }

    user.subscriptionTier = remainingTier
    // Only release the ceiling once nothing is left to farm against.
    if (remainingTier === SubscriptionTier.Free) {
      user.highestMonthlySubscriptionTier = SubscriptionTier.Free
    }
    await user.save()

    // The subscription allowance is for the period that just ended, so it
    // expires with the subscription. Previously only the tier was reset and
    // subscriptionBalance survived cancellation indefinitely — nothing else in
    // the codebase ever clears it — so a subscribe/cancel cycle kept the full
    // tier grant for free. Only expire it once no subscription remains,
    // otherwise cancelling one of two subscriptions would wipe an allowance the
    // customer is still paying for.
    if (remainingTier !== SubscriptionTier.Free) {
      return reply.status(200).send({})
    }
    await expireSubscriptionBalance(
      user,
      'stripe_subscription_deleted',
      stripeEventData,
    )

    return reply.status(200).send({})
  } catch (error) {
    return reply.status(500).send({
      message: 'Error updating subscription',
    })
  }
}

const handleRenewal = async (
  server: FastifyInstance,
  reply: FastifyReply,
  stripeEventData: StripeDataObject,
) => {
  const { customerId, renewalPriceId, eventId, eventType, eventData } =
    stripeEventData

  if (!server.stripe) {
    return reply.status(500).send({
      message: 'Stripe is not configured',
    })
  }

  if (!eventId) {
    return reply.status(400).send({
      message: 'No eventId found in payload',
    })
  }

  if (!eventType) {
    return reply.status(400).send({
      message: 'No eventType found in payload',
    })
  }

  if (!eventData) {
    return reply.status(400).send({
      message: 'No eventData found in payload',
    })
  }

  if (!renewalPriceId) {
    return reply.status(400).send({
      message: 'No renewal price id found',
    })
  }

  const price = await server.stripe.prices.retrieve(renewalPriceId, {
    expand: ['product'],
  })
  const product = price.product as Stripe.Product

  if (!product) {
    return reply.status(400).send({
      message: 'No product found',
    })
  }

  if (
    !product.metadata ||
    !product.metadata.subscriptionTier ||
    !product.metadata.manna
  ) {
    return reply.status(400).send({
      message: 'No metadata found',
    })
  }

  const metadata = {
    subscriptionTier: product.metadata.subscriptionTier,
    manna: product.metadata.manna,
  }

  const user = await User.findOne({
    stripeCustomerId: customerId,
  })

  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const subscriptionTier = parseInt(metadata.subscriptionTier)
  user.subscriptionTier = subscriptionTier
  // Never lower the ceiling on a renewal either — see handleNewSubscription.
  user.highestMonthlySubscriptionTier = Math.max(
    subscriptionTier,
    user.highestMonthlySubscriptionTier || 0,
  )
  await user.save()

  const manna = await Manna.findOne({
    user: user._id,
  })

  if (!manna) {
    return reply.status(400).send({
      message: 'Manna not found',
    })
  }

  const mannaAmountInt = Number(metadata.manna)
  if (!Number.isInteger(mannaAmountInt) || mannaAmountInt < 0) {
    return reply.status(400).send({
      message: `Invalid manna amount: ${metadata.manna}`,
    })
  }

  // A renewal refills the allowance up to the tier amount rather than stacking
  // on top of it, so the credit is the shortfall. The delta used to be computed
  // as `newAmount - manna.subscriptionBalance` AFTER subscriptionBalance had
  // already been overwritten with newAmount, so it was always exactly 0: 1,779
  // of 2,392 credit_stripe rows in production record a zero-value renewal while
  // the balance actually moved. That made manna issuance impossible to
  // reconstruct from the ledger, which is what an audit needs most.
  const currentBalance = manna.subscriptionBalance || 0
  const topUp = Math.max(mannaAmountInt - currentBalance, 0)

  if (topUp > 0) {
    const credited = await creditMannaForStripeEvent({
      mannaId: manna._id,
      amount: topUp,
      bucket: 'subscriptionBalance',
      eventId,
      eventType,
      eventData,
      source: 'stripe_renewal',
    })

    if (!credited) {
      return reply.status(200).send({ message: 'event already processed' })
    }
  }

  return reply.status(200).send({})
}

const handlePaymentSuccess = async (
  server: FastifyInstance,
  reply: FastifyReply,
  stripeEventData: StripeDataObject,
  rawStripeEventDataObject: Stripe.Event.Data.Object,
) => {
  const { userId, sessionId, eventId, eventType, eventData } = stripeEventData

  if (!server.stripe) {
    return reply.status(500).send({
      message: 'Stripe is not configured',
    })
  }

  if (!eventId) {
    return reply.status(400).send({
      message: 'No eventId found in payload',
    })
  }

  if (!eventType) {
    return reply.status(400).send({
      message: 'No eventType found in payload',
    })
  }

  if (!eventData) {
    return reply.status(400).send({
      message: 'No eventData found in payload',
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

  // checkout.session.completed also fires for sessions that were never paid:
  // payment_status 'unpaid' (delayed/async payment methods) and
  // 'no_payment_required' (a 100%-off coupon, or a trial configured on the
  // price). Nothing here checked, so those credited full manna. Card-only
  // checkout limits today's exposure, but the discount codes in discountMap are
  // applied to top-ups and a 100%-off code would mint manna outright.
  if (session.payment_status !== 'paid') {
    server.log.warn(
      { eventId, sessionId, payment_status: session.payment_status },
      'checkout session completed without payment; not crediting manna',
    )
    return reply
      .status(200)
      .send({ message: `not paid - ${session.payment_status}` })
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
      stripeEventData,
    )
  } else {
    await handleTopUp(
      server,
      reply,
      metadata as TopUpMetadata,
      user,
      stripeEventData,
    )
  }

  const sessionMetaData =
    //@ts-ignore
    rawStripeEventDataObject && rawStripeEventDataObject.metadata
      ? //@ts-ignore
        rawStripeEventDataObject.metadata
      : {}
  await trackCheckoutComplete(server, sessionMetaData.analyticsClientId || '', {
    transaction_id: sessionId,
    currency: session.currency || '',
    value:
      session.amount_total !== null
        ? (session.amount_total - (session?.total_details?.amount_tax || 0)) /
          100
        : 0,
    tax: session?.total_details?.amount_tax || 0,
    items: session.line_items.data.map((item: Stripe.LineItem, index) => {
      return {
        item_id: item.id,
        item_name:
          (metadata.subscriptionTier ? 'subscription' : 'top-up') +
          ' - ' +
          item.description,
        currency: item.currency.toUpperCase(),
        index: index,
        item_brand: 'Eden',
        item_category: metadata.subscriptionTier ? 'subscription' : 'top-up',
        // amount from stripe as integer needs to be a float for GA
        price:
          item.price?.unit_amount && item.price?.unit_amount > 0
            ? item.price?.unit_amount / 100
            : 0,
        quantity: item.quantity || 0,
      }
    }),
  })
}

export const createCheckoutSession = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { priceId, paymentMode, analyticsClientId, returnUrl } =
    request.body as PaymentsCreateArguments

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

  // paymentMode is passed straight through to Stripe's `mode`; constrain it to
  // the two modes this flow supports rather than letting the client choose.
  if (paymentMode && !['payment', 'subscription'].includes(paymentMode)) {
    return reply.status(400).send({
      message: 'Invalid paymentMode',
    })
  }

  if (!server.stripe) {
    return reply.status(500).send({
      message: 'Stripe is not configured',
    })
  }

  // priceId is client-supplied, and the manna granted comes from the price's
  // PRODUCT metadata — a product can carry several prices, so an archived,
  // promotional or mis-priced price attached to a high-manna product would
  // grant the full manna for whatever that price happens to charge.
  //
  // Rather than hard-code a list of ids that goes stale the moment a price is
  // added, require the price to be sellable: the price active, its product
  // active, and the product actually carrying the metadata this flow reads.
  // That admits every current self-serve price and rejects the legacy/test
  // ones (e.g. the 1-cent "1 manna" price and the $0.50 price whose product is
  // archived) as well as invoice-only products like "Services" that have no
  // manna metadata and were never meant to be bought through checkout.
  try {
    const price = await server.stripe.prices.retrieve(priceId, {
      expand: ['product'],
    })
    const product = price.product as Stripe.Product
    const sellable =
      price.active &&
      product &&
      !('deleted' in product && product.deleted) &&
      product.active &&
      (product.metadata?.manna || product.metadata?.subscriptionTier)

    if (!sellable) {
      server.log.warn(
        {
          userId,
          priceId,
          priceActive: price.active,
          productActive: (product as Stripe.Product)?.active,
        },
        'checkout attempted with a price that is not sellable',
      )
      return reply.status(400).send({ message: 'Invalid priceId' })
    }
  } catch (error) {
    return reply.status(400).send({ message: 'Invalid priceId' })
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
    success_url: `${
      returnUrl ? returnUrl : server.config.EDEN2_FRONTEND_URL
    }/order/success?session_id={CHECKOUT_SESSION_ID}&gacid=${analyticsClientId}`,
    cancel_url: `${
      returnUrl ? returnUrl : server.config.EDEN2_FRONTEND_URL
    }/order/cancelled?session_id={CHECKOUT_SESSION_ID}&gacid=${analyticsClientId}`,
    metadata: {
      analyticsClientId: analyticsClientId || '',
    },
  })

  await trackCheckoutBegin(server, analyticsClientId || '')

  return reply.status(200).send({
    url: session.url,
  })
}

export const createSubscriptionSession = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { stripeCustomerId, returnUrl } =
    request.body as PaymentsSubscriptionArguments

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
    return_url: returnUrl ? returnUrl : `${server.config.FRONTEND_URL}`,
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

  let event
  try {
    event = server.stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      server.config.STRIPE_WEBHOOK_SECRET || '',
    )
  } catch (err: any) {
    // Invalid signature (or missing secret) should be a 400, not a 500.
    request.log.warn(
      { err: err?.message },
      'Stripe webhook signature verification failed',
    )
    return reply
      .status(400)
      .send({ message: `Webhook signature verification failed` })
  }

  const dataObject = event.data.object
  const previousAttributes = event.data.previous_attributes
  // @ts-ignore
  const userId = dataObject.client_reference_id
  // @ts-ignore
  const customerId = dataObject.customer
  // @ts-ignore
  const sessionId = dataObject.id
  // @ts-ignore
  const productId = dataObject.items?.data[0]?.price?.product
  // @ts-ignore
  const renewalPriceId = dataObject.lines?.data[0]?.price?.id
  // @ts-ignore
  const current_period_end = dataObject.current_period_end
  // @ts-ignore
  const current_period_start = dataObject.current_period_start

  // @ts-ignore
  const billing_reason = dataObject.billing_reason

  const stripeDataObject: StripeDataObject = {
    eventId: event.id,
    eventType: event.type,
    eventData: event.data,
    userId,
    customerId,
    sessionId,
    productId,
    renewalPriceId,
    current_period_start,
    current_period_end,
  }

  switch (event.type) {
    // checkout events
    case 'checkout.session.completed':
      await handlePaymentSuccess(server, reply, stripeDataObject, dataObject)
      return

    case 'invoice.payment_succeeded':
      if (billing_reason !== 'subscription_cycle') {
        // This returned without ever calling reply.send(), so Fastify never
        // answered: the request hung until the 60s connection timeout, Stripe
        // timed out and retried for three days, and every new subscription and
        // mid-cycle upgrade produced one. Answer it.
        return reply
          .status(200)
          .send({ message: `ignored billing_reason - ${billing_reason}` })
      }
      await handleRenewal(server, reply, stripeDataObject)
      return

    // Payment reversals — without these a user could buy manna, spend it, then
    // charge back and keep the output.
    case 'charge.refunded':
    case 'charge.dispute.created':
    case 'charge.dispute.funds_withdrawn':
      await handleChargeReversal(server, reply, stripeDataObject, dataObject)
      return

    // subscription events
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(
        server,
        reply,
        stripeDataObject,
        dataObject,
        previousAttributes,
      )
      return

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(server, reply, stripeDataObject)
      return
    default:
      return reply
        .status(200)
        .send({ message: `unhandled event - ${event.type}` })
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

import { REALTIME_BILLING } from '../constants/billingConstants'
import { Agent } from '../models/Agent'
import { Manna, MannaDocument } from '../models/Manna'
import { User } from '../models/User'
import { RealtimeBillingTick } from '../models/v2/RealtimeBillingTickV2'
import {
  RealtimeSession,
  RealtimeSessionDocument,
} from '../models/v2/RealtimeSessionV2'
import { Session } from '../models/v2/SessionV2'
import { TransactionV2 } from '../models/v2/TransactionV2'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

/**
 * Check if user has sufficient manna balance
 */
const checkUserBalanceIsSufficient = (
  manna: MannaDocument,
  amount: number,
): boolean => {
  const totalBalance = manna.balance + manna.subscriptionBalance
  return totalBalance >= amount
}

/**
 * Spend manna from user's balance (subscription balance first, then regular)
 */
const spendManna = async (
  manna: MannaDocument,
  cost: number,
): Promise<boolean> => {
  if (cost <= 0) {
    return true
  }

  // Atomic, guarded debit. The previous implementation mutated the loaded
  // document and called save(), which emits a $set of a value read earlier —
  // clobbering the concurrent $inc debits eve performs on the same document —
  // and, when the balance was short, silently skipped the balance leg while
  // still zeroing subscriptionBalance and reporting nothing to the caller.
  const fromSubscription = Math.min(manna.subscriptionBalance, cost)
  const fromBalance = cost - fromSubscription

  const updated = await Manna.findOneAndUpdate(
    {
      _id: manna._id,
      subscriptionBalance: { $gte: fromSubscription },
      balance: { $gte: fromBalance },
    },
    {
      $inc: {
        subscriptionBalance: -fromSubscription,
        balance: -fromBalance,
      },
    },
    { new: true },
  )

  if (!updated) {
    return false
  }

  manna.subscriptionBalance = updated.subscriptionBalance
  manna.balance = updated.balance
  return true
}

/**
 * Create a billing transaction for a realtime session
 */
const createBillingTransaction = async (
  manna: MannaDocument,
  realtimeSession: RealtimeSessionDocument,
  amount: number,
) => {
  return TransactionV2.create({
    manna: manna._id,
    realtimeSession: realtimeSession._id,
    amount: -amount, // Negative for spending
    type: 'realtime_session',
  })
}

interface StartRealtimeSessionBody {
  agentId: string
  sessionId?: string
}

/**
 * Start a new realtime session with billing
 * - Checks minimum balance requirement
 * - Creates RealtimeSession record
 * - Bills initial minute
 */
export const startRealtimeSession = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user?.userId
  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const { agentId, sessionId } = request.body as StartRealtimeSessionBody

  if (!agentId) {
    return reply.status(400).send({ message: 'Missing agentId' })
  }

  // Get user
  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({ message: 'User not found' })
  }

  // Get agent
  const agent = await Agent.findById(agentId)
  if (!agent) {
    return reply.status(404).send({ message: 'Agent not found' })
  }

  // Close any existing active realtime sessions for this user
  // This handles cases where the user closed the tab, refreshed, or the close signal wasn't received
  const existingSessions = await RealtimeSession.find({
    user: userId,
    status: 'active',
  })

  if (existingSessions.length > 0) {
    const now = new Date()
    await RealtimeSession.updateMany(
      { user: userId, status: 'active' },
      {
        $set: {
          status: 'closed',
          closedAt: now,
          closedReason: 'user', // Closed because user started a new session
        },
      },
    )
  }

  // Get user's manna balance
  const manna = await Manna.findOne({ user: userId })
  if (!manna) {
    return reply.status(402).send({ message: 'User has no manna account' })
  }

  // Check minimum balance requirement
  if (!checkUserBalanceIsSufficient(manna, REALTIME_BILLING.MINIMUM_BALANCE)) {
    return reply.status(402).send({
      message: `Insufficient manna balance. Minimum ${REALTIME_BILLING.MINIMUM_BALANCE} manna required to start a realtime session.`,
      currentBalance: manna.balance + manna.subscriptionBalance,
      minimumRequired: REALTIME_BILLING.MINIMUM_BALANCE,
    })
  }

  // If sessionId provided, verify it exists
  let session
  if (sessionId) {
    session = await Session.findById(sessionId)
    if (!session) {
      return reply.status(404).send({ message: 'Session not found' })
    }
  }

  // Bill for the first minute BEFORE creating the session, so a failed debit
  // cannot leave an active unbilled session behind.
  const now = new Date()
  const charged = await spendManna(manna, REALTIME_BILLING.COST_PER_MINUTE)

  if (!charged) {
    return reply.status(402).send({
      message: 'Insufficient manna balance to start a realtime session',
      currentBalance: manna.balance + manna.subscriptionBalance,
    })
  }

  const realtimeSession = await RealtimeSession.create({
    user: userId,
    agent: agentId,
    session: sessionId || null,
    status: 'active',
    startedAt: now,
    lastActivityAt: now,
    totalMinutesBilled: 1, // Initial billing
  })

  // Create transaction record
  const transaction = await createBillingTransaction(
    manna,
    realtimeSession,
    REALTIME_BILLING.COST_PER_MINUTE,
  )

  // Create billing tick record
  await RealtimeBillingTick.create({
    realtimeSession: realtimeSession._id,
    transaction: transaction._id,
    minuteNumber: 1,
    billedAt: now,
  })

  return reply.status(200).send({
    success: true,
    realtimeSession: realtimeSession.toObject(),
    billingConfig: {
      costPerMinute: REALTIME_BILLING.COST_PER_MINUTE,
      billingIntervalSeconds: REALTIME_BILLING.BILLING_INTERVAL_SECONDS,
    },
  })
}

interface CloseRealtimeSessionParams {
  realtimeSessionId: string
}

/**
 * Close a realtime session
 */
export const closeRealtimeSession = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user?.userId
  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const { realtimeSessionId } = request.params as CloseRealtimeSessionParams

  const realtimeSession = await RealtimeSession.findById(realtimeSessionId)
  if (!realtimeSession) {
    return reply.status(404).send({ message: 'Realtime session not found' })
  }

  // Verify ownership
  if (realtimeSession.user.toString() !== userId.toString()) {
    return reply.status(403).send({ message: 'Forbidden' })
  }

  if (realtimeSession.status === 'closed') {
    return reply.status(400).send({ message: 'Session already closed' })
  }

  // Close the session
  const now = new Date()
  realtimeSession.status = 'closed'
  realtimeSession.closedAt = now
  realtimeSession.closedReason = 'user'
  await realtimeSession.save()

  // Calculate total billed
  const totalMannaBilled =
    realtimeSession.totalMinutesBilled * REALTIME_BILLING.COST_PER_MINUTE

  return reply.status(200).send({
    success: true,
    realtimeSession: realtimeSession.toObject(),
    totalMannaBilled,
  })
}

/**
 * Process heartbeat - update activity and bill if needed
 */
export const processHeartbeat = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user?.userId
  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const { realtimeSessionId } = request.params as CloseRealtimeSessionParams

  const realtimeSession = await RealtimeSession.findById(realtimeSessionId)
  if (!realtimeSession) {
    return reply.status(404).send({ message: 'Realtime session not found' })
  }

  // Verify ownership
  if (realtimeSession.user.toString() !== userId.toString()) {
    return reply.status(403).send({ message: 'Forbidden' })
  }

  if (realtimeSession.status === 'closed') {
    return reply.status(400).send({ message: 'Session is closed' })
  }

  const now = new Date()
  const msBetweenBillings = REALTIME_BILLING.BILLING_INTERVAL_SECONDS * 1000

  // Calculate if we need to bill (based on startedAt and current minutes billed)
  const msElapsed = now.getTime() - realtimeSession.startedAt.getTime()
  const minutesElapsed = Math.floor(msElapsed / msBetweenBillings) + 1 // +1 because minute 1 is immediate

  let billedThisTick = false

  // Bill every whole minute that has elapsed but has not yet been billed.
  //
  // This previously charged exactly ONE minute per heartbeat and advanced
  // totalMinutesBilled by 1, regardless of how much time had actually passed.
  // Heartbeat cadence is entirely client-controlled, so the same 60-minute
  // call billed 60 minutes when heartbeated once a minute and 1 minute when
  // heartbeated once.
  const minutesOwed = minutesElapsed - realtimeSession.totalMinutesBilled

  if (minutesOwed > 0) {
    const manna = await Manna.findOne({ user: userId })
    if (!manna) {
      // No manna, close session
      realtimeSession.status = 'closed'
      realtimeSession.closedAt = now
      realtimeSession.closedReason = 'insufficient_balance'
      await realtimeSession.save()

      return reply.status(402).send({
        message: 'Session closed due to no manna account',
        realtimeSession: realtimeSession.toObject(),
      })
    }

    // Collect as much of the debt as the balance covers rather than dropping
    // it entirely, then close if the session cannot be paid for in full.
    const totalBalance = manna.balance + manna.subscriptionBalance
    const affordableMinutes = Math.max(
      0,
      Math.min(
        minutesOwed,
        Math.floor(totalBalance / REALTIME_BILLING.COST_PER_MINUTE),
      ),
    )

    if (affordableMinutes > 0) {
      const cost = affordableMinutes * REALTIME_BILLING.COST_PER_MINUTE
      const spent = await spendManna(manna, cost)

      if (spent) {
        const transaction = await createBillingTransaction(
          manna,
          realtimeSession,
          cost,
        )

        const firstMinute = realtimeSession.totalMinutesBilled + 1
        await RealtimeBillingTick.insertMany(
          Array.from({ length: affordableMinutes }, (_, i) => ({
            realtimeSession: realtimeSession._id,
            transaction: transaction._id,
            minuteNumber: firstMinute + i,
            billedAt: now,
          })),
        )

        realtimeSession.totalMinutesBilled = firstMinute + affordableMinutes - 1
        billedThisTick = true
      }
    }

    if (affordableMinutes < minutesOwed) {
      realtimeSession.status = 'closed'
      realtimeSession.closedAt = now
      realtimeSession.closedReason = 'insufficient_balance'
      realtimeSession.lastActivityAt = now
      await realtimeSession.save()

      return reply.status(402).send({
        message: 'Session closed due to insufficient manna balance',
        realtimeSession: realtimeSession.toObject(),
      })
    }
  }

  // Update last activity
  realtimeSession.lastActivityAt = now
  await realtimeSession.save()

  return reply.status(200).send({
    success: true,
    realtimeSession: realtimeSession.toObject(),
    billedThisTick,
    totalMinutesBilled: realtimeSession.totalMinutesBilled,
  })
}

/**
 * Get realtime session details
 */
export const getRealtimeSession = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user?.userId
  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const { realtimeSessionId } = request.params as CloseRealtimeSessionParams

  const realtimeSession = await RealtimeSession.findById(realtimeSessionId)
  if (!realtimeSession) {
    return reply.status(404).send({ message: 'Realtime session not found' })
  }

  // Verify ownership
  if (realtimeSession.user.toString() !== userId.toString()) {
    return reply.status(403).send({ message: 'Forbidden' })
  }

  return reply.status(200).send({
    realtimeSession: realtimeSession.toObject(),
  })
}

/**
 * Check for inactive sessions and close them
 * This should be called periodically (e.g., via a cron job or scheduled task)
 */
export const closeInactiveSessions = async (): Promise<number> => {
  const now = new Date()
  const timeoutThreshold = new Date(
    now.getTime() - REALTIME_BILLING.INACTIVITY_TIMEOUT_SECONDS * 1000,
  )

  const result = await RealtimeSession.updateMany(
    {
      status: 'active',
      lastActivityAt: { $lt: timeoutThreshold },
    },
    {
      $set: {
        status: 'closed',
        closedAt: now,
        closedReason: 'timeout',
      },
    },
  )

  return result.modifiedCount
}

/**
 * Realtime voice sessions must be billed for the time that actually elapsed.
 *
 * The regression this locks down: processHeartbeat charged exactly ONE minute
 * per heartbeat and advanced totalMinutesBilled by 1, no matter how much time
 * had passed since the last tick. Heartbeat cadence is entirely client-chosen,
 * so the same 60-minute call cost 60 minutes when heartbeated once a minute and
 * 1 minute when heartbeated once — 17.5 manna for an unbounded conversation.
 */
import { REALTIME_BILLING } from '../../src/constants/billingConstants'
import { processHeartbeat } from '../../src/controllers/realtimeSessionBillingController'
import { Manna } from '../../src/models/Manna'
import { User } from '../../src/models/User'
import { RealtimeBillingTick } from '../../src/models/v2/RealtimeBillingTickV2'
import { RealtimeSession } from '../../src/models/v2/RealtimeSessionV2'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const PER_MIN = REALTIME_BILLING.COST_PER_MINUTE // 17.5

type Captured = { statusCode?: number; body?: any }
const makeReply = () => {
  const captured: Captured = {}
  const reply = {
    status(code: number) {
      captured.statusCode = code
      return this
    },
    send(body: any) {
      captured.body = body
      return captured
    },
  }
  return { reply: reply as unknown as FastifyReply, captured }
}

const server = {} as unknown as FastifyInstance
let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
}, 60000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections()
  await Promise.all(collections.map(c => c.deleteMany({})))
}, 30000)

const setup = async ({
  minutesAgo,
  balance,
  subscriptionBalance = 0,
}: {
  minutesAgo: number
  balance: number
  subscriptionBalance?: number
}) => {
  const user = await User.create({
    userId: new mongoose.Types.ObjectId().toString(),
    username: 'caller',
    email: 'caller@example.com',
    normalizedEmail: 'caller@example.com',
    isWeb2: true,
  })
  const manna = await Manna.create({
    user: user._id,
    balance,
    subscriptionBalance,
  })
  const realtimeSession = await RealtimeSession.create({
    user: user._id,
    agent: new mongoose.Types.ObjectId(),
    session: new mongoose.Types.ObjectId(),
    status: 'active',
    startedAt: new Date(Date.now() - minutesAgo * 60_000),
    lastActivityAt: new Date(),
    totalMinutesBilled: 1, // the first minute is billed at session start
  })
  return { user, manna, realtimeSession }
}

const heartbeat = async (userId: string, realtimeSessionId: string) => {
  const { reply, captured } = makeReply()
  await processHeartbeat(
    server,
    {
      user: { userId },
      params: { realtimeSessionId },
    } as unknown as FastifyRequest,
    reply,
  )
  return captured
}

const totalManna = async (userId: mongoose.Types.ObjectId) => {
  const m = await Manna.findOne({ user: userId })
  return (m?.balance ?? 0) + (m?.subscriptionBalance ?? 0)
}

describe('realtime heartbeat billing', () => {
  it('bills every elapsed minute, not one per heartbeat', async () => {
    // 10 minutes of call, one heartbeat. Minute 1 was billed at start.
    const { user, realtimeSession } = await setup({
      minutesAgo: 10,
      balance: 1000,
    })

    const res = await heartbeat(
      user._id.toString(),
      realtimeSession._id.toString(),
    )

    expect(res.statusCode).toBe(200)

    const after = await RealtimeSession.findById(realtimeSession._id)
    expect(after?.totalMinutesBilled).toBe(11)

    // 10 unbilled minutes collected in this tick, not 1.
    expect(await totalManna(user._id as mongoose.Types.ObjectId)).toBe(
      1000 - 10 * PER_MIN,
    )
    expect(
      await RealtimeBillingTick.countDocuments({
        realtimeSession: realtimeSession._id,
      }),
    ).toBe(10)
  })

  it('collects what the balance covers, then closes the session', async () => {
    // 10 minutes owed, but only enough manna for 2 of them.
    const { user, realtimeSession } = await setup({
      minutesAgo: 10,
      balance: 2 * PER_MIN + 1,
    })

    const res = await heartbeat(
      user._id.toString(),
      realtimeSession._id.toString(),
    )

    expect(res.statusCode).toBe(402)

    const after = await RealtimeSession.findById(realtimeSession._id)
    expect(after?.status).toBe('closed')
    expect(after?.closedReason).toBe('insufficient_balance')
    // The two affordable minutes were still collected rather than written off.
    expect(after?.totalMinutesBilled).toBe(3)
    expect(await totalManna(user._id as mongoose.Types.ObjectId)).toBe(1)
  })

  it('does not double-bill a minute across repeated heartbeats', async () => {
    const { user, realtimeSession } = await setup({
      minutesAgo: 5,
      balance: 1000,
    })

    await heartbeat(user._id.toString(), realtimeSession._id.toString())
    const afterFirst = await totalManna(user._id as mongoose.Types.ObjectId)

    const second = await heartbeat(
      user._id.toString(),
      realtimeSession._id.toString(),
    )

    expect(second.statusCode).toBe(200)
    expect(second.body?.billedThisTick).toBe(false)
    expect(await totalManna(user._id as mongoose.Types.ObjectId)).toBe(
      afterFirst,
    )
  })

  it('leaves the balance untouched when it cannot cover a single minute', async () => {
    const { user, realtimeSession } = await setup({
      minutesAgo: 3,
      balance: 0,
      subscriptionBalance: PER_MIN - 1,
    })

    const res = await heartbeat(
      user._id.toString(),
      realtimeSession._id.toString(),
    )

    expect(res.statusCode).toBe(402)
    // No partial debit: the old spendManna zeroed subscriptionBalance and then
    // silently skipped the remainder when the balance leg was short.
    expect(await totalManna(user._id as mongoose.Types.ObjectId)).toBe(
      PER_MIN - 1,
    )
  })
})

import { claimDailyLoginBonus } from '../../src/controllers/auth/authController'
import { Manna } from '../../src/models/Manna'
import { Transaction } from '../../src/models/Transaction'
import { User } from '../../src/models/User'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const TARGET = 10

type CapturedReply = { statusCode?: number; body?: Record<string, unknown> }

const makeReply = () => {
  const captured: CapturedReply = {}
  const reply = {
    status(code: number) {
      captured.statusCode = code
      return this
    },
    send(body: Record<string, unknown>) {
      captured.body = body
      return captured
    },
  }
  return { reply: reply as unknown as FastifyReply, captured }
}

const server = {
  config: { MANNA_BONUS_DAILY_LOGIN: TARGET },
} as unknown as FastifyInstance

const claim = async (userId: string) => {
  const { reply, captured } = makeReply()
  const request = { user: { userId } } as unknown as FastifyRequest
  await claimDailyLoginBonus(server, request, reply)
  return captured
}

const createUser = async (username: string, balance: number, sub = 0) => {
  const user = await User.create({
    userId: new mongoose.Types.ObjectId().toString(),
    username,
    email: `${username}@example.com`,
    normalizedEmail: `${username}@example.com`,
    isWeb2: true,
  })
  await Manna.create({
    user: user._id,
    balance,
    subscriptionBalance: sub,
  })
  return user
}

const balanceOf = async (userId: mongoose.Types.ObjectId) => {
  const manna = await Manna.findOne({ user: userId })
  return manna!.balance
}

let mongod: MongoMemoryServer

describe('claimDailyLoginBonus', () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    await mongoose.connect(mongod.getUri())
  }, 120_000)

  afterAll(async () => {
    await mongoose.disconnect()
    await mongod.stop()
  })

  beforeEach(async () => {
    const { collections } = mongoose.connection
    await Promise.all(
      Object.values(collections).map(collection => collection.deleteMany({})),
    )
  })

  it('tops a user up to the target instead of accumulating', async () => {
    const user = await createUser('poor', 3)

    const res = await claim(user._id.toString())

    expect(res.body?.claimed).toBe(7)
    expect(await balanceOf(user._id)).toBe(TARGET)
  })

  it('grants nothing to a user already at or above the target', async () => {
    const user = await createUser('rich', 500)

    const res = await claim(user._id.toString())

    expect(res.body?.claimed).toBe(0)
    expect(await balanceOf(user._id)).toBe(500)
    // No zero-value ledger noise for a no-op claim.
    expect(
      await Transaction.countDocuments({ type: 'daily_login_bonus' }),
    ).toBe(0)
  })

  it('never reduces a balance that sits between zero and the target', async () => {
    const user = await createUser('middling', 8)

    await claim(user._id.toString())

    expect(await balanceOf(user._id)).toBe(TARGET)
  })

  it('counts subscription manna toward the target', async () => {
    const user = await createUser('subscriber', 0, 5000)

    const res = await claim(user._id.toString())

    expect(res.body?.claimed).toBe(0)
    expect(await balanceOf(user._id)).toBe(0)
  })

  it('credits only once when claimed twice concurrently', async () => {
    const user = await createUser('racer', 0)

    const results = await Promise.all([
      claim(user._id.toString()),
      claim(user._id.toString()),
      claim(user._id.toString()),
    ])

    const granted = results.reduce(
      (sum, r) => sum + ((r.body?.claimed as number) ?? 0),
      0,
    )
    expect(granted).toBe(TARGET)
    expect(await balanceOf(user._id)).toBe(TARGET)
    expect(
      await Transaction.countDocuments({ type: 'daily_login_bonus' }),
    ).toBe(1)
  })

  it('rejects a second claim on the same UTC day but allows the next day', async () => {
    const user = await createUser('returning', 0)

    expect((await claim(user._id.toString())).body?.claimed).toBe(TARGET)
    expect((await claim(user._id.toString())).body?.claimed).toBe(0)

    // Spend back down, then roll the clock to yesterday's claim.
    await Manna.updateOne({ user: user._id }, { $set: { balance: 2 } })
    await User.updateOne(
      { _id: user._id },
      {
        $set: { lastDailyLoginBonus: new Date(Date.now() - 36 * 3600 * 1000) },
      },
    )

    expect((await claim(user._id.toString())).body?.claimed).toBe(8)
    expect(await balanceOf(user._id)).toBe(TARGET)
  })

  it('records the granted delta in the ledger', async () => {
    const user = await createUser('ledger', 4)

    await claim(user._id.toString())

    const tx = await Transaction.findOne({ type: 'daily_login_bonus' })
    expect(tx?.amount).toBe(6)
  })
})

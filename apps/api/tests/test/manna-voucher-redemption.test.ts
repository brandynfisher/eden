import { redeemMannaVoucher } from '../../src/controllers/mannaController'
import { Manna } from '../../src/models/Manna'
import { User } from '../../src/models/User'
import { MannaVoucher } from '../../src/models/v3/MannaVoucher'
import { MannaVoucherRedemption } from '../../src/models/v3/MannaVoucherRedemption'
import { FastifyReply, FastifyRequest } from 'fastify'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

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

const redeem = async (userId: string, code: string) => {
  const { reply, captured } = makeReply()
  const request = {
    user: { userId },
    body: { code },
  } as unknown as FastifyRequest
  await redeemMannaVoucher(request, reply)
  return captured
}

const createUser = async (username: string) =>
  User.create({
    userId: new mongoose.Types.ObjectId().toString(),
    username,
    email: `${username}@example.com`,
    normalizedEmail: `${username}@example.com`,
    isWeb2: true,
  })

let mongod: MongoMemoryServer

describe('redeemMannaVoucher', () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    await mongoose.connect(mongod.getUri())
    await MannaVoucherRedemption.syncIndexes()
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
    await MannaVoucherRedemption.syncIndexes()
  })

  it('credits a user only once when the same redemption is submitted twice concurrently', async () => {
    const user = await createUser('student')
    const voucher = await MannaVoucher.create({
      amount: 100,
      code: 'workshop',
      maxUses: 20,
      usedCount: 0,
    })

    const results = await Promise.all([
      redeem(user._id.toString(), 'workshop'),
      redeem(user._id.toString(), 'workshop'),
    ])

    const statuses = results.map(result => result.statusCode).sort()
    expect(statuses).toEqual([200, 400])

    const manna = await Manna.findOne({ user: user._id })
    expect(manna?.balance).toBe(100)

    const refreshed = await MannaVoucher.findById(voucher._id)
    expect(refreshed?.usedCount).toBe(1)

    expect(
      await MannaVoucherRedemption.countDocuments({ voucher: voucher._id }),
    ).toBe(1)
  })

  it('rejects a second sequential redemption by the same user', async () => {
    const user = await createUser('student')
    const voucher = await MannaVoucher.create({
      amount: 100,
      code: 'workshop',
      maxUses: 20,
      usedCount: 0,
    })

    expect((await redeem(user._id.toString(), 'workshop')).statusCode).toBe(200)

    const second = await redeem(user._id.toString(), 'workshop')
    expect(second.statusCode).toBe(400)
    expect(second.body?.message).toBe('User has already redeemed this voucher')

    const refreshed = await MannaVoucher.findById(voucher._id)
    expect(refreshed?.usedCount).toBe(1)
  })

  it('lets distinct users each redeem the same voucher once', async () => {
    const [first, second] = await Promise.all([
      createUser('student-a'),
      createUser('student-b'),
    ])
    const voucher = await MannaVoucher.create({
      amount: 100,
      code: 'workshop',
      maxUses: 20,
      usedCount: 0,
    })

    const results = await Promise.all([
      redeem(first._id.toString(), 'workshop'),
      redeem(second._id.toString(), 'workshop'),
    ])
    expect(results.map(result => result.statusCode)).toEqual([200, 200])

    const refreshed = await MannaVoucher.findById(voucher._id)
    expect(refreshed?.usedCount).toBe(2)

    expect(
      await MannaVoucherRedemption.countDocuments({ voucher: voucher._id }),
    ).toBe(2)
  })

  it('fails closed on an empty allow list rather than opening the voucher', async () => {
    // An allow list that is present but empty means "nobody", not "everybody" —
    // an allow list computed from a query that matched nothing must not publish
    // a restricted voucher to the world. createMannaVoucher normalizes genuinely
    // unrestricted vouchers to null, so [] only arises when a list was intended.
    const user = await createUser('student')
    await MannaVoucher.create({
      amount: 100,
      code: 'workshop',
      allowedUserIds: [],
      maxUses: 20,
      usedCount: 0,
    })

    expect((await redeem(user._id.toString(), 'workshop')).statusCode).toBe(400)
  })

  it('treats a null allow list as unrestricted', async () => {
    const user = await createUser('student')
    await MannaVoucher.create({
      amount: 100,
      code: 'open-workshop',
      allowedUserIds: null,
      maxUses: 20,
      usedCount: 0,
    })

    expect(
      (await redeem(user._id.toString(), 'open-workshop')).statusCode,
    ).toBe(200)
  })

  it('still enforces a populated allow list', async () => {
    const [allowed, blocked] = await Promise.all([
      createUser('student-a'),
      createUser('student-b'),
    ])
    await MannaVoucher.create({
      amount: 100,
      code: 'workshop',
      allowedUserIds: [allowed.userId],
      maxUses: 20,
      usedCount: 0,
    })

    expect((await redeem(allowed._id.toString(), 'workshop')).statusCode).toBe(
      200,
    )

    const rejected = await redeem(blocked._id.toString(), 'workshop')
    expect(rejected.statusCode).toBe(400)
    expect(rejected.body?.message).toBe(
      'User not in allow list of this voucher',
    )
  })

  it('does not consume a use when the voucher pool is exhausted', async () => {
    const [first, second] = await Promise.all([
      createUser('student-a'),
      createUser('student-b'),
    ])
    const voucher = await MannaVoucher.create({
      amount: 100,
      code: 'workshop',
      maxUses: 1,
      usedCount: 0,
    })

    expect((await redeem(first._id.toString(), 'workshop')).statusCode).toBe(
      200,
    )

    const exhausted = await redeem(second._id.toString(), 'workshop')
    expect(exhausted.statusCode).toBe(400)

    const refreshed = await MannaVoucher.findById(voucher._id)
    expect(refreshed?.usedCount).toBe(1)
    expect(await Manna.findOne({ user: second._id })).toBeNull()
  })
})

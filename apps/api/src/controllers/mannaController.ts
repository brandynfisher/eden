import { randomId } from '../lib/util'
import { Manna } from '../models/Manna'
import { Transaction } from '../models/Transaction'
import { User, UserDocument } from '../models/User'
import {
  MannaVoucher,
  MannaVoucherDocument,
  VoucherAction,
} from '../models/v3/MannaVoucher'
import { MannaVoucherRedemption } from '../models/v3/MannaVoucherRedemption'
import { MannaModifyRequestBody } from '../routes/adminRoutes'
import { FeatureFlag, MannaVouchersRedeemArguments } from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

export const modifyManna = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, amount } = request.body as MannaModifyRequestBody

  const user = await User.findOne({ userId })

  if (!user) {
    return reply.status(400).send({
      message: `User ${userId} not found`,
    })
  }

  const manna = await Manna.findOne({
    user: user._id,
  })
  let newManna

  if (!manna) {
    newManna = new Manna({
      user: user._id,
      balance: amount,
    })
    await newManna.save()
  } else {
    manna.balance += amount
    await manna.save()
    newManna = manna
  }

  const transaction = new Transaction({
    manna: newManna._id,
    amount,
    type: 'admin_modify',
  })
  await transaction.save()

  return reply.status(200).send({
    userId,
    manna: newManna.balance,
    transactionId: transaction._id,
  })
}

interface MannaVoucherCreateRequestBody {
  amount: number
  allowedUserIds?: string[]
  numberOfUses?: number
  code?: string
  action?: VoucherAction
  ttlSeconds?: number
}

const validActions = [
  VoucherAction.AddManna,
  VoucherAction.GrantEden2Access,
  VoucherAction.SubscriptionTrialPro30d,
  VoucherAction.MarsCollege26,
]

const DEFAULT_VOUCHER_TTL_SECONDS = 60 * 60 * 24
const MARS_COLLEGE_DAILY_MANNA_TARGET = 1000

export const createMannaVoucher = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { allowedUserIds, amount, numberOfUses, code, action, ttlSeconds } =
    request.body as MannaVoucherCreateRequestBody

  if (action) {
    if (!validActions.includes(action)) {
      return reply
        .status(400)
        .send({ message: `Unknown voucher action ${action}` })
    }
  }

  const maxUses = numberOfUses ?? 1

  if (maxUses <= 0) {
    return reply.status(400).send({
      message: 'numberOfUses must be greater than 0',
    })
  }

  if (maxUses > 1000) {
    return reply.status(400).send({
      message: `Maximum numberOfUses is 1000, you requested ${maxUses}`,
    })
  }

  const newCode = code || randomId(16)
  const expiresInSeconds = ttlSeconds ?? DEFAULT_VOUCHER_TTL_SECONDS
  if (expiresInSeconds <= 0) {
    return reply.status(400).send({
      message: 'ttlSeconds must be greater than 0',
    })
  }

  const existingVoucher = await MannaVoucher.findOne({
    code: newCode,
  }).collation({ locale: 'en', strength: 2 })
  if (existingVoucher) {
    return reply.status(400).send({
      message: `Voucher code ${newCode} already exists`,
    })
  }

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)
  const mannaVoucher = new MannaVoucher({
    allowedUserIds: allowedUserIds || null,
    amount,
    code: newCode,
    action,
    maxUses,
    usedCount: 0,
    expiresAt,
  })

  await mannaVoucher.save()

  return reply.status(200).send({
    code: newCode,
  })
}

export const getBalance = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const user = await User.findById(userId)

  if (!user) {
    return reply.status(400).send({
      message: `User ${userId} not found`,
    })
  }

  const manna = await Manna.findOne({
    user: user._id,
  })

  if (!manna) {
    return reply.status(400).send({
      message: `Manna not found for user ${userId}`,
    })
  }

  return reply.status(200).send({
    balance: manna.balance,
    subscriptionBalance: manna.subscriptionBalance ?? 0,
  })
}

export const redeemMannaVoucher = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user.userId
  const { code } = request.body as MannaVouchersRedeemArguments

  const user = await User.findById(userId)

  if (!user) {
    return reply.status(400).send({
      message: `User ${userId} not found`,
    })
  }

  const voucher = await MannaVoucher.findOne({
    code,
  }).collation({ locale: 'en', strength: 2 })

  if (!voucher) {
    return reply.status(400).send({
      message: `Voucher ${code} not found`,
    })
  }

  if (!voucher.maxUses) {
    return reply.status(400).send({
      message: `Voucher ${code} is legacy and no longer supported`,
    })
  }

  return redeemMannaVoucherV2(reply, user, voucher)
}

type VoucherApplyResult = {
  action: string
  success?: boolean
  manna?: number
  subscriptionBalance?: number
  topupAmount?: number
  transactionId?: string
}

type VoucherApplyError = {
  statusCode: number
  message: string
}

const createVoucherError = (
  message: string,
  statusCode = 400,
): VoucherApplyError => ({
  statusCode,
  message,
})

const isVoucherApplyError = (error: unknown): error is VoucherApplyError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error
  )
}

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  )
}

const applyEden2AccessVoucher = async (
  user: UserDocument,
): Promise<VoucherApplyResult> => {
  const hasEarlyAccessFlag =
    user.featureFlags?.includes(FeatureFlag.Eden2EarlyAccess) ?? false
  if (hasEarlyAccessFlag) {
    throw createVoucherError('User already has Early Access flag')
  }

  user.featureFlags = [
    ...(user.featureFlags || []),
    FeatureFlag.Eden2EarlyAccess,
  ]
  await user.save()

  return {
    action: 'Early access granted',
    success: true,
  }
}

const applyMannaVoucher = async (
  user: UserDocument,
  voucher: MannaVoucherDocument,
): Promise<VoucherApplyResult> => {
  const manna = await Manna.findOne({ user: user._id })

  let newBalance
  let mannaId

  if (!manna) {
    const newManna = new Manna({
      user: user._id,
      balance: voucher.amount,
    })
    newBalance = newManna.balance
    mannaId = newManna._id
    await newManna.save()
  } else {
    manna.balance += voucher.amount
    newBalance = manna.balance
    mannaId = manna._id
    await manna.save()
  }

  const transaction = new Transaction({
    manna: mannaId,
    amount: voucher.amount,
    type: 'credit_voucher',
    voucher: voucher._id,
    code: voucher.code,
  })
  await transaction.save()

  return {
    action: 'Manna voucher redeemed',
    manna: newBalance,
    transactionId: transaction._id,
  }
}

const applyMarsCollegeVoucher = async (
  user: UserDocument,
  voucher: MannaVoucherDocument,
): Promise<VoucherApplyResult> => {
  const hasMarsCollegeFlag =
    user.featureFlags?.includes(FeatureFlag.MarsCollege26) ?? false
  if (hasMarsCollegeFlag) {
    throw createVoucherError('User already has Mars College flag')
  }

  user.featureFlags = [...(user.featureFlags || []), FeatureFlag.MarsCollege26]
  await user.save()

  const manna = await Manna.findOne({ user: user._id })

  let transactionId: string | undefined
  let subscriptionBalance = MARS_COLLEGE_DAILY_MANNA_TARGET
  let topupAmount = MARS_COLLEGE_DAILY_MANNA_TARGET
  let mannaId

  if (!manna) {
    const newManna = new Manna({
      user: user._id,
      subscriptionBalance: MARS_COLLEGE_DAILY_MANNA_TARGET,
    })
    subscriptionBalance = newManna.subscriptionBalance
    mannaId = newManna._id
    await newManna.save()
  } else {
    const currentBalance = manna.subscriptionBalance ?? 0
    if (currentBalance >= MARS_COLLEGE_DAILY_MANNA_TARGET) {
      subscriptionBalance = currentBalance
      topupAmount = 0
    } else {
      topupAmount = MARS_COLLEGE_DAILY_MANNA_TARGET - currentBalance
      manna.subscriptionBalance = MARS_COLLEGE_DAILY_MANNA_TARGET
      subscriptionBalance = manna.subscriptionBalance
      await manna.save()
    }
    mannaId = manna._id
  }

  if (topupAmount > 0) {
    const transaction = new Transaction({
      manna: mannaId,
      amount: topupAmount,
      type: 'daily_topup_mars_college_26',
      voucher: voucher._id,
      code: voucher.code,
    })
    await transaction.save()
    transactionId = transaction._id
  }

  return {
    action: 'Mars College access granted',
    success: true,
    subscriptionBalance,
    topupAmount,
    transactionId,
  }
}

const applyVoucherAction = async (
  user: UserDocument,
  voucher: MannaVoucherDocument,
): Promise<VoucherApplyResult> => {
  if (!voucher.action || voucher.action === VoucherAction.AddManna) {
    return applyMannaVoucher(user, voucher)
  }

  switch (voucher.action) {
    case VoucherAction.GrantEden2Access: {
      return applyEden2AccessVoucher(user)
    }
    case VoucherAction.MarsCollege26: {
      return applyMarsCollegeVoucher(user, voucher)
    }
    default:
      throw createVoucherError(`Unhandled voucher action: ${voucher.action}`)
  }
}

const redeemMannaVoucherV2 = async (
  reply: FastifyReply,
  user: UserDocument,
  voucher: MannaVoucherDocument,
) => {
  const now = new Date()
  const maxUses = voucher.maxUses ?? 0

  if (voucher.expiresAt && voucher.expiresAt <= now) {
    return reply.status(400).send({
      message: `Voucher ${voucher.code} expired`,
    })
  }

  if (maxUses <= 0) {
    return reply.status(400).send({
      message: `Voucher ${voucher.code} is not configured for redemption`,
    })
  }

  if (voucher.allowedUserIds && !voucher.allowedUserIds.includes(user.userId)) {
    return reply.status(400).send({
      message: `User not in allow list of this voucher`,
    })
  }

  const existingRedemption = await MannaVoucherRedemption.findOne({
    voucher: voucher._id,
    user: user._id,
  })
  if (existingRedemption) {
    return reply.status(400).send({
      message: `User has already redeemed this voucher`,
    })
  }

  const claimQuery: Record<string, unknown> = {
    _id: voucher._id,
    maxUses: { $exists: true },
    usedCount: { $lt: maxUses },
  }
  if (voucher.expiresAt) {
    claimQuery.expiresAt = { $gt: now }
  }

  const claimedVoucher = await MannaVoucher.findOneAndUpdate(
    claimQuery,
    { $inc: { usedCount: 1 } },
    { new: true },
  )
  if (!claimedVoucher) {
    return reply.status(400).send({
      message: `Manna voucher ${voucher.code} already finished`,
    })
  }

  try {
    const result = await applyVoucherAction(user, voucher)
    await MannaVoucherRedemption.create({
      voucher: voucher._id,
      user: user._id,
      code: voucher.code,
    })
    return reply.status(200).send(result)
  } catch (error) {
    await MannaVoucher.updateOne(
      { _id: voucher._id },
      { $inc: { usedCount: -1 } },
    )
    if (isVoucherApplyError(error)) {
      return reply.status(error.statusCode).send({ message: error.message })
    }
    if (isDuplicateKeyError(error)) {
      return reply.status(400).send({
        message: `User has already redeemed this voucher`,
      })
    }
    throw error
  }
}

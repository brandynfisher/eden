import { randomId } from '../lib/util'
import { User } from '../models/Creator'
import { Manna } from '../models/Manna'
import { MannaVoucher } from '../models/MannaVoucher'
import { Transaction } from '../models/Transaction'
import { MannaModifyRequestBody } from '../routes/adminRoutes'
import { MannaVouchersRedeemArguments } from '@edenlabs/eden-sdk'
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
}

export const createMannaVoucher = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { allowedUserIds, amount, numberOfUses, code } =
    request.body as MannaVoucherCreateRequestBody

  const numVouchers = numberOfUses || 1

  if (numVouchers > 1 && !code) {
    return reply.status(400).send({
      message: 'Code is required if numberOfUses > 1',
    })
  }

  if (numVouchers > 100) {
    return reply.status(400).send({
      message: `Maximum numberOfUses is 100, you requested ${numVouchers}`,
    })
  }

  let newCode
  for (let i = 0; i < numVouchers; i++) {
    newCode = code || randomId(16)
    const mannaVoucher = new MannaVoucher({
      allowedUserIds: allowedUserIds || null,
      amount,
      code: newCode,
    })

    await mannaVoucher.save()
  }

  return reply.status(200).send({
    code: newCode,
  })
}

export const getBalance = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user

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

  const mannaVouchersAll = await MannaVoucher.findOne({
    code,
  })

  if (!mannaVouchersAll) {
    return reply.status(400).send({
      message: `Manna voucher ${code} not found`,
    })
  }

  const mannaVouchersUsedByUser = await MannaVoucher.find({
    code: code,
    redeemedBy: user._id,
  })

  console.log(mannaVouchersUsedByUser)

  if (mannaVouchersUsedByUser.length > 0) {
    console.log('ITS THIS:', mannaVouchersUsedByUser)
    return reply.status(400).send({
      message: `User has already redeemed this voucher`,
    })
  }

  const mannaVoucher = await MannaVoucher.findOne({
    code,
    used: false,
  })

  if (!mannaVoucher) {
    return reply.status(400).send({
      message: `Manna voucher ${code} already finished`,
    })
  }

  if (
    mannaVoucher.allowedUserIds &&
    !mannaVoucher.allowedUserIds.includes(user.userId)
  ) {
    return reply.status(400).send({
      message: `User not in allow list of this voucher`,
    })
  }

  const manna = await Manna.findOne({
    user: user._id,
  })

  let newBalance
  let mannaId

  if (!manna) {
    const newManna = new Manna({
      user: user._id,
      balance: mannaVoucher.amount,
    })
    newBalance = newManna.balance
    mannaId = newManna._id
    await newManna.save()
  } else {
    manna.balance += mannaVoucher.amount
    newBalance = manna.balance
    mannaId = manna._id
    await manna.save()
  }

  const transaction = new Transaction({
    manna: mannaId,
    amount: mannaVoucher.amount,
  })
  await transaction.save()

  mannaVoucher.used = true
  mannaVoucher.redeemedBy = user._id
  await mannaVoucher.save()

  return reply.status(200).send({
    manna: newBalance,
    transactionId: transaction._id,
  })
}

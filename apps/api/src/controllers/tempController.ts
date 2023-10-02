import { AuthLoginArguments } from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { ApiKey } from '../models/ApiKey'
import { Character } from '../models/Character'
import { Concept } from '../models/Concept'
import { Creation } from '../models/Creation'
import { Follow } from '../models/Follow'
import { Manna } from '../models/Manna'
import { MannaVoucher } from '../models/MannaVoucher'
import { Reaction } from '../models/Reaction'
import { Session } from '../models/Session'
import { Task } from '../models/Task'
import { UserMigration } from '../models/UserMigration'
import { validateChallenge } from './auth/authController'

export const migrateCreator = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { address, signature, message } = request.body as AuthLoginArguments
  const { authUser, challenge } = await validateChallenge(
    address,
    message,
    signature,
    reply,
  )

  if (!authUser) {
    return reply.status(404).send({
      message: 'No user with this wallet found.',
    })
  }

  // check if this user has already been migrated
  const alreadyMigrated = await UserMigration.exists({
    oldUser: authUser._id,
  })
  if (alreadyMigrated) {
    return reply.status(400).send({
      message: 'User has already been migrated',
    })
  }

  // migrate creations from old user to new user
  await Creation.updateMany(
    {
      user: authUser._id,
    },
    {
      user: userId,
    },
  )

  // migrate tasks
  await Task.updateMany(
    {
      user: authUser._id,
    },
    {
      user: userId,
    },
  )

  // migrate api keys
  await ApiKey.updateMany(
    {
      user: authUser._id,
    },
    {
      user: userId,
    },
  )

  // migrate concepts
  await Concept.updateMany(
    {
      user: authUser._id,
    },
    {
      user: userId,
    },
  )

  await MannaVoucher.updateMany(
    {
      redeemedBy: authUser._id,
    },
    {
      redeemedBy: userId,
    },
  )

  // migrate following/followers
  await Follow.updateMany(
    {
      follower: authUser._id,
    },
    {
      follower: userId,
    },
  )
  await Follow.updateMany(
    {
      following: authUser._id,
    },
    {
      following: userId,
    },
  )

  // migrate reactions
  await Reaction.updateMany(
    {
      user: authUser._id,
    },
    {
      user: userId,
    },
  )

  // migrate character
  await Character.updateMany(
    {
      user: authUser._id,
    },
    {
      user: userId,
    },
  )

  // migrate sessions
  await Session.updateMany(
    {
      user: authUser._id,
    },
    {
      user: userId,
    },
  )

  // update the new user's manna to the max of the two
  const authUserManna = await Manna.findOne({
    user: authUser._id,
  })
  const newUserIdManna = await Manna.findOne({
    user: userId,
  })
  const maxBalance = Math.max(
    authUserManna?.balance || 0,
    newUserIdManna?.balance || 0,
  )

  await Manna.updateOne(
    {
      user: userId,
    },
    {
      balance: maxBalance,
    },
  )

  // record migration
  await UserMigration.create({
    user: userId,
    oldUser: authUser._id,
  })

  // mark the challenge as acknowledged
  challenge.ack = true
  await challenge.save()

  return reply.status(200).send({})
}

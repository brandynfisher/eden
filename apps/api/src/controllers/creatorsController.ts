import {
  AuthLoginArguments,
  CreatorsFollowArguments,
  CreatorsGetArguments,
  CreatorsListArguments,
  CreatorsUnfollowArguments,
  CreatorsUpdateArguments,
  FollowersListArguments,
  FollowingListArguments,
} from '@edenlabs/eden-sdk'
import { ethers } from 'ethers'
import { FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import { SiweMessage } from 'siwe'

import { ApiKey } from '../models/ApiKey'
import Challenge from '../models/Challenge'
import { Character } from '../models/Character'
import { Concept } from '../models/Concept'
import { Creation } from '../models/Creation'
import { User } from '../models/Creator'
import { Follow, FollowDocument } from '../models/Follow'
import { Manna } from '../models/Manna'
import { MannaVoucher } from '../models/MannaVoucher'
import { Reaction } from '../models/Reaction'
import { Session } from '../models/Session'
import { Task } from '../models/Task'
import { UserMigration } from '../models/UserMigration'
import CreatorRepository from '../repositories/CreatorRepository'
import FollowerRepository from '../repositories/FollowerRepository'

export const listCreators = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, limit, page, sort } = request.query as CreatorsListArguments

  const creatorRepository = new CreatorRepository(User)
  const creators = await creatorRepository.query(
    {
      userId,
    },
    {
      limit,
      page,
      sort,
    },
  )

  return reply.status(200).send(creators)
}

const aggregateFollowerByUserId = (userId: string) => {
  return Follow.aggregate([
    {
      $match: {
        following: {
          $eq: new ObjectId(userId),
        },
      },
    },
    {
      $project: {
        _id: 0,
        follower: 1,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'follower',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
      },
    },
    {
      $replaceRoot: {
        newRoot: '$user',
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        username: 1,
        userImage: 1,
      },
    },
  ])
}

const aggregateFollowingByUserId = (userId: string) => {
  return Follow.aggregate([
    {
      $match: {
        follower: {
          $eq: new ObjectId(userId),
        },
      },
    },
    {
      $project: {
        _id: 0,
        following: 1,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'following',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
      },
    },
    {
      $replaceRoot: {
        newRoot: '$user',
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        username: 1,
        userImage: 1,
      },
    },
  ])
}

export const listCreatorFollowers = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { limit, page } = request.query as FollowersListArguments
  const { userId } = request.params as FollowersListArguments
  const creatorDoc = await User.findOne({ userId })

  if (!creatorDoc) {
    return reply.status(404).send({
      message: 'Creator not found',
    })
  }

  const followCreationRepository = new FollowerRepository(Follow)
  const followAggregate = aggregateFollowerByUserId(creatorDoc._id)
  const followers = await followCreationRepository.aggregateQuery(
    followAggregate,
    {
      limit,
      page,
      sort: { createdAt: -1 },
    },
  )

  return reply.status(200).send(followers)
}

export const listCreatorFollowing = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { limit, page } = request.query as FollowingListArguments
  const { userId } = request.params as FollowersListArguments

  const creatorDoc = await User.findOne({ userId })

  if (!creatorDoc) {
    return reply.status(404).send({
      message: 'Creator not found',
    })
  }

  const followCreationRepository = new FollowerRepository(Follow)
  const followAggregate = aggregateFollowingByUserId(creatorDoc._id)
  const following = await followCreationRepository.aggregateQuery(
    followAggregate,
    {
      limit,
      page,
      sort: { createdAt: -1 },
    },
  )

  return reply.status(200).send(following)
}

export const getCreator = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.params as CreatorsGetArguments
  const creatorDoc = await User.findOne({
    $or: [
      { userId },
      { username: { $regex: userId.toLowerCase(), $options: 'i' } },
    ],
  })
  if (!creatorDoc) {
    return reply.status(404).send({
      message: 'Creator not found',
    })
  }

  const creationsCount = await Creation.count({ user: creatorDoc?._id })
  const followers = await Follow.find({ following: creatorDoc?._id })
  const following = await Follow.find({ follower: creatorDoc?._id })
  let isFollowing = false
  if (request.user?.userId) {
    const followerQuery = await Follow.findOne({
      follower: request.user.userId,
      following: creatorDoc._id,
    })

    isFollowing = !!followerQuery
  }
  const creator = {
    ...creatorDoc.toObject(),
    followerCount: followers.length,
    followingCount: following.length,
    creationsCount,
    isFollowing,
  }
  return reply.status(200).send({ creator })
}

export const updateCreator = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { username, userImage } = request.body as CreatorsUpdateArguments

  const creator = await User.findById(userId)
  if (!creator) {
    return reply.status(404).send({
      message: 'Creator not found',
    })
  }
  if (username) {
    if (username.length < 3 || username.length > 32) {
      console.log('xxx', username)
      if (username === creator.userId) {
        creator.username = username
      } else {
        return reply.status(400).send({
          message:
            'Username must be between 3 and 32 characters (or your address)',
        })
      }
    }

    // check if username exists, case-insensitive
    const userExists = await User.exists({
      username: { $regex: username.toLowerCase(), $options: 'i' },
    })

    if (userExists) {
      return reply.status(400).send({
        message: 'Username already taken',
      })
    }

    creator.username = username
  }

  if (userImage) {
    creator.userImage = userImage
  }

  try {
    await creator.save()
  } catch (e) {
    return reply.status(400).send({
      message: 'Failed to save',
    })
  }

  return reply.status(200).send({
    creator,
  })
}

export const followCreator = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { userId: userIdToFollow } = request.body as CreatorsFollowArguments

  const userToFollow = await User.findOne({ userId: userIdToFollow })
  const user = await User.findById(userId)

  if (!user) {
    return reply.status(400).send({
      message: 'User does not exist',
    })
  }

  if (!userToFollow) {
    return reply.status(400).send({
      message: 'User does not exist',
    })
  }

  if (userId.toString() === userIdToFollow) {
    return reply.status(400).send({
      message: 'Cannot follow yourself',
    })
  }

  const followData = {
    follower: userId,
    following: userToFollow._id,
  }

  const followResult = await Follow.findOne(followData)

  if (followResult) {
    return reply.status(400).send({
      message: 'Already following user',
    })
  }

  await Follow.create(followData)

  await userToFollow.updateOne({
    $inc: {
      followersCount: 1,
    },
  })
  await user.updateOne({
    $inc: {
      followingCount: 1,
    },
  })

  return reply.status(200).send({
    success: true,
  })
}

export const unfollowCreator = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { userId: userIdToUnfollow } = request.body as CreatorsUnfollowArguments

  const userToUnfollow = await User.findOne({ userId: userIdToUnfollow })
  const user = await User.findById(userId)

  if (!user) {
    return reply.status(400).send({
      message: 'User does not exist',
    })
  }

  if (!userToUnfollow) {
    return reply.status(400).send({
      message: 'User does not exist',
    })
  }

  if (userId.toString() === userIdToUnfollow) {
    return reply.status(400).send({
      message: 'Cannot follow yourself',
    })
  }

  const followData = {
    follower: userId,
    following: userToUnfollow._id,
  }

  const follow: FollowDocument | null = await Follow.findOne(followData)

  if (!follow) {
    return reply.status(400).send({
      message: 'Not following user',
    })
  }

  await follow.remove()

  await userToUnfollow.updateOne({
    $inc: {
      followersCount: -1,
    },
  })
  await user.updateOne({
    $inc: {
      followingCount: -1,
    },
  })

  return reply.status(200).send({
    success: true,
  })
}

export const migrateCreator = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { address, signature, message } = request.body as AuthLoginArguments

  // first, find the most recent challenge for this address
  const challenge = await Challenge.findOne({
    address,
  }).sort({ createdAt: -1 })

  if (!challenge) {
    return reply.status(400).send({
      message: 'No challenge found for this address',
    })
  }

  // Verify the challenge has not expired
  if (challenge.expiresAt < new Date()) {
    return reply.status(400).send({
      message: 'Challenge has expired',
    })
  }

  // Verify the challenge has not been acknowledged
  if (challenge.ack) {
    return reply.status(400).send({
      message: 'Challenge has already been used',
    })
  }

  // verify the signature
  const recovered = ethers.utils.verifyMessage(message, signature)

  if (address.toLowerCase() !== recovered.toLowerCase()) {
    return reply.status(400).send({
      message: 'Signature is invalid',
    })
  }

  // check that the nonce matches
  const { nonce } = new SiweMessage(message)
  console.log('xxx', nonce)
  console.log('yyy', challenge.nonce)

  if (nonce !== challenge.nonce) {
    return reply.status(400).send({
      message: 'Nonce does not match',
    })
  }

  const authUser = await User.findOne({
    userId: address,
  })

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

  return reply.status(200).send({})
}

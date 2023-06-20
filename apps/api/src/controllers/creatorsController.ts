import {
  CreatorsFollowArguments,
  CreatorsGetArguments,
  CreatorsListArguments,
  CreatorsUnfollowArguments,
} from '@eden-labs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { User } from '../models/Creator'
import { Follow, FollowDocument } from '../models/Follow'
import CreatorRepository from '../repositories/CreatorRepository'

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

export const getCreator = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.params as CreatorsGetArguments
  const creatorDoc = await User.findOne({ userId })
  if (!creatorDoc) {
    return reply.status(404).send({
      message: 'Creator not found',
    })
  }
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
    isFollowing,
  }
  return reply.status(200).send({ creator })
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

  return await reply.status(200).send({
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

  return await reply.status(200).send({
    success: true,
  })
}

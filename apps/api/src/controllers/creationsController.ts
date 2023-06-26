import {
  CreationsGetArguments,
  CreationsListArguments,
  CreationsReactArguments,
  CreationsUnreactArguments,
  ReactionType,
} from '@eden-labs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { Creation } from '../models/Creation'
import { User } from '../models/Creator'
import { Reaction } from '../models/Reaction'
import CreationRepository from '../repositories/CreationRepository'
import CreatorRepository from '../repositories/CreatorRepository'

export const listCreations = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, limit, page, sort } = request.query as CreationsListArguments
  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId,
  })

  const creationRepository = new CreationRepository(Creation)
  const creations = await creationRepository.query(
    {
      user: creators.docs
        ? creators.docs.map(creator => creator._id)
        : undefined,
    },
    {
      limit,
      page,
      sort,
    },
  )

  return reply.status(200).send(creations)
}

export const getCreation = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { creationId } = request.params as CreationsGetArguments

  try {
    const creation = await Creation.findById(creationId)
      .populate({
        path: 'task',
        select: 'config status generator',
        populate: { path: 'generator' },
      })
      .populate({
        path: 'user',
        select: 'userId',
      })

    return await reply.status(200).send({ creation })
  } catch (error) {
    return reply.status(404).send({
      message: 'Creation not found',
    })
  }
}

export const creationReact = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { creationId, reaction } = request.body as CreationsReactArguments

  // check if reaction in ReactionType enum
  if (!Object.values(ReactionType).includes(reaction)) {
    return reply.status(400).send({
      message: 'Invalid reaction',
    })
  }

  const creation = await Creation.findById(creationId)

  if (!creation) {
    return reply.status(404).send({
      message: 'Creation not found',
    })
  }

  const reactionData = {
    creation: creationId,
    user: userId,
    reaction,
  }

  const existingReaction = await Reaction.findOne(reactionData)

  if (existingReaction) {
    return reply.status(400).send({
      message: 'Reaction already exists',
    })
  }

  await Reaction.create(reactionData)

  return await reply.status(200).send({
    success: true,
  })
}

export const creationUnreact = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { creationId, reaction } = request.body as CreationsUnreactArguments

  // check if reaction in ReactionType enum
  if (!Object.values(ReactionType).includes(reaction)) {
    return reply.status(400).send({
      message: 'Invalid reaction',
    })
  }

  const creation = await Creation.findById(creationId)

  if (!creation) {
    return reply.status(404).send({
      message: 'Creation not found',
    })
  }

  const reactionData = {
    creation: creationId,
    user: userId,
    reaction,
  }

  const existingReaction = await Reaction.findOne(reactionData)

  if (!existingReaction) {
    return reply.status(400).send({
      message: 'Reaction does not exist',
    })
  }

  await existingReaction.remove()
  return await reply.status(200).send({
    success: true,
  })
}

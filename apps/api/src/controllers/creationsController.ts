import {
  CreationsGetArguments,
  CreationsListArguments,
  CreationsReactArguments,
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
    const creation = await Creation.findById(creationId).populate({
      path: 'task',
      select: 'config status',
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

  // check if user has already reacted
  const existingReaction = await Reaction.findOne(reactionData)

  if (existingReaction) {
    await existingReaction.remove()
  } else {
    const newReaction = new Reaction(reactionData)
    await newReaction.save()
  }
  return await reply.status(200).send({
    success: true,
  })
}

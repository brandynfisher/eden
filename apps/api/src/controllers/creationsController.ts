import {
  CreationsGetArguments,
  CreationsListArguments,
} from '@eden-labs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { Creation } from '../models/Creation'
import { User } from '../models/Creator'
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

// export const getCollections = async (
//   request: FastifyRequest,
//   reply: FastifyReply,
// ) => {
//   const { creationId } = request.params as CreationGetParams

//   let collections: CollectionEventDocument[] = []
//   try {
//     collections = await CollectionEvent.find({
//       creation: creationId,
//     }).populate({
//       path: 'collectionId',
//       select: 'name user createdAt',
//     })
//   } catch (error) {
//     return reply.status(404).send({
//       message: 'Creation not found',
//     })
//   }

//   return reply.status(200).send({ collections })
// }

// export const getRecreations = async (
//   request: FastifyRequest,
//   reply: FastifyReply,
// ) => {
//   const { creationId } = request.params as CreationGetParams

//   let creations: CreationDocument[] = []

//   try {
//     creations = await Creation.find({
//       parent: creationId,
//     }).populate({
//       path: 'task',
//       select: 'config status generator',
//       populate: {
//         path: 'generator',
//         select: 'generatorName',
//       },
//     })
//   } catch (error) {
//     return reply.status(404).send({
//       message: 'Creation not found',
//     })
//   }

//   return reply.status(200).send({ creations })
// }

// export const getReactions = async (
//   request: FastifyRequest,
//   reply: FastifyReply,
// ) => {
//   const { creationId } = request.params as CreationGetParams
//   const { reactions: reactionStrings } = request.body as { reactions: string[] }

//   const filter = {
//     creation: creationId,
//   }

//   if (reactionStrings && reactionStrings.length > 0) {
//     Object.assign(filter, { reaction: { $in: reactionStrings } })
//   }

//   let reactions: ReactionDocument[] = []

//   try {
//     reactions = await Reaction.find(filter).populate({
//       path: 'user',
//       select: 'username',
//     })
//   } catch (error) {
//     return reply.status(404).send({
//       message: 'Creation not found',
//     })
//   }

//   return reply.status(200).send({ reactions })
// }

// export const react = async (request: FastifyRequest, reply: FastifyReply) => {
//   const { creationId } = request.params as CreationGetParams
//   const { reaction, unreact } = request.body as {
//     reaction: string
//     unreact: boolean
//   }
//   const { userId } = request.user

//   let creation: CreationDocument | null = null

//   try {
//     creation = await Creation.findById(creationId)
//   } catch (error) {
//     return reply.status(404).send({
//       message: 'Creation not found',
//     })
//   }

//   if (!creation) {
//     return reply.status(404).send({
//       message: 'Creation not found',
//     })
//   }

//   const reactionData = {
//     creation: creationId,
//     user: userId,
//     reaction,
//   }

//   // check if user has already reacted
//   const existingReaction = await Reaction.findOne(reactionData)

//   // remove reaction
//   if (existingReaction && unreact) {
//     try {
//       await existingReaction.remove()
//       return await reply.status(200).send({
//         success: true,
//       })
//     } catch (error) {
//       return reply.status(404).send({
//         message: 'Reaction not found',
//       })
//     }
//   }

//   // already reacted
//   else if (existingReaction && !unreact) {
//     return reply.status(200).send({
//       success: true,
//     })
//   }

//   // nothing to unreact
//   else if (!existingReaction && unreact) {
//     return reply.status(200).send({
//       success: true,
//     })
//   }

//   // add reaction
//   else if (!existingReaction && !unreact) {
//     try {
//       const newReaction = new Reaction(reactionData)
//       await newReaction.save()
//       return await reply.status(200).send({
//         success: true,
//       })
//     } catch (error) {
//       return reply.status(404).send({
//         message: 'Reaction not found',
//       })
//     }
//   }
// }

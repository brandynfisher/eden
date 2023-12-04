import {
  ConceptsDeleteArguments,
  ConceptsGetArguments,
  ConceptsListArguments,
  ConceptsReactArguments,
  ConceptsUnreactArguments,
  ConceptsUpdateArguments,
  CreationsReactArguments,
  CreationsUnreactArguments,
  ReactionType,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

import { Concept, ConceptDocument } from '../models/Concept'
import { Creation } from '../models/Creation'
import { User } from '../models/Creator'
import { Reaction } from '../models/Reaction'
import ConceptRepository from '../repositories/ConceptRepository'
import CreatorRepository from '../repositories/CreatorRepository'

export const getReactions = async (
  userId: ObjectId,
  concepts: ConceptDocument[],
): Promise<{ [key: string]: Map<ReactionType, boolean> }> => {
  const reactions = await Reaction.aggregate([
    {
      $match: {
        user: userId,
        concept: {
          $in: concepts.map(concept => concept._id),
        },
      },
    },
    {
      $lookup: {
        from: 'concepts',
        localField: 'concept',
        foreignField: '_id',
        as: 'concept',
      },
    },
    {
      $unwind: '$concept',
    },
  ])

  // Convert reactions to a map for easy lookup
  const reactionsMap = reactions.reduce((map, reaction) => {
    const conceptId = reaction.concept._id.toString()
    if (!map[conceptId]) {
      map[conceptId] = {}
    }
    map[conceptId][reaction.reaction] = true
    return map
  }, {} as { [key: string]: ReactionType[] }) // explicitly set the type of the accumulator

  return reactionsMap
}

export const getBookmarks = async (
  userId: ObjectId,
  concepts: ConceptDocument[],
): Promise<{ [key: string]: boolean }> => {
  return {}
}

export const listConcepts = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, limit, page, sort, name } =
    request.query as ConceptsListArguments
  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId,
  })

  const conceptRepository = new ConceptRepository(Concept)
  const concepts = await conceptRepository.query(
    {
      user:
        userId && creators.docs
          ? creators.docs.map(creator => creator._id)
          : undefined,
      ...(name ? { $text: { $search: name } } : {}),
    },
    {
      limit,
      page,
      sort,
    },
  )

  const conceptsWithPublicName = await Promise.all(
    concepts.docs.map(async doc => {
      const user = await User.findById(doc.user._id)
      const publicName = `${user?.username}:${doc.name}`
      return {
        ...doc.toObject(),
        publicName,
      }
    }),
  )

  const response = {
    ...concepts,
    docs: conceptsWithPublicName,
  }

  return reply.status(200).send(response)
}

export const getConcept = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { conceptId } = request.params as ConceptsGetArguments

  const concept = (await Concept.findById(conceptId, {})
    .populate({
      path: 'user',
      select: 'userId username userImage',
    })
    .populate({
      path: 'task',
      select: 'status config',
      populate: { path: 'generator', select: 'generatorName output' },
    })) as ConceptDocument & {
    reactions?: Map<ReactionType, boolean>
    bookmarked?: boolean
  }

  if (!concept) {
    return reply.status(404).send({
      message: 'Concept not found',
    })
  }

  if (concept.isPrivate) {
    if (concept.user._id.toString() !== request.user?.userId.toString()) {
      console.error('User not authorized to view this')
      return reply.status(401).send({
        message: 'User not authorized to view this',
      })
    }
  }

  if (request.user?.userId) {
    // Get user's reactions and bookmarks
    const userId = request.user.userId
    const user = await User.findOne({ _id: userId })
    if (!user) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }
    const uid = new ObjectId(userId)
    const reactionsMap = await getReactions(uid, [concept])
    const bookmarksMap = await getBookmarks(uid, [concept])
    console.log(reactionsMap)
    console.log(bookmarksMap)

    // concept.reactions = reactionsMap[concept._id.toString()]
    // concept.bookmarked = bookmarksMap[concept._id.toString()]
    const conceptWithExtras = {
      ...concept.toObject(),
      reactions: reactionsMap[concept._id.toString()],
      bookmarked: bookmarksMap[concept._id.toString()],
    }

    return reply.status(200).send({
      concept: conceptWithExtras,
    })
  }

  return await reply.status(200).send({ concept })
}

export const conceptDelete = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { conceptId } = request.params as ConceptsDeleteArguments

  const concept = await Concept.findById(conceptId)

  if (!concept) {
    return reply.status(404).send({
      message: 'Concept not found',
    })
  }

  if (concept.user.toString() !== userId.toString()) {
    return reply.status(401).send({
      message: 'User not authorized to delete this',
    })
  }

  await concept.delete({ deleteBy: 'user' })

  return reply.status(200).send({
    success: true,
  })
}

export const conceptUpdate = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { conceptId } = request.params as ConceptsUpdateArguments
  const { isPrivate } = request.body as ConceptsUpdateArguments

  if (!userId || !conceptId || typeof isPrivate === 'undefined') {
    return reply.status(422).send({
      message: 'Missing parameters or malformed request body',
    })
  }

  const concept = await Concept.findOneAndUpdate(
    {
      _id: conceptId,
      user: userId,
    },
    { isPrivate },
    {
      new: true,
    },
  )

  if (!concept) {
    return reply.status(404).send({
      message: 'Concept not found',
    })
  }

  return reply.status(200).send({
    concept,
  })
}

export const conceptReact = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { conceptId, reaction } = request.body as ConceptsReactArguments

  // check if reaction in ReactionType enum
  if (!Object.values(ReactionType).includes(reaction)) {
    return reply.status(400).send({
      message: 'Invalid reaction',
    })
  }

  const concept = await Concept.findById(conceptId)

  if (!concept) {
    return reply.status(404).send({
      message: 'Concept not found',
    })
  }

  const reactionData = {
    concept: conceptId,
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

  await concept.updateOne({
    $inc: {
      praiseCount: reaction === ReactionType.Praise ? 1 : 0,
    },
  })

  return reply.status(200).send({
    success: true,
  })
}

export const conceptUnreact = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { conceptId, reaction } = request.body as ConceptsUnreactArguments

  // check if reaction in ReactionType enum
  if (!Object.values(ReactionType).includes(reaction)) {
    return reply.status(400).send({
      message: 'Invalid reaction',
    })
  }

  const concept = await Concept.findById(conceptId)

  if (!concept) {
    return reply.status(404).send({
      message: 'Concept not found',
    })
  }

  const reactionData = {
    concept: conceptId,
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

  await concept.updateOne({
    $inc: {
      praiseCount: reaction === ReactionType.Praise ? -1 : 0,
    },
  })

  return reply.status(200).send({
    success: true,
  })
}

import {
  ConceptsGetArguments,
  ConceptsListArguments,
  ReactionType,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

import { Concept, ConceptDocument } from '../models/Concept'
import { User } from '../models/Creator'
import ConceptRepository from '../repositories/ConceptRepository'
import CreatorRepository from '../repositories/CreatorRepository'

export const getReactions = async (
  userId: ObjectId,
  concepts: ConceptDocument[],
): Promise<{ [key: string]: Map<ReactionType, boolean> }> => {
  return {}
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
  const { userId, limit, page, sort } = request.query as ConceptsListArguments
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
    },
    {
      limit,
      page,
      sort,
    },
  )

  const conceptsWithPublicName = await Promise.all(
    concepts.docs.map(async doc => {
      const user = await User.findById(doc.user)
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

  const concept = (await Concept.findById(conceptId, {}).populate({
    path: 'user',
    select: 'userId username userImage',
  })) as ConceptDocument & {
    reactions?: Map<ReactionType, boolean>
    bookmarked?: boolean
  }

  if (!concept) {
    return reply.status(404).send({
      message: 'Concept not found',
    })
  }

  if (request.user?.userId) {
    console.log('user is logged in')
    // Get user's reactions and bookmarks
    const userId = request.user.userId
    const user = User.findOne({ userId })
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

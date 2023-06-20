import {
  CreationsListArguments,
  PaginatedResponse,
  ReactionType,
} from '@eden-labs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

import { Collection } from '../models/Collection'
import { Creation, CreationDocument } from '../models/Creation'
import { User } from '../models/Creator'
import { Reaction } from '../models/Reaction'
import CreationRepository from '../repositories/CreationRepository'
import CreatorRepository from '../repositories/CreatorRepository'

const getReactions = async (
  userId: ObjectId,
  creations: PaginatedResponse<CreationDocument>,
): Promise<{ [key: string]: Map<ReactionType, boolean> }> => {
  if (!creations.docs) {
    return {}
  }
  const reactions = await Reaction.aggregate([
    {
      $match: {
        user: userId,
        creation: {
          $in: creations.docs.map(creation => creation._id),
        },
      },
    },
    {
      $lookup: {
        from: 'creations',
        localField: 'creation',
        foreignField: '_id',
        as: 'creation',
      },
    },
    {
      $unwind: '$creation',
    },
  ])

  // Convert reactions to a map for easy lookup
  const reactionsMap = reactions.reduce((map, reaction) => {
    const creationId = reaction.creation._id.toString()
    if (!map[creationId]) {
      map[creationId] = {}
    }
    map[creationId][reaction.reaction] = true
    return map
  }, {} as { [key: string]: ReactionType[] }) // explicitly set the type of the accumulator

  return reactionsMap
}

const getBookmarks = async (
  userId: ObjectId,
  creations: PaginatedResponse<CreationDocument>,
): Promise<{ [key: string]: boolean }> => {
  if (!creations.docs) {
    return {}
  }

  const defaultCollection = await Collection.findOne({
    user: userId,
    isDefaultCollection: true,
  })

  if (!defaultCollection) {
    // The user doesn't have a default collection, so none of the creations are bookmarked
    // This should never happen though.
    return {}
  }

  const bookmarksMap = creations.docs
    .filter(creation => defaultCollection.creations.includes(creation._id))
    .reduce((map, creation) => {
      map[creation._id.toString()] = defaultCollection.creations.includes(
        creation._id,
      )
      return map
    }, {} as { [key: string]: boolean })

  return bookmarksMap
}

export const getFeed = async (request: FastifyRequest, reply: FastifyReply) => {
  const {
    userId: filterUserIds,
    limit,
    page,
    sort,
  } = request.query as CreationsListArguments
  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId: filterUserIds,
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

  await creationRepository.model.populate(creations.docs, {
    path: 'user',
    select: 'userId',
  })

  if (request.user?.userId) {
    // Get user's reactions and bookmarks
    const userId = request.user.userId
    const user = User.findOne({ userId })
    if (!user) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }
    const uid = new ObjectId(userId)
    const reactionsMap = await getReactions(uid, creations)
    const bookmarksMap = await getBookmarks(uid, creations)

    const creationDocs = creations.docs.map(creation => {
      return {
        ...creation.toObject(),
        reactions: reactionsMap[creation._id.toString()],
        bookmarked: bookmarksMap[creation._id.toString()],
      }
    })

    const feed = {
      ...creations,
      docs: creationDocs,
      reactions: reactionsMap,
      bookmarks: bookmarksMap,
    }

    return reply.status(200).send(feed)
  } else {
    // No user, so no reactions or bookmarks
    return reply.status(200).send(creations)
  }
}

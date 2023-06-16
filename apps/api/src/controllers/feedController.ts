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
): Promise<{ [key: string]: ReactionType[] }> => {
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
      map[creationId] = [] // initialize array if it doesn't exist
    }
    map[creationId].push(reaction.reaction) // add reaction type to array
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

  const bookmarksMap = creations.docs.reduce((map, creation) => {
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

  if (request.user.userId) {
    // Get user's reactions and bookmarks
    const user = request.user.userId
    const reactionsMap = await getReactions(user, creations)
    const bookmarksList = await getBookmarks(user, creations)
    console.log('reactionsMap', reactionsMap)
    console.log('bookmarksMap', bookmarksList)

    const feed = {
      ...creations,
      docs: creations.docs.map(creation => ({
        ...creation,
        reactions: reactionsMap[creation._id.toString()],
        bookmarked: bookmarksList[creation._id.toString()],
      })),
    }

    return reply.status(200).send(feed)
  } else {
    // No user, so no reactions or bookmarks
    return reply.status(200).send(creations)
  }
}

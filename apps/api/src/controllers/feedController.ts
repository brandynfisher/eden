import { FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

import { Collection } from '../models/Collection'
import { Creation } from '../models/Creation'
import { User } from '../models/Creator'
import CreationRepository from '../repositories/CreationRepository'
import CreatorRepository from '../repositories/CreatorRepository'
import { getBookmarks, getReactions } from './creationsController'

interface FeedGetArguments {
  userId?: string
  collectionId?: string
  limit?: number
  page?: number
  sort?: object
}

export const getFeed = async (request: FastifyRequest, reply: FastifyReply) => {
  const {
    userId: filterUserIds,
    collectionId,
    limit,
    page,
    sort,
  } = request.query as FeedGetArguments
  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId: filterUserIds,
  })

  const collection = await Collection.findById(collectionId)
  const collectionCreations = collection?.creations || undefined

  const creationRepository = new CreationRepository(Creation)

  const creations = await creationRepository.query(
    {
      _id: collectionCreations
        ? {
            $in: collectionCreations,
          }
        : undefined,
      user:
        filterUserIds && creators.docs
          ? creators.docs.map(creator => creator._id)
          : undefined,
    },
    {
      limit,
      page,
      sort: sort || { createdAt: -1 },
    },
  )

  await creationRepository.model.populate(creations.docs, {
    path: 'user',
    select: 'userId',
  })
  await creationRepository.model.populate(creations.docs, {
    path: 'task',
    select: 'config status generator',
    populate: { path: 'generator', select: 'generatorName description output' },
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
    const reactionsMap = await getReactions(uid, creations.docs)
    const bookmarksMap = await getBookmarks(uid, creations.docs)

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

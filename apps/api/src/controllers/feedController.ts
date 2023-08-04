import { PaginatedResponse, ReactionType } from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

import { Collection } from '../models/Collection'
import { Creation, CreationDocument } from '../models/Creation'
import { User } from '../models/Creator'
import { Follow } from '../models/Follow'
import CreationRepository from '../repositories/CreationRepository'
import CreatorRepository from '../repositories/CreatorRepository'
import { getBookmarks, getReactions } from './creationsController'

interface FeedGetArguments {
  userId?: string
  collectionId?: string
  limit?: number
  page?: number
  orderBy?: OrderByFieldName
  direction?: number
}

type OrderByFieldName =
  | 'createdAt'
  | 'praiseCount'
  | 'bookmarkCount'
  | 'following'
  | 'embedding.score'

const aggregateCreationsByFollowerId = (followerId: ObjectId) => {
  return Follow.aggregate([
    {
      $match: {
        follower: {
          $eq: new ObjectId(followerId),
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
        from: 'creations',
        localField: 'following',
        foreignField: 'user',
        as: 'creation',
      },
    },
    {
      $unwind: {
        path: '$creation',
      },
    },
    {
      $replaceRoot: {
        newRoot: '$creation',
      },
    },
  ])
}

export const getFeed = async (request: FastifyRequest, reply: FastifyReply) => {
  const {
    userId: filterUserIds,
    collectionId,
    limit,
    page,
    orderBy,
    direction,
  } = request.query as FeedGetArguments
  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId: filterUserIds,
  })

  const creationRepository = new CreationRepository(Creation)
  let creations: PaginatedResponse<CreationDocument>

  if (orderBy === 'following') {
    const followCreationRepository = new CreationRepository(Follow) //@todo: this reads rather wonky
    const followAggregate = aggregateCreationsByFollowerId(request.user.userId)

    creations = await followCreationRepository.aggregateQuery(followAggregate, {
      limit,
      page,
      sort: { createdAt: -1 },
    })
  } else {
    const collection = await Collection.findById(collectionId)
    const collectionCreations = collection?.creations || undefined

    const sort = []
    const sortFilter: { [key: string]: unknown } = {}
    if (orderBy && direction) {
      sort.push([orderBy, direction])
    }
    // add secondary sort condition "by newest" to all other sort fields to avoid random indexes for equal sort positions
    if (orderBy !== 'createdAt') {
      sort.push(['createdAt', -1])
    }
    // exclude zero count items when sorting by likes, bookmarks, etc
    if (
      orderBy === 'bookmarkCount' ||
      orderBy === 'praiseCount' ||
      orderBy === 'embedding.score'
    ) {
      sortFilter[orderBy] = { $gt: 0 }
    }

    creations = await creationRepository.query(
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
        ...sortFilter,
      },
      {
        limit,
        page,
        sort,
        select: '-embedding.embedding',
      },
    )
  }

  await creationRepository.model.populate(creations.docs, {
    path: 'user',
    select: 'userId username userImage',
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

    interface CreationDocumentExtension {
      reactions: Map<ReactionType, boolean>
      bookmarked: boolean
    }

    type FeedResponse = {
      docs: CreationDocumentExtension[]
      reactions: { [key: string]: Map<ReactionType, boolean> } | []
      bookmarks: { [key: string]: boolean } | []
    }

    const feed: FeedResponse = {
      ...creations,
      docs: [],
      reactions: [],
      bookmarks: [],
    }

    if (creations.docs) {
      const uid = new ObjectId(userId)
      const reactionsMap = await getReactions(uid, creations.docs)
      const bookmarksMap = await getBookmarks(uid, creations.docs)

      const extendedDocs = creations.docs.map(creation => {
        return {
          ...(typeof creation.toObject !== 'undefined'
            ? creation.toObject()
            : creation), //aggregate returns different format than query
          reactions: reactionsMap[creation._id.toString()],
          bookmarked: bookmarksMap[creation._id.toString()],
        }
      })
      feed.docs = extendedDocs
      feed.reactions = reactionsMap
      feed.bookmarks = bookmarksMap
    }

    return reply.status(200).send(feed)
  } else {
    // No user, so no reactions or bookmarks
    return reply.status(200).send(creations)
  }
}

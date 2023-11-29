import {
  FeedConceptsArguments,
  FeedCreationsResponse,
  PaginatedResponse,
  ReactionType,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import { PipelineStage } from 'mongoose'

import { Collection } from '../models/Collection'
import { Concept, ConceptDocument } from '../models/Concept'
import { Creation, CreationDocument } from '../models/Creation'
import { User } from '../models/Creator'
import { Follow } from '../models/Follow'
import { Reaction } from '../models/Reaction'
import ConceptRepository from '../repositories/ConceptRepository'
import CreationRepository from '../repositories/CreationRepository'
import CreatorRepository from '../repositories/CreatorRepository'
import {
  getBookmarks as getConceptBookmarks,
  getReactions as getConceptReactions,
} from './conceptsController'
import {
  getBookmarks as getCreationBookmarks,
  getReactions as getCreationReactions,
} from './creationsController'

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
        let: { followingId: '$following' },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$user', '$$followingId'] } },
                { isPrivate: { $ne: true } },
                { deleted: { $ne: true } },
              ],
            },
          },
          {
            $project: {
              'embedding.embedding': 0,
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 100 },
        ],
        as: 'creations',
      },
    },
    {
      $unwind: {
        path: '$creations',
      },
    },
    {
      $replaceRoot: {
        newRoot: '$creations',
      },
    },
  ])
}

const aggregateCreationsByUserLikes = (userId: ObjectId) => {
  return Reaction.aggregate([
    {
      $match: {
        user: {
          $eq: new ObjectId(userId),
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        _id: 0,
        user: 1,
        creation: 1,
      },
    },
    {
      $lookup: {
        from: 'creations',
        let: { reactionsCreationId: '$creation' },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$_id', '$$reactionsCreationId'] } },
                { isPrivate: { $ne: true } },
                { deleted: { $ne: true } },
              ],
            },
          },
          {
            $project: {
              'embedding.embedding': 0,
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: 'creations',
      },
    },
    {
      $unwind: {
        path: '$creations',
      },
    },
    {
      $replaceRoot: {
        newRoot: '$creations',
      },
    },
  ])
}

export const getCreationsFeed = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const {
    userId: filterUserIds,
    collectionId,
    name,
    limit,
    page,
    orderBy,
    direction,
  } = request.query as FeedCreationsResponse

  const creatorsRepository = new CreatorRepository(User)
  const creators = filterUserIds
    ? await creatorsRepository.query({
        userId: filterUserIds,
      })
    : { docs: [] }
  const ownUserId = request.user ? request.user.userId : undefined
  const creatorId =
    filterUserIds && creators.docs && creators.docs.length
      ? creators.docs.map(creator => creator._id)[0].toString()
      : undefined

  const isUserRequestingOwnProfileFeed =
    creatorId && ownUserId && ownUserId.toString() === creatorId

  const creationRepository = new CreationRepository(Creation)
  let creations: PaginatedResponse<CreationDocument>

  if (orderBy === 'following' && ownUserId) {
    const followCreationRepository = new CreationRepository(Follow) //@todo: this reads rather wonky
    const followAggregate = aggregateCreationsByFollowerId(
      new ObjectId(ownUserId),
    )

    creations = await followCreationRepository.aggregateQuery(followAggregate, {
      limit,
      page,
      sort: { createdAt: -1 },
    })
  } else if (orderBy === 'liked' && ownUserId) {
    const reactionCreationRepository = new CreationRepository(Reaction) //@todo: this reads rather wonky
    const userReactionAggregate = aggregateCreationsByUserLikes(
      new ObjectId(ownUserId),
    )

    creations = await reactionCreationRepository.aggregateQuery(
      userReactionAggregate,
      {
        limit,
        page,
        sort: { createdAt: -1 },
      },
    )
  } else {
    const collection = collectionId
      ? await Collection.findById(collectionId)
      : undefined
    const collectionCreations =
      collection && collection?.creations ? collection.creations : undefined

    const sort = []
    const sortFilter: { [key: string]: unknown } = {}

    if (orderBy === 'popularity') {
      sort.push(['praiseCount', direction])
      sort.push(['bookmarkCount', direction])
      sortFilter['$or'] = [
        { bookmarkCount: { $gt: 0 } },
        { praiseCount: { $gt: 0 } },
      ]
    } else {
      if (orderBy && direction) {
        sort.push([orderBy, direction])
      }

      // exclude zero count items when sorting by likes, bookmarks, etc
      if (
        orderBy === 'bookmarkCount' ||
        orderBy === 'praiseCount' ||
        orderBy === 'embedding.score'
      ) {
        sortFilter[orderBy] = { $gt: 0 }
      }
    }

    // add secondary sort condition "by newest" to all other sort fields to avoid random indexes for equal sort positions
    if (orderBy !== 'createdAt') {
      sort.push(['createdAt', -1])
    }

    // When filtering by aesthetic score, limit results with date cut off
    if (orderBy === 'embedding.score') {
      const hoursAgo = 20
      const dateCutoff = new Date(
        new Date().setHours(new Date().getHours() - hoursAgo),
      )
      sortFilter['createdAt'] = { $gte: dateCutoff }
    }

    if (
      !isUserRequestingOwnProfileFeed &&
      !(
        collection &&
        collection.user &&
        ownUserId &&
        collection.user.toString() === ownUserId.toString()
      )
    ) {
      sortFilter['isPrivate'] = { $ne: true }
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
        ...(name ? { $text: { $search: name } } : {}),
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

  if (ownUserId) {
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
      const uid = new ObjectId(ownUserId)
      const reactionsMap = await getCreationReactions(uid, creations.docs)
      const bookmarksMap = await getCreationBookmarks(uid, creations.docs)

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

const conceptsAggregate = (
  searchText: string,
  userId: string,
  filter?: {
    isPrivate?: { $ne?: boolean }
    deleted?: { $ne?: boolean }
  },
  options?: { limit?: number; page?: number },
) => {
  const pipelines: PipelineStage[] = [
    {
      $search: {
        compound: {
          should: [
            {
              autocomplete: {
                query: searchText,
                path: 'name',
              },
            },
            {
              autocomplete: {
                query: searchText,
                path: 'conceptName',
              },
            },
          ],
          minimumShouldMatch: 1,
        },
      },
    },
  ]

  if (userId) {
    pipelines.push({
      $match: {
        user: new ObjectId(userId),
      },
    })
  }

  if (filter?.isPrivate) {
    pipelines.push({
      $match: {
        isPrivate: filter.isPrivate,
      },
    })
  }

  if (filter?.deleted) {
    pipelines.push({
      $match: {
        deleted: filter.deleted,
      },
    })
  }

  // if (options && options.page && options.limit) {
  //   pipelines.push({
  //     $limit: options.limit,
  //   })
  //   pipelines.push({
  //     $skip: options.limit * (options.page - 1),
  //   })
  // }

  console.log(pipelines)
  return Concept.aggregate(pipelines)
}

export const getConceptsFeed = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const {
    userId: filterUserIds,
    name,
    limit,
    page,
    orderBy,
    direction,
  } = request.query as FeedConceptsArguments
  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId: filterUserIds,
  })

  const ownUserId = request.user ? request.user.userId : undefined
  const creatorId =
    filterUserIds && creators.docs && creators.docs.length
      ? creators.docs.map(creator => creator._id)[0].toString()
      : undefined
  const isUserRequestingOwnProfileFeed =
    creatorId && ownUserId && ownUserId.toString() === creatorId

  const conceptRepository = new ConceptRepository(Concept)

  const sort = []
  const sortFilter: { [key: string]: unknown } = {}
  if (orderBy && direction) {
    sort.push([orderBy, direction])
  }
  // add secondary sort condition "by newest" to all other sort fields to avoid random indexes for equal sort positions
  if (orderBy !== 'createdAt') {
    sort.push(['createdAt', -1])
  }

  if (!isUserRequestingOwnProfileFeed) {
    sortFilter['isPrivate'] = { $ne: true }
  }

  let concepts: PaginatedResponse<ConceptDocument>
  // use atlas search query
  if (name) {
    const aggregate = conceptsAggregate(name, creatorId, {
      ...sortFilter,
      deleted: { $ne: true },
    })
    console.log(JSON.stringify(aggregate))
    const sortObj = Object.fromEntries(sort)
    console.log(sortObj)
    concepts = await conceptRepository.aggregateQuery(aggregate, {
      limit,
      page,
      sort: sortObj,
    })
    console.log(concepts)
    // use flat query
  } else {
    concepts = await conceptRepository.query(
      {
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
      },
    )
  }

  await conceptRepository.model.populate(concepts.docs, {
    path: 'user',
    select: 'userId username userImage',
  })
  await conceptRepository.model.populate(concepts.docs, {
    path: 'task',
    select: 'status config generator',
    populate: { path: 'generator', select: 'generatorName output' },
  })

  if (ownUserId) {
    interface ConceptDocumentExtension {
      reactions: Map<ReactionType, boolean>
      bookmarked: boolean
    }

    type FeedResponse = {
      docs: ConceptDocumentExtension[]
      reactions: { [key: string]: Map<ReactionType, boolean> } | []
      bookmarks: { [key: string]: boolean } | []
    }

    const feed: FeedResponse = {
      ...concepts,
      docs: [],
      reactions: [],
      bookmarks: [],
    }

    if (concepts.docs) {
      const uid = new ObjectId(ownUserId)
      const reactionsMap = await getConceptReactions(uid, concepts.docs)
      const bookmarksMap = await getConceptBookmarks(uid, concepts.docs)

      const extendedDocs = concepts.docs.map(concept => {
        return {
          ...(typeof concept.toObject !== 'undefined'
            ? concept.toObject()
            : concept), //aggregate returns different format than query
          reactions: reactionsMap[concept._id.toString()],
          bookmarked: bookmarksMap[concept._id.toString()],
        }
      })
      feed.docs = extendedDocs
      feed.reactions = reactionsMap
      feed.bookmarks = bookmarksMap
    }

    return reply.status(200).send(feed)
  } else {
    // No user, so no reactions or bookmarks
    return reply.status(200).send(concepts)
  }
}

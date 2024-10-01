import { CollectionV2 } from '../../models/v2/CollectionV2'
import CollectionV2Repository from '../../repositories/CollectionV2Repository'
import { CollectionsV2ListArguments } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import { PipelineStage } from 'mongoose'

const collectionsAggregate = (
  userId: string,
  creationId: string,
  filter?: {
    public?: { $eq?: boolean }
    deleted?: { $eq?: boolean }
  },
) => {
  const pipelines: PipelineStage[] = [
    {
      $match: {
        $or: [
          { user: new ObjectId(userId) },
          { contributors: { $in: [userId] } },
        ],
      },
    },
    {
      $addFields: {
        creationCount: {
          $size: '$creations',
        },
        hasItem: {
          $in: [new ObjectId(creationId), '$creations'],
        },
      },
    },
    {
      $sort: {
        creationCount: -1,
      },
    },
  ]

  if (filter?.public) {
    pipelines.push({
      $match: {
        public: filter.public,
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

  return CollectionV2.aggregate(pipelines)
}

export const listCollections = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, limit, page, sort, creationId } =
    request.query as CollectionsV2ListArguments

  const currentUserId = request.user ? request.user.userId : undefined
  const isRequestingOwnCollections =
    currentUserId && currentUserId.toString() === userId

  const sortFilter: { [key: string]: unknown } = {}
  if (!isRequestingOwnCollections) {
    sortFilter['public'] = { $eq: true }
  }

  const queryOptions = {
    limit,
    page,
    sort: {
      ...sort,
      updatedAt: -1,
    },
  }

  const collectionsRepository = new CollectionV2Repository(CollectionV2)
  const collections =
    userId && creationId
      ? await collectionsRepository.aggregateQuery(
          collectionsAggregate(userId, creationId, {
            ...sortFilter,
            deleted: { $eq: false },
          }),
          queryOptions,
        )
      : await collectionsRepository.query(
          {
            $or: [
              {
                user: userId,
              },
              {
                contributors: {
                  $in: [userId],
                },
              },
            ],
            ...sortFilter,
          },
          queryOptions,
        )

  await collectionsRepository.model.populate(collections.docs, {
    path: 'user',
    select: 'userId username userImage',
  })

  await collectionsRepository.model.populate(collections.docs, {
    path: 'coverCreation',
    select: 'thumbnail',
  })

  return reply.status(200).send(collections)
}

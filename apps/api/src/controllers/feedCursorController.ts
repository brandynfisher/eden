import { Creation } from '../models/Creation'
import { FeedCreationsCursorArguments } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import { Expression, PipelineStage } from 'mongoose'

type SortOptions = Record<string, 1 | -1 | Expression.Meta>
type Filter = Record<string, string | number | boolean | ObjectId>
type Filters = Record<string, Filter>

interface QueryOptions {
  cursor?: string
  limit: number
  filters?: Filters
  sortOptions?: SortOptions
}

const getPaginatedData = async (options: QueryOptions): Promise<any> => {
  const {
    cursor,
    limit,
    filters = {},
    sortOptions = { createdAt: -1, _id: -1 },
  } = options

  // If a cursor is provided, convert it to an ObjectId, otherwise match all
  const lastSeenIdMatch = cursor ? { _id: { $lt: new ObjectId(cursor) } } : {}

  const match = cursor
    ? {
        $and: [
          // only add _id match-filter if cursor is defined
          ...(cursor ? [{ ...lastSeenIdMatch }] : []),
          { ...filters },
        ],
      }
    : {
        ...filters,
      }

  const userLookup: PipelineStage[] = [
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          {
            $project: {
              _id: 1,
              userId: 1,
              username: 1,
              userImage: 1,
            },
          },
        ],
      },
    },
    { $unwind: '$user' },
  ]

  const taskLookup: PipelineStage[] = [
    {
      $lookup: {
        from: 'tasks',
        localField: 'task',
        foreignField: '_id',
        as: 'task',
        pipeline: [
          {
            $project: {
              _id: 1,
              generator: 1,
              config: 1,
              status: 1,
            },
          },
          {
            $lookup: {
              from: 'generators',
              localField: 'generator',
              foreignField: '_id',
              as: 'generator',
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    generatorName: 1,
                    description: 1,
                    output: 1,
                  },
                },
              ],
            },
          },
          { $unwind: '$generator' },
        ],
      },
    },
    { $unwind: '$task' },
  ]

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $sort: sortOptions },
    { $limit: limit },
    ...taskLookup,
    ...userLookup,
  ]

  console.log(JSON.stringify(pipeline, null, 2))

  const results = await Creation.aggregate(pipeline)
  // console.log(JSON.stringify(results, null, 2))

  return results
}

export const getCreationsFeedCursor = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { limit, cursor, sort, filter } =
    request.query as FeedCreationsCursorArguments

  console.log({ query: request.query })

  // handle aggregations for special queries
  // sort=liked:-1

  const sortOptions = sort
    ? (Object.fromEntries(
        (Array.isArray(sort) ? sort : [sort]).map(sortOption => {
          const [field, direction] = sortOption.split(':')
          return [field, Number(direction)]
        }),
      ) as SortOptions)
    : undefined

  const filterOptions = filter
    ? (Object.fromEntries(
        (Array.isArray(filter) ? filter : [filter]).map(filterOption => {
          const [field, value] = filterOption.split(':')

          if (field === 'user') {
            return [field, new ObjectId(value)]
          }

          return [field, value]
        }),
      ) as Filters)
    : undefined

  console.log({ filterOptions, sortOptions })

  const results = await getPaginatedData({
    cursor,
    limit: limit ?? 100,
    sortOptions,
    filters: {
      ...filterOptions,
      deleted: { $eq: false },
      isPrivate: { $eq: false },
    },
  })

  try {
    const nextCursor =
      results && results.length && results[results.length - 1]._id
    const response = {
      nextCursor,
      docs: results,
    }
    reply.send(response)
  } catch (error) {
    reply.code(500).send({ error: 'Internal Server Error' })
  }
}

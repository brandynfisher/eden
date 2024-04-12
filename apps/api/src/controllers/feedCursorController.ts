import { Collection } from '../models/Collection'
import { Creation } from '../models/Creation'
import { Reaction } from '../models/Reaction'
import { FeedCreationsCursorArguments } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import { Expression, PipelineStage } from 'mongoose'

type SortOptions = Record<string, 1 | -1 | Expression.Meta>
type Filter =
  | Array<{ $lte?: Date; $gte?: Date }>
  | string
  | string[]
  | number
  | boolean
  | ObjectId
  | ObjectId[]
  | Date
  | {
      $in?: string | string[] | ObjectId[]
      $eq?:
        | boolean
        | {
            $lte?: Date | undefined
            $gte?: Date | undefined
          }
        | string
        | ObjectId
      $exists?: boolean | string | ObjectId
    }
type Filters = Record<string, Filter>

interface QueryOptions {
  cursor?: string
  limit?: number
  filters?: Filters
  preAggregate?: []
  sortOptions?: SortOptions
}

type CustomFilters = {
  'mediaAttributes.type'?: {
    $in:
      | string[]
      | (
          | { $lte?: Date | undefined; $gte?: Date | undefined }
          | { $exists: true }
          | string
          | ObjectId
        )[]
  }
  generator?:
    | string
    | ObjectId
    | ObjectId[]
    | string[]
    | {
        $in:
          | string[]
          | (
              | { $lte?: Date | undefined; $gte?: Date | undefined }
              | { $exists: true }
              | string
              | ObjectId
            )[]
      }
  isPrivate?: boolean
  maxDate?: Date | undefined
  minDate?: Date | undefined
  createdAt?: Filter
}

type GenericFilters = {
  _id?: ObjectId
  user?: ObjectId
  creation?: ObjectId
  character?: ObjectId
  concept?: ObjectId
  collection?: ObjectId
}

const createCursorMatch = (cursor: string) => {
  // If a cursor is provided, convert it to an ObjectId, otherwise match all
  const lastSeenIdMatch = cursor ? { _id: { $lt: new ObjectId(cursor) } } : {}
  return [lastSeenIdMatch] || []
}

const maybeAddCursorFilterStage = (
  cursor?: string,
  filters?: Filters,
): PipelineStage | undefined => {
  const match = cursor
    ? {
        $and: [
          // only add _id match-filter if cursor is defined
          ...createCursorMatch(cursor),
          { ...filters },
        ],
      }
    : {
        ...filters,
      }

  return Object.keys(match).length ? { $match: match } : undefined
}
const creationsLookup = (
  localField: string,
  lookupPipeline: PipelineStage[],
) => {
  return [
    {
      $lookup: {
        from: 'creations',
        localField: localField,
        foreignField: '_id',
        pipeline: lookupPipeline,
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
  ]
}
const collectionsPreAggregatePipeline = (
  matchStage: PipelineStage[],
  lookupPipeline: PipelineStage[],
) => {
  return [
    ...matchStage,
    {
      $project: {
        creations: 1,
      },
    },
    ...creationsLookup('creations', lookupPipeline),
  ]
}

const reactionsPreAggregatePipeline = (
  matchStage: PipelineStage[],
  lookupPipeline: PipelineStage[],
) => {
  return [
    ...matchStage,
    {
      $project: {
        _id: 0,
        user: 1,
        creation: 1,
      },
    },
    ...creationsLookup('creation', lookupPipeline),
  ]
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

const createPipeline = async (
  options: QueryOptions = {},
): Promise<PipelineStage[]> => {
  const { cursor, limit, filters = {}, sortOptions } = options

  const pipeline: PipelineStage[] = []

  if (cursor || Object.keys(filters).length) {
    const cursorFilterStage = maybeAddCursorFilterStage(cursor, filters)
    if (typeof cursorFilterStage !== 'undefined') {
      pipeline.push(cursorFilterStage)
    }
  }

  if (sortOptions) {
    pipeline.push({ $sort: sortOptions })
  }

  if (limit) {
    pipeline.push({ $limit: limit })
  }

  console.log(JSON.stringify(pipeline, null, 2))

  return pipeline
}

type FilterItem = {
  name: string
  value: string | number | boolean
}

export const getCreationsFeedCursor = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { limit, cursor, sort, filter } =
    request.query as FeedCreationsCursorArguments

  console.log({ filter })
  const filterMap: FilterItem[] = []
  if (filter && filter.length) {
    (Array.isArray(filter) ? filter : [filter]).map(filterGroup => {
      const [filterItem, filterValue] = filterGroup.split(';')
      filterMap.push({ name: filterItem, value: filterValue })
    })
  }
  //@todo: reduce to end up with groupname: [ itemvalues... ]

  const authUserId = request.user ? request.user.userId : undefined
  const filterUserIds = filterMap
    ? filterMap
        ?.filter(
          item => item.name === 'user' && item.value === authUserId?.toString(),
        )
        .map(item => item.value)
    : undefined
  const isUserRequestingOwnProfileFeed =
    filterUserIds && filterUserIds.length === 1 && authUserId
      ? authUserId.toString() === filterUserIds[0].toString()
      : false
  console.log({ filterMap })
  console.log({ authUserId, filterUserIds, isUserRequestingOwnProfileFeed })

  // @todo: handle aggregations for special queries
  // sort=liked:-1
  let useReactionsPreAggregate = false
  let useEmbeddingsPreAggregate = false
  let useCollectionsPreAggregate = false
  const preAggregateFilterOptions: GenericFilters = {}
  const customFilterOptions: {
    generator?: string[] | ObjectId[] | string | ObjectId
    outputType?: string[]
    createdAt?: { $lte?: Date; $gte?: Date }
    'embedding.score'?: { $exists: true }
  } = {}

  const sortOptions = sort
    ? (Object.fromEntries(
        (Array.isArray(sort) ? sort : [sort]).map(sortOption => {
          const [field, direction] = sortOption.split(';')

          if (field === 'praiseCount') {
            return ['praiseCount', Number(direction)]
          }

          if (field === 'liked') {
            useReactionsPreAggregate = true
            return []
          }

          if (field === 'embedding.score') {
            useEmbeddingsPreAggregate = true //@todo: handle aggregation below
            return ['embedding.score_adjusted', Number(direction)]
          }

          return [field, Number(direction)]
        }),
      ) as SortOptions)
    : undefined

  const filterOptions = filter
    ? (Object.fromEntries(
        (Array.isArray(filter) ? filter : [filter]).map(filterOption => {
          const [field, value] = filterOption.split(';')

          if (
            field === 'user' ||
            field === 'character' ||
            field === 'concept' ||
            field === 'collection'
          ) {
            console.log(field, value)
            if (field === 'collection') {
              useCollectionsPreAggregate = true
              preAggregateFilterOptions['_id'] = new ObjectId(value)
              return []
            }

            return [field, new ObjectId(value)]
          }

          if (field === 'likedBy') {
            useReactionsPreAggregate = true
            preAggregateFilterOptions['user'] = new ObjectId(value)
            return []
          }

          if (field === 'generator') {
            if (!customFilterOptions['generator']) {
              customFilterOptions['generator'] = [value]
            } else {
              // @ts-ignore
              customFilterOptions['generator'].push(value)
            }
            return []
          }

          if (field === 'outputType') {
            if (!customFilterOptions['outputType']) {
              customFilterOptions['outputType'] = [value]
            } else {
              customFilterOptions['outputType'].push(value)
            }
            return []
          }

          if (field === 'isPrivate' && isUserRequestingOwnProfileFeed) {
            return [field, value === 'true']
          }

          if (field === 'minDate' && value) {
            if (!customFilterOptions['createdAt']) {
              customFilterOptions['createdAt'] = {}
            }
            //@ts-ignore
            customFilterOptions['createdAt']['$gte'] = new Date(value)
            return []
          }

          if (field === 'maxDate') {
            if (!customFilterOptions['createdAt']) {
              customFilterOptions['createdAt'] = {}
            }
            customFilterOptions['createdAt']['$lte'] = new Date(value)
            return []
          }

          return [field, value]
        }),
      ) as Filters)
    : undefined

  // console.log({ filterOptions, sortOptions })

  const lateLookupStages = [...taskLookup, ...userLookup]

  let results = []
  const customFilterMap: CustomFilters = {}

  for (const [fieldName, fieldValues] of Object.entries(customFilterOptions)) {
    if (fieldValues === undefined) continue

    if (fieldName === 'outputType') {
      customFilterMap['mediaAttributes.type'] = {
        $in: Array.isArray(fieldValues) ? fieldValues : [fieldValues],
      }
    } else if (fieldName === 'generator') {
      // @ts-ignore
      customFilterMap['generator'] = {
        $in: Array.isArray(fieldValues)
          ? fieldValues.map(val => new ObjectId(val))
          : [new ObjectId(fieldValues)],
      }
    } else if (fieldName === 'isPrivate' && isUserRequestingOwnProfileFeed) {
      customFilterMap['isPrivate'] = String(fieldValues) === 'true'
    } else if (fieldName === 'createdAt') {
      //@ts-ignore
      customFilterMap['createdAt'] = fieldValues
    }

    // console.log({fieldName, fieldValues})
  }

  const collectionFilter = filterMap?.filter(
    item => item.name === 'collection',
  )[0]
  const collection = collectionFilter
    ? await Collection.findById(collectionFilter.value)
    : undefined
  const collectionCreations =
    collection && collection?.creations ? collection.creations : undefined
  console.log({ collectionCreations })

  const defaultPrivacyFilter =
    !isUserRequestingOwnProfileFeed &&
    !(
      collection &&
      collection.user &&
      authUserId &&
      collection.user.toString() === authUserId.toString()
    )
      ? { isPrivate: { $eq: false } }
      : undefined

  const defaultDeletedFilter = { deleted: { $eq: false } }
  const filters = {
    ...defaultPrivacyFilter,
    ...defaultDeletedFilter,
    ...customFilterMap,
    ...filterOptions,
  }

  if (useCollectionsPreAggregate) {
    const lookupPipeline = await createPipeline({
      // @ts-ignore
      filters,
      sortOptions: { updatedAt: -1, ...sortOptions },
      $limit: limit ?? 100,
      // cursor
    })
    const pipeline = [
      ...collectionsPreAggregatePipeline(
        [
          { $match: preAggregateFilterOptions },
          // { $sort: { createdAt: -1 } }, //@todo: only add this if we're actually sorting by reaction date and not reaction count etc
        ],
        lookupPipeline,
      ),
      // maybeAddCursorFilterStage(cursor),
      { $limit: limit ?? 100 },
      ...lateLookupStages,
    ]
    console.log(JSON.stringify(pipeline, null, 2))
    // @ts-ignore
    results = await Collection.aggregate(pipeline)
  } else if (useReactionsPreAggregate) {
    const lookupPipeline = await createPipeline({
      // @ts-ignore
      filters,
      // sortOptions: { ...sortOptions },
      // cursor
    })
    const pipeline = [
      ...reactionsPreAggregatePipeline(
        [
          { $match: preAggregateFilterOptions },
          { $sort: { createdAt: -1 } }, //@todo: only add this if we're actually sorting by reaction date and not reaction count etc
        ],
        lookupPipeline,
      ),
      maybeAddCursorFilterStage(cursor),
      { $limit: limit ?? 100 },
      ...lateLookupStages,
    ]
    console.log(JSON.stringify(pipeline, null, 2))
    // @ts-ignore
    results = await Reaction.aggregate(pipeline)
  } else {
    let embeddingsTransform: PipelineStage[] = []
    const currentDate = new Date()

    if (useEmbeddingsPreAggregate) {
      const decayPerHour = 0.0015

      embeddingsTransform = [
        {
          $set: {
            'embedding.score_age_hours': {
              $dateDiff: {
                startDate: { $toDate: '$createdAt' },
                endDate: currentDate,
                unit: 'hour',
              },
            },
          },
        },
        {
          $set: {
            'embedding.score_age_decay': {
              $multiply: ['$embedding.score_age_hours', decayPerHour],
            },
          },
        },
        {
          $set: {
            'embedding.score_adjusted': {
              $subtract: ['$embedding.score', '$embedding.score_age_decay'],
            },
          },
        },
      ]
    }

    const pipeline = await createPipeline({
      limit: limit ?? 100,
      sortOptions: { ...sortOptions, _id: -1 },
    })

    const hoursAgo = 360
    currentDate.setMinutes(0, 0, 0)
    const minDateDefault = new Date(currentDate)
    minDateDefault.setHours(currentDate.getHours() - hoursAgo)
    minDateDefault.setMinutes(0, 0, 0)
    const maxDate = filterMap
      ? filterMap.filter(item => item.name === 'maxDate')[0]
      : undefined
    const minDate = filterMap
      ? filterMap.filter(item => item.name === 'minDate')[0]
      : undefined
    const embeddingsFilter = {
      ...filters,
      createdAt: {
        $gte: minDate ? minDate.value : minDateDefault,
        $lte: maxDate ? maxDate?.value : undefined,
      },
      'embedding.score': {
        $exists: true,
      },
    }
    const creationFeedPipeline = [
      // @ts-ignore
      maybeAddCursorFilterStage(
        cursor,
        useEmbeddingsPreAggregate ? embeddingsFilter : filters,
      ),
      ...embeddingsTransform,
      ...pipeline,
      ...lateLookupStages,
    ].filter(Boolean)

    console.log(JSON.stringify(creationFeedPipeline, null, 2))

    // @ts-ignore
    results = await Creation.aggregate(creationFeedPipeline)
  }

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

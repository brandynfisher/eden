import { Collection } from '../models/Collection'
import { Concept } from '../models/Concept'
import { Creation } from '../models/Creation'
import { User } from '../models/Creator'
import { Follow } from '../models/Follow'
import { Reaction } from '../models/Reaction'
import {
  getBookmarks as getCreationBookmarks,
  getReactions as getCreationReactions,
} from './creationsController'
import {
  FeedConceptsCursorArguments,
  FeedCreationsCursorArguments,
  FeedCreatorsCursorArguments,
  ReactionType,
} from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import { Expression, PipelineStage } from 'mongoose'

interface CreationDocumentExtension {
  reactions: Map<ReactionType, boolean>
  bookmarked: boolean
}

type FeedResponse = {
  docs: CreationDocumentExtension[]
  reactions: { [key: string]: Map<ReactionType, boolean> } | []
  bookmarks: { [key: string]: boolean } | []
  nextValue?: number
  nextCursor?: string
}

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
  sortCursor?:
    | { praiseCount: { $lte?: number } }
    | { creationCount: { $lte?: number } }
    | { followerCount: { $lte?: number } }
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
          | { $gt?: number }
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
  praiseCount?: { $gt?: number }
  creationCount?: { $gt?: number }
  followerCount?: { $gt?: number }
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
  foreignField: string,
  lookupPipeline: PipelineStage[],
) => {
  return [
    {
      $lookup: {
        from: 'creations',
        localField: localField,
        foreignField: foreignField,
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

const followingPreAggregatePipeline = (
  matchStage: PipelineStage[],
  lookupPipeline: PipelineStage[],
) => {
  return [
    ...matchStage,
    {
      $project: {
        _id: 0,
        following: 1,
      },
    },
    ...creationsLookup('following', 'user', lookupPipeline),
    {
      $sort: {
        _id: -1,
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
    ...creationsLookup('creations', '_id', lookupPipeline),
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
    ...creationsLookup('creation', '_id', lookupPipeline),
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
  const { cursor, sortCursor, limit, filters = {}, sortOptions } = options
  const pipeline: PipelineStage[] = []

  if (cursor) {
    const idCursor =
      sortCursor !== undefined
        ? { _id: { $gt: new ObjectId(cursor) } }
        : { _id: { $lt: new ObjectId(cursor) } }
    pipeline.push(
      sortCursor !== undefined
        ? { $match: { $and: [sortCursor, idCursor, filters] } }
        : { $match: { ...idCursor, ...filters } },
    )
  } else if (filters) {
    pipeline.push({ $match: filters })
  }

  if (sortOptions) {
    pipeline.push({ $sort: sortOptions })
  }

  if (limit) {
    pipeline.push({ $limit: limit })
  }

  // console.log(JSON.stringify(pipeline, null, 2))

  return pipeline
}

type FilterItem = {
  name: string
  value: string | number | boolean
}

const handleArguments = async ({
  authUserId,
  sort,
  nextValue,
  filter,
  cursor,
  usesPrivacy = true,
}: {
  authUserId?: ObjectId
  sort?: string | string[]
  filter?: string | string[]
  cursor?: string
  nextValue?: number
  usesPrivacy?: boolean
}) => {
  // console.log({ filter,cursor,nextValue })
  const filterMap: FilterItem[] = []
  if (filter && filter.length) {
    (Array.isArray(filter) ? filter : [filter]).map(filterGroup => {
      const [filterItem, filterValue] = filterGroup.split(';')
      filterMap.push({ name: filterItem, value: filterValue })
    })
  }
  //@todo: reduce to end up with groupname: [ itemvalues... ]

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
  // console.log({ filterMap })
  // console.log({ authUserId, filterUserIds, isUserRequestingOwnProfileFeed })

  let useReactionsPreAggregate = false
  let useEmbeddingsPreAggregate = false
  let useCollectionsPreAggregate = false
  let useFollowingPreAggregate = false
  const preAggregateFilterOptions: GenericFilters = {}
  const customFilterOptions: {
    generator?: string[] | ObjectId[] | string | ObjectId
    outputType?: string[]
    createdAt?: { $lte?: Date; $gte?: Date }
    'embedding.score'?: { $exists: true }
    praiseCount?: { $gt: 0 }
    creationCount?: { $gt: 0 }
    followerCount?: { $gt: 0 }
  } = {}

  const sortOptions = sort
    ? (Object.fromEntries(
        (Array.isArray(sort) ? sort : [sort]).map(sortOption => {
          const [field, direction] = sortOption.split(';')

          if (field === 'praiseCount') {
            return ['praiseCount', Number(direction)]
          }

          if (field === 'creationCount') {
            customFilterOptions['creationCount'] = { $gt: 0 }
            return ['creationCount', Number(direction)]
          }

          if (field === 'followerCount') {
            customFilterOptions['followerCount'] = { $gt: 0 }
            return ['followerCount', Number(direction)]
          }

          if (field === 'liked') {
            useReactionsPreAggregate = true
            return []
          }

          if (field === 'following') {
            useFollowingPreAggregate = true
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
            // console.log(field, value)
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

          if (field === 'praiseCount') {
            customFilterOptions['praiseCount'] = { $gt: 0 }
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
          : // @ts-ignore
            [new ObjectId(fieldValues)],
      }
    } else if (fieldName === 'isPrivate' && isUserRequestingOwnProfileFeed) {
      customFilterMap['isPrivate'] = String(fieldValues) === 'true'
    } else if (fieldName === 'praiseCount') {
      customFilterMap['praiseCount'] = { $gt: 0 }
    } else if (fieldName === 'creationCount') {
      customFilterMap['creationCount'] = { $gt: 0 }
    } else if (fieldName === 'followerCount') {
      customFilterMap['followerCount'] = { $gt: 0 }
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

  const defaultPrivacyFilter =
    usesPrivacy &&
    !isUserRequestingOwnProfileFeed &&
    !(
      collection &&
      collection.user &&
      authUserId &&
      collection.user.toString() === authUserId.toString()
    )
      ? { isPrivate: { $eq: false } }
      : undefined

  const defaultDeletedFilter = usesPrivacy
    ? { deleted: { $eq: false } }
    : undefined
  const filters = {
    ...defaultPrivacyFilter,
    ...defaultDeletedFilter,
    ...customFilterMap,
    ...filterOptions,
  }

  return {
    filters,
    sortOptions,
    customFilterOptions,
    filterMap,
    preAggregateFilterOptions,
    useReactionsPreAggregate,
    useEmbeddingsPreAggregate,
    useCollectionsPreAggregate,
    useFollowingPreAggregate,
  }
}

export const getCreationsFeedCursor = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { limit, cursor, nextValue, sort, filter } =
    request.query as FeedCreationsCursorArguments
  const authUserId = request.user ? request.user.userId : undefined

  const {
    filters,
    sortOptions,
    customFilterOptions,
    filterMap,
    preAggregateFilterOptions,
    useReactionsPreAggregate,
    useEmbeddingsPreAggregate,
    useCollectionsPreAggregate,
    useFollowingPreAggregate,
  } = await handleArguments({ authUserId, cursor, nextValue, sort, filter })

  let results = []
  const lateLookupStages = [...taskLookup, ...userLookup]

  if (useCollectionsPreAggregate) {
    const lookupPipeline = await createPipeline({
      // @ts-ignore
      filters,
      sortOptions: { updatedAt: -1, ...sortOptions },
      limit: limit ?? 100,
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
    ].filter(Boolean)
    // console.log(JSON.stringify(pipeline, null, 2))
    // @ts-ignore
    results = await Collection.aggregate(pipeline)
  } else if (useFollowingPreAggregate) {
    const lookupPipeline = await createPipeline({
      // @ts-ignore
      filters,
      sortOptions: { createdAt: -1 },
      // cursor
    })
    const pipeline = [
      ...followingPreAggregatePipeline(
        [
          {
            $match: {
              follower: {
                $eq: authUserId,
              },
              createdAt: {
                $lte: customFilterOptions?.createdAt?.$lte,
              },
            },
          },
        ],
        lookupPipeline,
      ),
      maybeAddCursorFilterStage(cursor),
      { $limit: limit ?? 100 },
      ...lateLookupStages,
    ].filter(Boolean)
    // console.log(JSON.stringify(pipeline, null, 2))
    // @ts-ignore
    results = await Follow.aggregate(pipeline)
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
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: limit ?? 100 },
      ...lateLookupStages,
    ].filter(Boolean)
    // console.log(JSON.stringify(pipeline, null, 2))
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
      sortCursor:
        customFilterOptions.praiseCount && nextValue !== undefined
          ? { praiseCount: { $lte: nextValue } }
          : undefined,
      cursor,
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
      { $match: useEmbeddingsPreAggregate ? embeddingsFilter : filters },
      ...embeddingsTransform,
      ...pipeline,
      ...lateLookupStages,
    ].filter(Boolean)

    // console.log(JSON.stringify(creationFeedPipeline, null, 2))

    // @ts-ignore
    results = await Creation.aggregate(creationFeedPipeline)
  }

  const feed: FeedResponse = {
    ...results,
    docs: [],
    reactions: [],
    bookmarks: [],
  }

  // gather auth users reactions/bookmarks
  if (authUserId && results && results.length) {
    const reactionsMap = await getCreationReactions(authUserId, results)
    const bookmarksMap = await getCreationBookmarks(authUserId, results)

    feed.docs = results.map(doc => {
      return {
        ...(typeof doc.toObject !== 'undefined' ? doc.toObject() : doc), //aggregate returns different format than query
        reactions: reactionsMap[doc._id.toString()],
        bookmarked: bookmarksMap[doc._id.toString()],
      }
    })
    feed.reactions = reactionsMap
    feed.bookmarks = bookmarksMap
  }

  try {
    feed.nextCursor =
      results && results.length && results[results.length - 1]._id

    if (customFilterOptions.praiseCount) {
      feed.nextValue =
        results && results.length && results[results.length - 1].praiseCount
    }

    reply.send(feed)
  } catch (error) {
    reply.code(500).send({ error: 'Internal Server Error' })
  }
}

export const getConceptsFeedCursor = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { limit, cursor, nextValue, sort, filter } =
    request.query as FeedConceptsCursorArguments
  const authUserId = request.user ? request.user.userId : undefined

  const { filters, sortOptions, customFilterOptions } = await handleArguments({
    authUserId,
    cursor,
    nextValue,
    sort,
    filter,
  })

  let results = []

  const pipeline = await createPipeline({
    limit: limit ?? 100,
    sortOptions: { ...sortOptions, _id: -1 },
    cursor,
    sortCursor: nextValue ? { creationCount: { $lte: nextValue } } : undefined,
    //@ts-ignore
    filters,
  })
  const lateLookupStages = [...userLookup]

  const conceptFeedPipeline = [
    // { $match: filters },
    ...pipeline,
    ...lateLookupStages,
  ].filter(Boolean)

  // console.log(JSON.stringify(conceptFeedPipeline, null, 2))

  results = await Concept.aggregate(conceptFeedPipeline)

  try {
    const nextCursor =
      results && results.length && results[results.length - 1]._id

    const response: { nextValue?: number; nextCursor: string; docs?: any[] } = {
      nextCursor,
      docs: results,
    }

    if (customFilterOptions.creationCount) {
      response.nextValue =
        results && results.length && results[results.length - 1].creationCount
    }
    reply.send(response)
  } catch (error) {
    reply.code(500).send({ error: 'Internal Server Error' })
  }
}

export const getCreatorsFeedCursor = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  // console.log({ routeUrl: request.routeOptions.url })
  const { limit, cursor, nextValue, sort, filter } =
    request.query as FeedCreatorsCursorArguments
  const authUserId = request.user ? request.user.userId : undefined

  const { filters, sortOptions, customFilterOptions } = await handleArguments({
    authUserId,
    cursor,
    nextValue,
    sort,
    filter,
    usesPrivacy: false,
  })

  let results = []

  const pipeline = await createPipeline({
    limit: limit ?? 100,
    sortOptions: { ...sortOptions, _id: -1 },
    cursor,
    // sortCursor: nextValue ? { creationCount: { $lte: nextValue } } : undefined,
    sortCursor: nextValue
      ? customFilterOptions.followerCount
        ? { followerCount: { $lte: nextValue } }
        : { creationCount: { $lte: nextValue } }
      : undefined,
    //@ts-ignore
    filters,
  })
  // const lateLookupStages = [...userLookup]

  const feedPipeline = [
    // { $match: filters },
    ...pipeline,
    // ...lateLookupStages,
  ].filter(Boolean)

  // console.log(JSON.stringify(feedPipeline, null, 2))

  results = await User.aggregate(feedPipeline)

  try {
    const nextCursor =
      results && results.length && results[results.length - 1]._id

    const response: { nextValue?: number; nextCursor: string; docs?: any[] } = {
      nextCursor,
      docs: results,
    }

    if (customFilterOptions.creationCount) {
      response.nextValue =
        results && results.length && results[results.length - 1].creationCount
    }
    if (customFilterOptions.followerCount) {
      response.nextValue =
        results && results.length && results[results.length - 1].followerCount
    }
    reply.send(response)
  } catch (error) {
    reply.code(500).send({ error: 'Internal Server Error' })
  }
}

import { getSimilarCreationIds } from '../../lib/similar'
import { Collection } from '../../models/Collection'
import { Embedding, EmbeddingDocument } from '../../models/Embedding'
import { CreationV2 } from '../../models/v2/CreationV2'
import { ModelV2 } from '../../models/v2/ModelV2'
import { CursorPaginatedFeedQuery, ReactionType } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import { Expression, PipelineStage } from 'mongoose'

const emptyPaginatedResponse = {
  docs: [],
}

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
      $or?: []
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

type FilterItem = {
  name: string
  value: string | number | boolean
}

type CustomFilters = {
  'mediaAttributes.type'?: {
    $in: (
      | string
      | ObjectId
      | { $lte?: Date | undefined; $gte?: Date | undefined }
      | { $exists: true }
      | { $gt: 0 }
      | { $in?: string[] | ObjectId[] | undefined }
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
  public?: boolean
  maxDate?: Date | undefined
  minDate?: Date | undefined
  praiseCount?: { $gt?: number }
  creationCount?: { $gt?: number }
  followerCount?: { $gt?: number }
  createdAt?: Filter
  _id?: string | ObjectId | { $in?: string[] }
  $or?: { user: { $ne?: ObjectId; $eq?: ObjectId }; public: boolean }[]
}

type GenericFilters = {
  _id?: ObjectId
  user?: ObjectId
  creation?: ObjectId
  character?: ObjectId
  concept?: ObjectId
  collection?: ObjectId
}

const handleArguments = async ({
  server,
  reply,
  authUserId,
  query,
  usesPrivacy = true,
}: {
  server: FastifyInstance
  reply: FastifyReply
  authUserId?: ObjectId
  query?: CursorPaginatedFeedQuery
  usesPrivacy?: boolean
}) => {
  const { filter, sort } = query || {}

  // console.log({ filter, sort, authUserId })
  const filterMap: FilterItem[] = []
  if (filter) {
    (Array.isArray(filter) ? filter : [filter]).map(filterGroup => {
      const [filterItem, filterValue] = filterGroup.split(';')
      filterMap.push({ name: filterItem, value: filterValue })
    })
  }

  const usesLikedFilter = filterMap
    ? filterMap.filter(item => item.name === 'likedBy').length > 0
    : undefined
  // console.log({usesLikedFilter})

  // if using "likedBy me" filter: remove default privacy filter as we'll need to handle that conditionally based on creation.user
  if (usesLikedFilter) {
    const indexPrivacyParam = filterMap.findIndex(
      item => item.name === 'public',
    )
    if (filterMap[indexPrivacyParam] !== undefined) {
      delete filterMap[indexPrivacyParam]
    }
  }
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
    creation?: ObjectId
    _id?: { $in?: string[] | ObjectId[] }
    $or?: { user?: { $ne?: ObjectId; $eq?: ObjectId }; public: boolean }[]
  } = {}

  const sortOptions = sort
    ? (Object.fromEntries(
        (Array.isArray(sort) ? sort : [sort])
          .map(sortOption => {
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

            if (field === 'wow') {
              return []
            }

            if (field === 'embedding.score') {
              useEmbeddingsPreAggregate = true //@todo: handle aggregation below
              return ['embedding.score_adjusted', Number(direction)]
            }

            return [field, Number(direction)]
          })
          .filter(item => item.length !== 0),
      ) as SortOptions)
    : undefined

  const filterOptions = filter
    ? (Object.fromEntries(
        (Array.isArray(filter) ? filter : [filter]).map(filterOption => {
          const [field, value] = filterOption.split(';')
          // console.log({filterOption, field, value})

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

          if (field === 'creation') {
            customFilterOptions['creation'] = new ObjectId(value)
            return []
          }

          if (field === 'likedBy') {
            useReactionsPreAggregate = true
            preAggregateFilterOptions['user'] = new ObjectId(value)
            customFilterOptions['$or'] = [
              { user: { $ne: new ObjectId(value) }, public: true },
              { user: { $eq: new ObjectId(value) }, public: false },
            ]
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

          if (field === 'public') {
            if (!usesLikedFilter && isUserRequestingOwnProfileFeed) {
              return [field, value === 'false']
            }
            return []
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

  if (customFilterOptions.creation) {
    const embeddingDoc = (await Embedding.findOne({
      creation: new ObjectId(customFilterOptions.creation),
    }).lean()) as EmbeddingDocument

    try {
      if (embeddingDoc?.embedding?.length) {
        const similarCreationIds = await getSimilarCreationIds(
          server,
          embeddingDoc.embedding,
        )
        customFilterOptions['_id'] = {
          $in: similarCreationIds.map(item => new ObjectId(item)),
        }
      } else {
        return reply.status(200).send(emptyPaginatedResponse)
      }
    } catch (e) {
      console.log('Error fetching chroma embeddings', e)
      return reply.status(200).send(emptyPaginatedResponse)
    }
  }

  const customFilterMap: CustomFilters = {}

  for (const [fieldName, fieldValues] of Object.entries(customFilterOptions)) {
    if (fieldValues === undefined) continue

    if (fieldName === 'outputType') {
      customFilterMap['mediaAttributes.type'] = {
        // @ts-ignore
        $in: Array.isArray(fieldValues) ? fieldValues : [fieldValues],
      }
    } else if (fieldName === 'generator') {
      // @ts-ignore
      customFilterMap['generator'] = {
        $in: Array.isArray(fieldValues)
          ? // @ts-ignore
            fieldValues.map(val => new ObjectId(val))
          : // @ts-ignore
            [new ObjectId(fieldValues)],
      }
    } else if (
      !usesLikedFilter &&
      fieldName === 'public' &&
      isUserRequestingOwnProfileFeed
    ) {
      customFilterMap['public'] = String(fieldValues) === 'false'
    } else if (fieldName === 'praiseCount') {
      customFilterMap['praiseCount'] = { $gt: 0 }
    } else if (fieldName === 'creationCount') {
      customFilterMap['creationCount'] = { $gt: 0 }
    } else if (fieldName === 'followerCount') {
      customFilterMap['followerCount'] = { $gt: 0 }
    } else if (fieldName === 'createdAt') {
      //@ts-ignore
      customFilterMap['createdAt'] = fieldValues
    } else if (fieldName === '_id') {
      customFilterMap['_id'] = fieldValues as ObjectId
    } else if (fieldName === '$or') {
      // @ts-ignore
      customFilterMap['$or'] = fieldValues
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
    !usesLikedFilter &&
    usesPrivacy &&
    !isUserRequestingOwnProfileFeed &&
    !(
      collection &&
      collection.user &&
      authUserId &&
      collection.user.toString() === authUserId.toString()
    )
      ? { public: { $eq: true } }
      : undefined

  // const defaultDeletedFilter = usesPrivacy
  //   ? { deleted: { $eq: false } }
  //   : undefined

  const filters = {
    ...defaultPrivacyFilter,
    // ...defaultDeletedFilter,
    ...customFilterMap,
    ...filterOptions,
  }

  // console.log('feedCursorController', JSON.stringify(filters))

  return {
    filters: filters || {},
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

const createPipeline = async (
  options: QueryOptions = {},
): Promise<PipelineStage[]> => {
  const { cursor, sortCursor, limit, filters = {}, sortOptions } = options
  const pipeline: PipelineStage[] = []

  if (cursor) {
    const idCursor =
      sortCursor !== undefined
        ? { _id: { $lt: new ObjectId(cursor) } }
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

export const getCreationsFeedCursorV2 = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { query } = request
  const { userId: authUserId } = request.user || {}
  // const currentDate = new Date()

  const {
    filters,
    sortOptions,
    customFilterOptions,
    // filterMap,
    // preAggregateFilterOptions,
    // useReactionsPreAggregate,
    // useEmbeddingsPreAggregate,
    // useCollectionsPreAggregate,
    // useFollowingPreAggregate,
  } = await handleArguments({
    server,
    reply,
    authUserId,
    query: query as CursorPaginatedFeedQuery,
  })

  const { cursor, nextValue, limit } = query as CursorPaginatedFeedQuery

  let results = []
  const lateLookupStages = [...userLookup]

  const pipeline = await createPipeline({
    limit: limit ?? 100,
    sortOptions: { ...sortOptions, _id: -1 },
    sortCursor:
      customFilterOptions.praiseCount && nextValue !== undefined
        ? { praiseCount: { $lte: nextValue } }
        : undefined,
    cursor,
  })

  // const hoursAgo = 360
  // currentDate.setMinutes(0, 0, 0)
  // const minDateDefault = new Date(currentDate)
  // minDateDefault.setHours(currentDate.getHours() - hoursAgo)
  // minDateDefault.setMinutes(0, 0, 0)
  // const maxDate = filterMap
  //   ? filterMap.filter(item => item.name === 'maxDate')[0]
  //   : undefined
  // const minDate = filterMap
  //   ? filterMap.filter(item => item.name === 'minDate')[0]
  //   : undefined
  // const embeddingsFilter = {
  //   ...filters,
  //   createdAt: {
  //     $gte: minDate ? minDate.value : minDateDefault,
  //     $lte: maxDate ? maxDate?.value : undefined,
  //   },
  //   'embedding.score': {
  //     $exists: true,
  //   },
  // }

  // let embeddingsTransform: PipelineStage[] = []
  const creationFeedPipeline = [
    // @ts-ignore
    // { $match: useEmbeddingsPreAggregate ? embeddingsFilter : filters },
    { $match: filters },
    //   ...embeddingsTransform,
    ...pipeline,
    ...lateLookupStages,
  ].filter(Boolean)

  // console.log(JSON.stringify(creationFeedPipeline, null, 2))

  results = await CreationV2.aggregate(creationFeedPipeline)

  const feed: FeedResponse = {
    docs: results,
    reactions: [],
    bookmarks: [],
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

export const getModelsFeedCursorV2 = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { query } = request
  const { userId: authUserId } = request.user || {}
  // const currentDate = new Date()

  console.log({ query, authUserId })

  const {
    filters,
    sortOptions,
    customFilterOptions,
    // filterMap,
    // preAggregateFilterOptions,
    // useReactionsPreAggregate,
    // useEmbeddingsPreAggregate,
    // useCollectionsPreAggregate,
    // useFollowingPreAggregate,
  } = await handleArguments({
    server,
    reply,
    authUserId,
    query: query as CursorPaginatedFeedQuery,
  })

  const { cursor, nextValue, limit } = query as CursorPaginatedFeedQuery

  let results = []
  const lateLookupStages = [...userLookup]

  const pipeline = await createPipeline({
    limit: limit ?? 100,
    sortOptions: { ...sortOptions, _id: -1 },
    sortCursor:
      customFilterOptions.praiseCount && nextValue !== undefined
        ? { praiseCount: { $lte: nextValue } }
        : undefined,
    cursor,
  })

  // const hoursAgo = 360
  // currentDate.setMinutes(0, 0, 0)
  // const minDateDefault = new Date(currentDate)
  // minDateDefault.setHours(currentDate.getHours() - hoursAgo)
  // minDateDefault.setMinutes(0, 0, 0)
  // const maxDate = filterMap
  //   ? filterMap.filter(item => item.name === 'maxDate')[0]
  //   : undefined
  // const minDate = filterMap
  //   ? filterMap.filter(item => item.name === 'minDate')[0]
  //   : undefined
  // const embeddingsFilter = {
  //   ...filters,
  //   createdAt: {
  //     $gte: minDate ? minDate.value : minDateDefault,
  //     $lte: maxDate ? maxDate?.value : undefined,
  //   },
  //   'embedding.score': {
  //     $exists: true,
  //   },
  // }

  // let embeddingsTransform: PipelineStage[] = []
  const feedPipeline = [
    // @ts-ignore
    // { $match: useEmbeddingsPreAggregate ? embeddingsFilter : filters },
    { $match: filters },
    //   ...embeddingsTransform,
    ...pipeline,
    ...lateLookupStages,
  ].filter(Boolean)

  console.log(JSON.stringify(feedPipeline, null, 2))

  results = await ModelV2.aggregate(feedPipeline)

  const feed: FeedResponse = {
    docs: results,
    reactions: [],
    bookmarks: [],
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

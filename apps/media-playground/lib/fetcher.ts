import {
  CursorPaginatedFeedQuery,
  CursorPaginatedRouteQueryParams,
  FeedCursorRouteQueryParams,
  ListQueryParams,
} from '@edenlabs/eden-sdk'
import axios, { AxiosError } from 'axios'

// import * as queryString from 'querystring'

export const fetcher = async <T>(
  ...args: Parameters<typeof fetch>
): Promise<T> => {
  // console.log('fetcher', ...args)
  const response = await fetch(...args)

  if (!response.ok) {
    console.log(
      response.url,
      response.status,
      response.statusText,
      response.headers,
    )
    throw new Error('Network response was not ok')
  }

  // console.log({ response })

  return response.json()
}

export const handleAxiosServerError = (error: AxiosError | unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data.message ||
      error.response?.data.error ||
      'Unknown Error has occurred'
    )
  }

  return 'Unknown Error has occurred'
}

export const extractPaginationParams = (
  params: URLSearchParams,
): Partial<ListQueryParams> => {
  const query: Partial<ListQueryParams> = {}

  const sort = params.getAll('sort')
  if (sort) query.sort = sort

  const limit = params.get('limit')
  if (limit) query.limit = Number(limit)

  const page = params.get('page')
  if (page) query.page = Number(page)

  // const filterKeys = ['name', 'user', 'character', 'collection', 'creation', 'generator', 'outputType', 'concept', 'isPrivate', 'visibility', 'maxDate', 'minDate']
  // const filter: Partial<TasksV2ListArguments['filter']> = {}

  // filterKeys.forEach((key) => {
  //   let value = params.getAll(`filter.${key}`)

  // if (value) {
  //   if (key === 'isPrivate') {
  //     filter.isPrivate = value[0] === 'true'
  //   } else if (key === 'visibility') {
  //     filter.visibility = value[0] as 'all' | 'public' | 'private'
  //   } else {
  //     // @ts-ignore
  //     filter[key] = value
  //   }
  // }
  // })

  // if (Object.keys(filter).length) feedQuery.filter = filter

  return query
}

// type FilterKey =
//   | 'name'
//   | 'creationId'
//   | 'collectionId'
//   | 'characterId'
//   | 'conceptId'
//   | 'maxDate'
//   | 'minDate'
//   | 'generatorId'
//   | 'outputType'
//   | 'isPrivate'
//   | 'visibility'
//   | 'sort'
//   | 'limit'
//   | 'cursor'
//   | 'nextValue'
//   | 'userId';

// type FilterTypeMap = Record<FilterKey, string | string[] | number | boolean | undefined> & {
//   name?: string,
//   creationId?: string,
//   collectionId?: string,
//   characterId?: string,
//   conceptId?: string,
//   maxDate?: string,
//   minDate?: string,
//   generatorId?: string | string[],
//   outputType?: string | string[],
//   isPrivate?: boolean,
//   visibility?: string,
//   sort?: string,
//   limit?: number,
//   cursor?: string,
//   nextValue?: number,
//   userId?: string,
// }
// type FilterParams<T> = { [K in keyof T]: T[K] };

// type CursorPaginatedFeedQuery = FilterParams<FilterTypeMap>;

export const createCursorPaginationRoute = (
  baseUrl: string,
  query: FeedCursorRouteQueryParams['filter'] & CursorPaginatedRouteQueryParams,
) => {
  const basePath = baseUrl
  const params: CursorPaginatedFeedQuery = {}

  // console.log(query)

  if (query.limit) {
    params.limit = query.limit
  }
  if (query.cursor) {
    params.cursor = query.cursor
  }
  if (query.nextValue) {
    params.nextValue = query.nextValue
  }

  const filters = []

  // console.log(query.userId, query.orderBy)

  const userIdExists = !!query.user
  const isOrderByLiked = query.orderBy === 'liked'
  const isOrderByOther = !query.orderBy || !isOrderByLiked

  const likedByUserFilter = { likedBy: query.user }
  const userFilter = { user: String(query.user) }

  if (userIdExists) {
    if (isOrderByLiked) {
      filters.push(likedByUserFilter)
      filters.push({ public: false })
    }

    if (isOrderByOther) {
      filters.push(userFilter)
    }
  }
  if (query.name && query.name.length > 0) {
    filters.push({ name: String(query.name) })
  }
  if (query.creation) {
    filters.push({ creation: String(query.creation) })
  }
  if (query.collection) {
    filters.push({ collection: String(query.collection) })
  }
  if (query.character) {
    filters.push({ character: String(query.character) })
  }
  if (query.concept) {
    filters.push({ concept: String(query.concept) })
  }
  if (query.maxDate) {
    filters.push({ maxDate: query.maxDate })
  }
  if (query.minDate) {
    filters.push({ minDate: query.minDate })
  }
  if (query.base_model) {
    filters.push({ base_model: query.base_model })
  }

  if (query.tool) {
    if (typeof query.tool === 'string') {
      filters.push({ tool: query.tool })
    } else if (Array.isArray(query.tool) && query.tool.length) {
      query.tool.map(id => {
        filters.push({ tool: id })
      })
    }
  }

  if (query.output_type) {
    if (typeof query.output_type === 'string') {
      filters.push({ output_type: query.output_type })
    } else if (Array.isArray(query.output_type) && query.output_type.length) {
      query.output_type.map(id => {
        filters.push({ output_type: id })
      })
    }
  }

  if (query.visibility && query.visibility !== 'all') {
    filters.push({ public: query.visibility === 'private' })
  } else if (typeof query.isPrivate !== 'undefined') {
    filters.push({ public: query.isPrivate })
  }

  // if (query.orderBy) {
  //   params.sort = [`${String(query.orderBy)};-1`]
  //   if (query.orderBy !== 'createdAt') {
  //     params.sort.push(`createdAt;-1`)
  //   }
  // if (query.orderBy === OrderByPopularity.field) {
  //   filters.push({ praiseCount: true })
  // }
  // }

  let queryStringArray: string[] = []

  for (let key in params) {
    // @ts-ignore
    if (Array.isArray(params[key])) {
      // @ts-ignore
      params[key].forEach((value: string | number) => {
        queryStringArray.push(`${key}=${value}`)
      })
    } else {
      // @ts-ignore
      queryStringArray.push(`${key}=${params[key]}`)
    }
  }

  const filterStringArray = filters.map(filter => {
    const [field, value] = Object.entries(filter)[0]
    return `filter=${field};${value}`
  })
  // console.log(queryStringArray)
  // console.log(filters)
  const queryString = [...queryStringArray, ...filterStringArray].join('&')

  // console.log({ filters, queryString })

  return queryString ? `${basePath}?${queryString}` : basePath
}

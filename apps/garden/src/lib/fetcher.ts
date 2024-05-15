import { OrderByPopularity } from '@/components/Layout/buttons/OrderByButtons'
import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import { CONFIG } from '@/lib/config'
import { message } from 'antd'
import { MessageInstance } from 'antd/es/message/interface'
import axios, { AxiosError } from 'axios'
import queryString from 'query-string'
import { CursorPaginatedFeedQuery, CursorPaginatedRouteQueryParams } from '@edenlabs/eden-sdk'

// @ts-ignore
export const fetcher = (...args) =>
  // @ts-ignore
  fetch(...args).then(res => res.json())

export const handleAxiosError = (
  error: AxiosError | unknown,
  messageInstance: MessageInstance,
  customMessage?: string,
) => {
  if (axios.isAxiosError(error)) {
    const toastMessage =
      customMessage ??
      (error.response?.data.message || 'Unknown Error has occurred')

    message.destroy()
    message.error(toastMessage)
  }
}

export const handleAxiosServerError = (error: AxiosError | unknown) => {
  if (axios.isAxiosError(error)) {
    return 'ServerError:' + (error.response?.data.message || 'Unknown Error has occurred')
  }

  return 'Unknown Error has occurred'
}

export const getAdminHeaders = () => {
  return {
    'X-Api-Key': CONFIG.EDEN_ADMIN_API_KEY,
    'X-Api-Secret': CONFIG.EDEN_ADMIN_API_SECRET,
  }
}

export const createPaginationRoute = (
  baseUrl: string,
  query: PaginatedFeedQuery,
) => {
  const basePath = baseUrl
  const params: PaginatedFeedQuery = {}

  if (query.limit && query.page) {
    params.page = query.page
    params.limit = query.limit
  }
  if (query.userId) {
    params.userId = String(query.userId)
  }
  if (query.creationId) {
    params.creationId = String(query.creationId)
  }
  if (query.characterId) {
    params.characterId = String(query.characterId)
  }
  if (query.conceptId) {
    params.conceptId = String(query.conceptId)
  }
  // if (query.generatorId) {
  //   params.generatorId = String(query.generatorId)
  // }
  if (Array.isArray(query.generatorId)) {
    params.generatorId = query.generatorId.map(id => String(id))
  } else if (query.generatorId) {
    params.generatorId = [String(query.generatorId)]
  }

  if (Array.isArray(query.outputType)) {
    params.outputType = query.outputType.map(id => String(id))
  } else if (query.outputType) {
    params.outputType = [String(query.outputType)]
  }

  if (query.visibility && query.visibility !== 'all') {
    params.isPrivate = query.visibility === 'private'
  } else if (typeof query.isPrivate !== 'undefined') {
    params.isPrivate = query.isPrivate
  }

  if (query.name && query.name.length > 0) {
    params.name = String(query.name)
  }
  if (query.collectionId) {
    params.collectionId = String(query.collectionId)
  }
  if (query.orderBy) {
    params.orderBy = String(query.orderBy)
  }
  if (query.direction) {
    params.direction = Number(query.direction)
  }
  if (query.maxDate) {
    params.maxDate = query.maxDate
  }
  if (query.minDate) {
    params.minDate = query.minDate
  }
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

  const queryString = queryStringArray.join('&')

  return queryString ? `${basePath}?${queryString}` : basePath
}

export const createCursorPaginationRoute = (
  baseUrl: string,
  query: PaginatedFeedQuery & CursorPaginatedRouteQueryParams,
) => {
  const basePath = baseUrl
  const params: CursorPaginatedFeedQuery = {}

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

  if (query.userId) {
    if (query.orderBy && query.orderBy === 'liked')
      filters.push({ likedBy: query.userId })

    if (!query.orderBy || query.orderBy !== 'liked') {
      filters.push({ user: String(query.userId) })
    }
  }
  if (query.name && query.name.length > 0) {
    filters.push({ name: String(query.name) })
  }
  if (query.creationId) {
    filters.push({ creation: String(query.creationId) })
  }
  if (query.collectionId) {
    filters.push({ collection: String(query.collectionId) })
  }
  if (query.characterId) {
    filters.push({ character: String(query.characterId) })
  }
  if (query.conceptId) {
    filters.push({ concept: String(query.conceptId) })
  }
  if (query.maxDate) {
    filters.push({ maxDate: query.maxDate })
  }
  if (query.minDate) {
    filters.push({ minDate: query.minDate })
  }

  if (query.generatorId) {
    if (typeof query.generatorId === 'string') {
      filters.push({ generator: query.generatorId })
    } else if (Array.isArray(query.generatorId) && query.generatorId.length) {
      query.generatorId.map(id => {
        filters.push({ generator: id })
      })
    }
  }

  if (query.outputType) {
    if (typeof query.outputType === 'string') {
      filters.push({ outputType: query.outputType })
    } else if (Array.isArray(query.outputType) && query.outputType.length) {
      query.outputType.map(id => {
        filters.push({ outputType: id })
      })
    }
  }

  if (query.visibility && query.visibility !== 'all') {
    filters.push({ isPrivate: query.visibility === 'private' })
  } else if (typeof query.isPrivate !== 'undefined') {
    filters.push({ isPrivate: query.isPrivate })
  }

  if (query.orderBy) {
    params.sort = [`${String(query.orderBy)};-1`]
    if (query.orderBy !== 'createdAt') {
      params.sort.push(`createdAt;-1`)
    }
    if (query.orderBy === OrderByPopularity.field) {
      filters.push({ praiseCount: true })
    }
  }

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

  const queryString = [...queryStringArray, ...filterStringArray].join('&')

  // console.log(queryString)

  return queryString ? `${basePath}?${queryString}` : basePath
}

export const queryObjectToString = (queryObj: CursorPaginatedFeedQuery) => {
  return queryString.stringify(queryObj)
}

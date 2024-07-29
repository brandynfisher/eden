import { CursorPaginatedFeedQuery, ListQueryParams } from '@edenlabs/eden-sdk'
import axios, { AxiosError } from 'axios'

export const fetcher = async <T>(
  ...args: Parameters<typeof fetch>
): Promise<T> => {
  console.log('fetcher', ...args)
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

  return response.json()
}

export const handleAxiosServerError = (error: AxiosError | unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data.message || 'Unknown Error has occurred'
  }

  return 'Unknown Error has occurred'
}

export const extractFeedParams = (
  params: URLSearchParams,
): Partial<CursorPaginatedFeedQuery> => {
  const feedQuery: Partial<CursorPaginatedFeedQuery> = {}

  const sort = params.getAll('sort')
  if (sort) feedQuery.sort = sort

  const limit = params.get('limit')
  if (limit) feedQuery.limit = Number(limit)

  const cursor = params.get('cursor')
  if (cursor) feedQuery.cursor = cursor

  const nextValue = params.get('nextValue')
  if (nextValue) feedQuery.nextValue = Number(nextValue)

  const filterKeys = [
    'name',
    'user',
    'character',
    'collection',
    'creation',
    'generator',
    'outputType',
    'concept',
    'isPrivate',
    'visibility',
    'maxDate',
    'minDate',
  ]
  const filter: Partial<CursorPaginatedFeedQuery['filter']> = {}

  filterKeys.forEach(key => {
    let value = params.getAll(`filter.${key}`)

    if (value) {
      if (key === 'isPrivate') {
        filter.isPrivate = value[0] === 'true'
      } else if (key === 'visibility') {
        filter.visibility = value[0] as 'all' | 'public' | 'private'
      } else {
        // @ts-ignore
        filter[key] = value
      }
    }
  })

  if (Object.keys(filter).length) feedQuery.filter = filter

  return feedQuery
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

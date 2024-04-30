import axios, { AxiosError } from 'axios'
import { CursorPaginatedFeedQuery } from '@edenlabs/eden-sdk'
// import { FeedCreationsBaseArguments } from '@edenlabs/eden-sdk'

export const fetcher = async <T>(...args: Parameters<typeof fetch>): Promise<T> => {
  const response = await fetch(...args)

  if (!response.ok) {
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

export const extractFeedParams = (params: URLSearchParams): Partial<CursorPaginatedFeedQuery> => {
  const feedQuery: Partial<CursorPaginatedFeedQuery> = {}

  const sort = params.getAll('sort')
  if (sort) feedQuery.sort = sort

  const limit = params.get('limit')
  if (limit) feedQuery.limit = Number(limit)

  const cursor = params.get('cursor')
  if (cursor) feedQuery.cursor = cursor

  const nextValue = params.get('nextValue')
  if (nextValue) feedQuery.nextValue = Number(nextValue)

  const filterKeys = ['name', 'user', 'character', 'collection', 'creation', 'generator', 'outputType', 'concept', 'isPrivate', 'visibility', 'maxDate', 'minDate']
  const filter: Partial<CursorPaginatedFeedQuery['filter']> = {}

  filterKeys.forEach((key) => {
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
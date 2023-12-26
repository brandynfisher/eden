import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import { fetcher } from '@/lib/fetcher'
import { Creator } from '@edenlabs/eden-sdk'
import { useCallback } from 'react'
import useSWRInfinite from 'swr/infinite'

export type FollowersRouteQueryParams = {
  page?: number
  limit?: number
  userId?: string
}

export type PaginatedFollowersQuery = {
  // isAuthenticated?: boolean
  userId?: string
  limit?: number
  type: 'followers' | 'following'
}

const PAGE_SIZE = 10

export const useFollowingPaginated = (query: PaginatedFollowersQuery) => {
  const pageLimit = query?.limit || PAGE_SIZE || 10
  const type = query.type

  const route = (limit: number, page: number) => {
    const basePath = `/api/${type}`
    const params: PaginatedFeedQuery = {}

    if (pageLimit && page) {
      params.page = page
      params.limit = pageLimit
    }

    if (query?.userId) {
      params.userId = query.userId
    }

    const queryString = Object.keys(params)
      //@ts-ignore
      .map(key => `${key}=${params[key]}`)
      .join('&')

    return queryString ? `${basePath}?${queryString}` : basePath
  }

  const getKey = useCallback(
    (pageIndex: number, previousPageData: Creator[]): string | null => {
      if ((pageIndex === 0 && previousPageData === null) || pageIndex !== 0) {
        return route(pageLimit, pageIndex + 1)
      }

      return null
    },
    [pageLimit],
  )

  const {
    data,
    mutate: refetch,
    size,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite(getKey, fetcher, { revalidateOnFocus: false })
  const dataArray = data != null ? data.flat() : []

  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.length === 0
  const isReachingEnd =
    isEmpty ||
    (dataArray && dataArray[dataArray.length - 1]?.hasNextPage == false)
  const isRefreshing = isValidating && data && data.length === size
  const creatorDocs: Creator[] = (
    dataArray ? [...dataArray.map(pageData => pageData.docs)] : []
  ).flat()

  return {
    data,
    totalItemCount: !isEmpty ? dataArray[0]?.total : 0,
    items: creatorDocs,
    refetch,
    size,
    setSize,
    isLoading,
    isValidating,
    isLoadingMore,
    isReachingEnd,
    isRefreshing,
  }
}

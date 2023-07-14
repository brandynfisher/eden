import { OrderByParam } from '@/components/OrderByButtons'
import { fetcher } from '@/lib/fetcher'
import { Creation } from '@eden-labs/eden-sdk'
import { useCallback } from 'react'
import useSWRInfinite from 'swr/infinite'

export type FeedRouteQueryParams = {
  page?: number
  limit?: number
  userId?: string
  collectionId?: string
  orderBy?: string
  direction?: number
}

export type PaginatedFeedQuery = {
  // isAuthenticated?: boolean
  userId?: string
  collectionId?: string
  limit?: number
}

export const useFeedPaginated = (
  query: PaginatedFeedQuery = {},
  orderBy: OrderByParam | undefined,
) => {
  const pageLimit = query?.limit || 10

  const route = (limit: number, page: number) => {
    const basePath = '/api/feed'
    const params: FeedRouteQueryParams = {}

    if (pageLimit && page) {
      params.page = page
      params.limit = pageLimit
    }

    if (query?.userId) {
      params.userId = query.userId
    }
    if (query?.collectionId) {
      params.collectionId = query.collectionId
    }
    if (orderBy) {
      params.orderBy = orderBy.field
      params.direction = orderBy.direction
    }

    const queryString = Object.keys(params)
      //@ts-ignore
      .map(key => `${key}=${params[key]}`)
      .join('&')

    return queryString ? `${basePath}?${queryString}` : basePath
  }

  const getKey = useCallback(
    (pageIndex: number, previousPageData: Creation[]): string | null => {
      if ((pageIndex === 0 && previousPageData === null) || pageIndex !== 0) {
        return route(pageLimit, pageIndex + 1)
      }

      return null
    },
    [pageLimit, orderBy],
  )

  const {
    data,
    mutate: refetchFeed,
    size,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite(getKey, fetcher, { revalidateFirstPage: false })
  const dataArray = data != null ? data.flat() : []

  const isLoadingMore =
    isLoading ||
    (size > 0 && data != null && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.length === 0

  const maybeLoadMore = () => {
    if (isValidating) return
    if (isLoading || isLoadingMore) return
    if (isEmpty || (data && data.length >= data?.[0]?.pages)) return
    if (!data?.[data?.length - 1]?.hasNextPage) return

    setSize(prevSize => prevSize + 1)
  }

  const creationDocs = (
    dataArray ? [...dataArray.map(pageData => pageData.docs)] : []
  ).flat()

  return {
    creations: creationDocs,
    refetchFeed,
    size,
    setSize,
    isEmpty,
    maybeLoadMore,
  }
}

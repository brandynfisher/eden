import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import { fetcher } from '@/lib/fetcher'
import { Creation, PaginatedResponse } from '@edenlabs/eden-sdk'
import { useCallback, useMemo } from 'react'
import useSWRInfinite from 'swr/infinite'

export type PaginatedRouteQueryParams = {
  page?: number
  limit?: number
  orderBy?: string
  direction?: number
}

export type FeedRouteQueryParams = PaginatedRouteQueryParams & {
  userId?: string
  collectionId?: string
  creationId?: string
  name?: string
}

export type PaginatedFeedQuery = {
  userId?: string
  collectionId?: string
  name?: string
  creationId?: string
  limit?: number
}

export type FeedType = 'creations' | 'concepts'

export const getFeedPageRoute = (
  type: FeedType,
  query: PaginatedFeedQuery,
  limit: number,
  page: number,
  orderBy?: OrderByParam,
) => {
  const basePath = `/api/feed/${type}`
  const params: FeedRouteQueryParams = {}

  if (limit && page) {
    params.page = page
    params.limit = limit
  }

  if (query?.userId) {
    params.userId = query.userId
  }
  if (query?.name && query.name.length > 0) {
    params.name = query.name
  }
  if (query?.collectionId) {
    params.collectionId = query.collectionId
  }
  if (query?.creationId) {
    params.creationId = query.creationId
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

export const useFeedPaginated = (
  type: FeedType,
  query: PaginatedFeedQuery = {},
  orderBy: OrderByParam | undefined,
) => {
  const pageLimit = query?.limit || 25

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: PaginatedResponse<Creation[]>,
    ): string | null => {
      if (
        (pageIndex > 0 && !previousPageData) ||
        (previousPageData && !previousPageData.hasNextPage)
      ) {
        // console.log('reached the END')
        return null
      }

      // console.log('getKey', {pageIndex, previousPageData})
      return getFeedPageRoute(type, query, pageLimit, pageIndex + 1, orderBy)
    },
    [type, query, pageLimit, orderBy],
  )

  const {
    data,
    mutate: refetchFeed,
    size,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    // revalidateIfStale: false,
    revalidateFirstPage: false,
    persistSize: true,
    revalidateOnReconnect: false,
    // revalidateAll: false,
    initialSize: 1,
  })

  const isLoadingMore =
    isLoading ||
    (size > 0 && data != null && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.total === 0 || data?.[0]?.length === 0

  const maybeLoadMore = useMemo(() => {
    return () => {
      if (!data) return
      // console.log('maybeLoadMore')
      if (isValidating) return
      if (isLoading || isLoadingMore) return

      const { hasNextPage: dataHasNextPage } = data[0]

      if (dataHasNextPage) {
        setSize(prevSize => {
          // console.log('maybeLoadNextPage', {size: prevSize + 1, dataHasNextPage, isLoading, isLoadingMore, isValidating, docsLength: docs.length})
          return prevSize + 1
        })
      }
    }
  }, [isValidating, isLoading, isLoadingMore, data])

  const { docs, totalItems } = useMemo(() => {
    if (data) {
      const flatData = data.flatMap(page => page)
      return {
        docs: flatData.map(page => (page ? page.docs : [])),
        totalItems: flatData[0].total,
      }
    }
    return { docs: [], totalItems: null }
  }, [data])

  return {
    hasNextPage: data ? !!data[0]?.hasNextPage : false,
    totalItems: totalItems,
    items: data ? ([] as Creation[]).concat(...docs) : [],
    refetchFeed,
    size,
    setSize,
    isEmpty,
    isLoading,
    maybeLoadMore,
  }
}

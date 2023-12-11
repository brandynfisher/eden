import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import { fetcher } from '@/lib/fetcher'
import { ItemType } from '@/providers/ModalProvider'
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
  characterId?: string
  collectionId?: string
  creationId?: string
  name?: string
  conceptId?: string
}

export type PaginatedFeedQuery = {
  userId?: string
  characterId?: string
  collectionId?: string
  name?: string
  creationId?: string
  conceptId?: string
  limit?: number
}

export const getFeedPageRoute = (
  itemType: ItemType,
  query: PaginatedFeedQuery,
  limit: number,
  page: number,
  orderBy?: OrderByParam,
) => {
  const basePath = `/api/feed/${itemType}s`
  const params: FeedRouteQueryParams = {}

  if (limit && page) {
    params.page = page
    params.limit = limit
  }

  if (query?.userId) {
    params.userId = query.userId
  }
  if (query?.characterId) {
    params.characterId = query.characterId
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
  if (query?.conceptId) {
    params.conceptId = query.conceptId
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
  itemType: ItemType,
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
      return getFeedPageRoute(
        itemType,
        query,
        pageLimit,
        pageIndex + 1,
        orderBy,
      )
    },
    [itemType, query, pageLimit, orderBy],
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
    (size > 0 &&
      data != null &&
      typeof data[size - 1] === 'undefined' &&
      data &&
      data[data.length - 1] &&
      typeof data[data.length - 1] !== 'undefined' &&
      data[data.length - 1]?.hasNextPage)
  const isEmpty = data?.[0]?.total === 0 || data?.[0]?.length === 0

  const maybeLoadMore = useMemo(() => {
    return () => {
      if (!data) return
      if (isValidating) return
      if (isLoading || isLoadingMore) return

      const { hasNextPage: dataHasNextPage } = data[data.length - 1]

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
        docs: flatData ? flatData.map(page => (page ? page.docs : [])) : [],
        totalItems: flatData && flatData[0] ? flatData[0].total : 0,
      }
    }
    return { docs: [], totalItems: null }
  }, [data])

  return {
    hasNextPage: data ? !!data[size - 1]?.hasNextPage : false,
    totalItems: totalItems,
    items: data ? ([] as Creation[]).concat(...docs) : [],
    refetchFeed,
    size,
    setSize,
    isEmpty,
    isLoading,
    isLoadingMore,
    maybeLoadMore,
  }
}

import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import { shuffle } from '@/lib/array'
import { createPaginationRoute, fetcher } from '@/lib/fetcher'
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

export type FeedRouteQueryParams = {
  userId?: string | string[]
  characterId?: string | string[]
  collectionId?: string | string[]
  creationId?: string | string[]
  generatorId?: string | string[]
  name?: string | string[]
  conceptId?: string | string[]
  maxDate?: string
  minDate?: string
}

export type PaginatedFeedQuery = FeedRouteQueryParams &
  PaginatedRouteQueryParams

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
      return createPaginationRoute(`/api/feed/${itemType}s`, {
        ...query,
        limit: pageLimit,
        page: pageIndex + 1,
        orderBy: orderBy ? orderBy.field : undefined,
        direction: orderBy ? orderBy.direction : undefined,
      })
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

      if (
        data &&
        data.length &&
        data[data.length - 1] &&
        data[data.length - 1].hasNextPage
      ) {
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
        docs: flatData
          ? flatData.map((page, index) => {
              // shuffle latest page of recommended feed
              if (orderBy && orderBy.field === 'embedding.score') {
                return page
                  ? index === size - 1
                    ? shuffle(page.docs)
                    : page.docs
                  : []
              }

              return page ? page.docs : []
            })
          : [],
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

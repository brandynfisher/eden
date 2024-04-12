import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import { FeedRouteQueryParams } from '@/hooks/useFeedPaginated'
import { shuffle } from '@/lib/array'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import { ItemType } from '@/providers/ModalProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { useMemo } from 'react'
import useSWRInfinite from 'swr/infinite'

export type CursorPaginatedRouteQueryParams = {
  cursor?: string
  limit?: number
  orderBy?: string
}

export type FeedCursorRouteQueryParams = {
  sort?: string | string[]
  filter?: {
    name?: string | string[]
    user?: string | string[]
    character?: string | string[]
    collection?: string | string[]
    creation?: string | string[]
    generator?: string | string[]
    outputType?: string | string[]
    concept?: string | string[]
    isPrivate?: boolean
    visibility?: 'all' | 'public' | 'private'
    maxDate?: string
    minDate?: string
  }
}

export type CursorPaginatedFeedQuery = FeedCursorRouteQueryParams &
  CursorPaginatedRouteQueryParams

type CursorPaginatedResponse = {
  docs: Creation[]
  nextCursor: string
}
export const useFeedCursorPaginated = (
  itemType: ItemType,
  query: FeedRouteQueryParams & CursorPaginatedFeedQuery = {},
  orderBy: OrderByParam | undefined,
) => {
  const pageLimit = query?.limit || 50
  const featuredCollectionId =
    orderBy && orderBy.field === 'wow'
      ? process.env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID
      : undefined

  const getKey = (
    pageIndex: number,
    previousPageData: CursorPaginatedResponse,
  ) => {
    if (previousPageData) {
      if (!previousPageData.docs) return null
      if (previousPageData.docs.length < pageLimit) return null
      if (previousPageData.nextCursor === '0') return null
    }

    const basePath = createCursorPaginationRoute(
      `/api/feed-cursor/${itemType}s`,
      {
        ...{
          collection: featuredCollectionId,
          ...query,
        },
        limit: pageLimit,
        orderBy: orderBy ? orderBy.field : undefined,
      },
    )

    if (pageIndex === 0) {
      return basePath
    }

    return `${basePath}&cursor=${previousPageData.nextCursor}`
  }

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
    // persistSize: true,
    revalidateOnReconnect: false,
    // revalidateAll: false,
    initialSize: 1,
  })

  const isLoadingMore =
    isLoading ||
    (size > 0 &&
      data != null &&
      typeof data[data.length - 1] === 'undefined' &&
      data &&
      data[data.length - 1] &&
      typeof data[data.length - 1] !== 'undefined' &&
      data[data.length - 1]?.nextCursor)
  const isEmpty =
    data?.[0] &&
    data?.[0].docs &&
    data?.[0].docs.length === 0 &&
    data?.[0].nextCursor === '0'
  const maybeLoadMore = useMemo(() => {
    return () => {
      if (!data) return
      if (isValidating) return
      if (isLoading || isLoadingMore) return

      // if the last received page has fewer items than the configured pageLimit, we can assume that this is the last page
      if (
        data &&
        data.length &&
        data[data.length - 1] &&
        data[data.length - 1].docs &&
        data[data.length - 1].docs.length < pageLimit
      ) {
        return
      }

      if (
        data &&
        data.length &&
        data[data.length - 1] &&
        data[data.length - 1].nextCursor
      ) {
        setSize(prevSize => {
          // console.log('maybeLoadNextPage', {size: prevSize + 1, dataHasNextPage, isLoading, isLoadingMore, isValidating, docsLength: docs.length})
          return prevSize + 1
        })
      }
    }
  }, [isValidating, isLoading, isLoadingMore, data])

  const { docs } = useMemo(() => {
    if (data) {
      const flatData = data.flatMap(page => page)
      return {
        docs:
          flatData && flatData[0].docs && flatData[0].docs.length
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
        nextCursor: !!data[data.length - 1]?.nextCursor,
      }
    }
    return { docs: [] }
  }, [data])

  return {
    hasNextPage: data ? !!data[data.length - 1]?.nextCursor : false,
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

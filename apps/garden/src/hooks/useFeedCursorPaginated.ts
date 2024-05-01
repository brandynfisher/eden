import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import { FeedRouteQueryParams } from '@/hooks/useFeedPaginated'
import { shuffle } from '@/lib/array'
import {
  createCursorPaginationRoute,
  createPaginationRoute,
  fetcher,
} from '@/lib/fetcher'
import { ItemType } from '@/providers/ModalProvider'
import { Creation, CursorPaginatedFeedQuery, PaginatedResponse } from '@edenlabs/eden-sdk'
import { useCallback, useMemo } from 'react'
import useSWRInfinite, { SWRInfiniteKeyLoader } from 'swr/infinite'

type CursorPaginatedResponse = {
  docs: Creation[]
  nextCursor: string
  nextValue?: number
}
export const useFeedCursorPaginated = (
  itemType: ItemType,
  query: FeedRouteQueryParams & CursorPaginatedFeedQuery = {},
  orderBy: OrderByParam | undefined,
) => {
  const useCursorPagination = itemType === 'creation'
  const pageLimit = query?.limit || 50
  const featuredCollectionId =
    orderBy && orderBy.field === 'wow'
      ? process.env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID
      : undefined

  const getKey: SWRInfiniteKeyLoader = useCallback(
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

      return createPaginationRoute(`/api/feed/${itemType}s`, {
        ...{ collectionId: featuredCollectionId, ...query },
        limit: pageLimit,
        page: pageIndex + 1,
        orderBy: orderBy ? orderBy.field : undefined,
        direction: orderBy ? orderBy.direction : undefined,
      })
    },
    [featuredCollectionId, itemType, query, pageLimit, orderBy],
  )

  const getCursorKey: SWRInfiniteKeyLoader = useCallback((
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
          collectionId: featuredCollectionId,
          ...query,
        },
        limit: pageLimit,
        orderBy: orderBy ? orderBy.field : undefined,
      },
    )

    if (pageIndex === 0) {
      return basePath
    }

    const nextValue =
      previousPageData.nextValue !== undefined
        ? `&nextValue=${previousPageData.nextValue}`
        : ''
    return `${basePath}&cursor=${previousPageData.nextCursor}${nextValue}`
  }, [featuredCollectionId, itemType, query, pageLimit, orderBy])

  const {
    data,
    size,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite(!useCursorPagination ? getKey : getCursorKey, fetcher, {
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
      (data[data.length - 1]?.nextCursor || data[data.length - 1]?.hasNextPage))
  const isEmpty =
    data?.[0] &&
    data?.[0].docs &&
    data?.[0].docs.length === 0 &&
    (data?.[0].nextCursor === '0' || !data?.[0].hasNextPage)
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
        (data[data.length - 1].nextCursor || data[data.length - 1].hasNextPage)
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
      const nextPageOrCursor = !useCursorPagination
        ? {
            nextCursor: !!data[data.length - 1]?.nextCursor,
            nextValue: !!data[data.length - 1]?.nextValue,
          }
        : { totalItems: flatData && flatData.length && flatData[0] ? flatData[0].total : 0 }
      return {
        docs:
          flatData && flatData.length && flatData[0] !== undefined && flatData[0].docs !== undefined && flatData[0].docs.length
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
        ...nextPageOrCursor,
      }
    }
    return { docs: [], totalItems: !useCursorPagination ? null : undefined }
  }, [data])

  return {
    hasNextPage: data
      ? !useCursorPagination
        ? !!data[data.length - 1]?.hasNextPage
        : !!data[size - 1]?.nextCursor
      : false,
    items: data ? ([] as Creation[]).concat(...docs) : [],
    totalItems: !useCursorPagination ? totalItems : undefined,
    size,
    setSize,
    isEmpty,
    isLoading,
    isLoadingMore,
    maybeLoadMore,
  }
}

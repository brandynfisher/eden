'use client'

import LoadingIndicator from '@/components/loading-indicator'
import { Skeleton } from '@/components/ui/skeleton'
import { MultiSelectProvider } from '@/contexts/multi-select-context'
import MultiSelectToolbar from '@/features/feed/multi-select-toolbar'
import { useElementSize } from '@/hooks/use-element-size'
import { useMediaQuery } from '@/hooks/use-media-query'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import {
  IPage,
  PageData,
  RowItem,
  addDocIfNotExistInPage,
  updateDocInPage,
} from '@/lib/query/cache-updates'
import {
  FeedV2CursorResponse,
  PaginatedCursorResponse,
} from '@edenlabs/eden-sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { VirtualItem, useWindowVirtualizer } from '@tanstack/react-virtual'
import React, { useCallback, useEffect, useMemo } from 'react'

const MASONRY_GUTTER = 16
const DEFAULT_PAGE_LIMIT = 3

type Props = {
  apiEndpoint: string
  render: (
    item: RowItem,
    onUpdate: (item: RowItem) => void,
    index: number,
  ) => React.JSX.Element
  query: Record<string, unknown>
  queryKey: unknown[]
  minCols?: number
  maxCols?: number
  limit?: number
  onItemsLoaded?: (items: RowItem[]) => void
  setFetchNextPage?: (
    fetchNext: () => Promise<PaginatedCursorResponse<RowItem>>,
  ) => void
}

export const MasonrySkeleton = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
      <Skeleton className="h-full w-full aspect-square" />
      <Skeleton className="h-full w-full aspect-square" />
      <Skeleton className="h-full w-full aspect-square" />
      <Skeleton className="h-full w-full aspect-square" />
      <Skeleton className="h-full w-full aspect-square" />
      <Skeleton className="h-full w-full aspect-square" />
      <Skeleton className="h-full w-full aspect-square" />
    </div>
  )
}

const MasonryVirtualizerVertical = ({
  apiEndpoint,
  render,
  query,
  queryKey,
  minCols = 1,
  maxCols = 5,
  limit = DEFAULT_PAGE_LIMIT,
  onItemsLoaded, // Callback for passing items to parent
  setFetchNextPage, // Callback for external fetch triggers
}: Props) => {
  const { ref: masonryWrapRef, width: masonryWrapWidth } =
    useElementSize<HTMLDivElement>()

  const mediaQueries = [
    useMediaQuery('(min-width: 1920px)'),
    useMediaQuery('(min-width: 1536px)'),
    useMediaQuery('(min-width: 1280px)'),
    useMediaQuery('(min-width: 1024px)'),
    useMediaQuery('(min-width: 768px)'),
    useMediaQuery('(min-width: 640px)'),
    useMediaQuery('(min-width: 480px)'),
  ].reverse()

  const queryClient = useQueryClient()

  const onUpdate = useCallback(
    (updatedItem: RowItem) => {
      try {
        queryClient.setQueryData(
          queryKey,
          (old: PageData<IPage<RowItem>> | undefined) => {
            // If 'old' is undefined or doesn't have any pages, throw an error or handle this case accordingly.
            if (!old || !old.pages.length) {
              // Either return the original data, throwing error or handling situation is up to your context.
              console.error('No pages to update!')
              return old
            }

            let updatedPages: IPage<RowItem>[] = [...old.pages]

            let pageIndex = updatedPages.findIndex(page =>
              page?.docs?.some(doc => doc._id === updatedItem._id),
            )

            if (pageIndex === -1) {
              updatedPages = addDocIfNotExistInPage(updatedItem, updatedPages)
            } else {
              updatedPages = updateDocInPage(updatedItem, updatedPages)
            }

            return { ...old, pages: updatedPages }
          },
        )
      } catch (e) {
        console.log(e)
      }
    },
    [queryKey, queryClient],
  )

  const activeMQ = mediaQueries.lastIndexOf(true)

  const derivedColumnCount =
    activeMQ !== -1 ? minCols + (activeMQ + 1) : minCols
  const MASONRY_COLUMN_COUNT = maxCols
    ? derivedColumnCount > maxCols
      ? maxCols
      : derivedColumnCount
    : derivedColumnCount

  const columnWidth = useMemo(() => {
    return (
      (masonryWrapWidth - (MASONRY_COLUMN_COUNT - 1) * MASONRY_GUTTER) /
      MASONRY_COLUMN_COUNT
    )
  }, [MASONRY_COLUMN_COUNT, masonryWrapWidth])

  const {
    status,
    data,
    error,
    // isFetching,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      const paginationRoute = createCursorPaginationRoute(apiEndpoint, {
        // collectionId: featuredCollectionId,
        ...query,
        cursor: pageParam || '',
        limit: limit,
      })

      // console.log({paginationRoute})
      return fetcher(paginationRoute)
    },
    staleTime: 1000,
    getNextPageParam: (lastPage: FeedV2CursorResponse) => {
      // console.log(lastPage)
      if (
        lastPage &&
        lastPage?.docs?.length &&
        lastPage.docs.length === limit
      ) {
        if (lastPage.nextCursor) {
          return lastPage.nextCursor
        }
      }

      return undefined
    },
    initialPageParam: undefined,
  })

  // console.log({queryKey, query})

  const allRows = useMemo(() => {
    return data?.pages.flatMap(d => d.docs) || []
  }, [data])

  // Call `onItemsLoaded` after rendering
  useEffect(() => {
    if (onItemsLoaded) {
      onItemsLoaded(allRows as RowItem[])
    }
  }, [allRows, onItemsLoaded])

  const fetchNextForExternal = useCallback(async () => {
    if (hasNextPage) {
      const result = await fetchNextPage()
      return result.data?.pages[result.data.pages.length - 1] ?? { docs: [] }
    }

    return { docs: [] }
  }, [fetchNextPage, hasNextPage])

  useEffect(() => {
    if (setFetchNextPage) {
      setFetchNextPage(fetchNextForExternal)
    }
  }, [fetchNextForExternal, setFetchNextPage])

  const rowVirtualizer = useWindowVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    estimateSize: () => 156,
    overscan: limit,
    lanes: MASONRY_COLUMN_COUNT,
    gap: MASONRY_GUTTER,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const lastItem = virtualItems[virtualItems.length - 1]
  const virtualItemsStringified = JSON.stringify(
    rowVirtualizer.getVirtualItems(),
  )

  useEffect(() => {
    if (!lastItem || hasNextPage === undefined) {
      return
    }

    if (
      lastItem.index >= allRows.length - DEFAULT_PAGE_LIMIT &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allRows.length,
    isFetchingNextPage,
    virtualItemsStringified,
    lastItem,
  ])

  const renderItem = useCallback(
    (virtualItem: VirtualItem) => {
      const item = allRows[virtualItem.index]
      const isLoaderRow = virtualItem.index > allRows.length - 1

      if (!item && !isLoaderRow) {
        return null
      }

      return (
        <div
          key={`${apiEndpoint}_${virtualItem.index}`}
          ref={rowVirtualizer.measureElement}
          data-index={virtualItem.index}
          style={{
            position: 'absolute',
            top: 0,
            left: virtualItem.lane
              ? `${(columnWidth + MASONRY_GUTTER) * virtualItem.lane}px`
              : 0,
            width: `${columnWidth}px`,
            transform: `translateY(${virtualItem.start}px)`,
          }}
        >
          {isLoaderRow ? (
            <div className="flex items-center justify-center">
              {hasNextPage ? (
                <LoadingIndicator className="h-6 w-6" />
              ) : (
                'Nothing more to load'
              )}
            </div>
          ) : item ? (
            render(item, onUpdate, virtualItem.index)
          ) : (
            <div>Missing data</div>
          )}
        </div>
      )
    },
    [
      apiEndpoint,
      onUpdate,
      render,
      allRows,
      hasNextPage,
      rowVirtualizer,
      columnWidth,
    ],
  )

  return (
    <MultiSelectProvider>
      <div
        key={`${apiEndpoint}_${queryKey.join(',')}`}
        data-test-id="masonry-virtualizer-vertical"
        ref={masonryWrapRef}
        className="flex pb-12 outline-none"
      >
        <div
          data-test-id="masonry-virtualizer-vertical-content"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {!allRows.length && status ? (
            <div className="w-full h-full flex justify-center rounded-lg">
              {status === 'error' ? (
                <div className="px-4 bg-warning">Error fetching data.</div>
              ) : status !== 'pending' ? (
                <div className="px-4">Nothing found.</div>
              ) : null}
            </div>
          ) : null}

          {isLoading ? <MasonrySkeleton /> : null}

          {rowVirtualizer
            .getVirtualItems()
            .map(virtualItem => renderItem(virtualItem))}

          {error ? (
            <div className="text-destructive">{error.message}</div>
          ) : null}
        </div>
      </div>
      <MultiSelectToolbar queryKey={queryKey} />
    </MultiSelectProvider>
  )
}

export default MasonryVirtualizerVertical

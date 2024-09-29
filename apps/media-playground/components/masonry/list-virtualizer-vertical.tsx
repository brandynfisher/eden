'use client'

import LoadingIndicator from '@/components/loading-indicator'
import { useElementSize } from '@/hooks/use-element-size'
import { useMediaQuery } from '@/hooks/use-media-query'
import { fetcher } from '@/lib/fetcher'
import {
  TaskV2,
  TasksV2ListResponse,
  transformArgsIntoURLParams,
} from '@edenlabs/eden-sdk'
import { QueryKey, useInfiniteQuery } from '@tanstack/react-query'
import { VirtualItem, useWindowVirtualizer } from '@tanstack/react-virtual'
import React, { useCallback, useEffect, useMemo } from 'react'

const MASONRY_GUTTER = 16
const QUERY_LIMIT = 35

type Props = {
  apiEndpoint: string
  render: ({ item }: { item: TaskV2 }) => React.JSX.Element
  query: { [key: string]: unknown }
  queryKey: QueryKey
}

// export const MasonrySkeleton = () => {
//   return (
//     <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4'>
//       <Skeleton className='h-full w-full aspect-square' />
//       <Skeleton className='h-full w-full aspect-square' />
//       <Skeleton className='h-full w-full aspect-square' />
//       <Skeleton className='h-full w-full aspect-square' />
//       <Skeleton className='h-full w-full aspect-square' />
//       <Skeleton className='h-full w-full aspect-square' />
//       <Skeleton className='h-full w-full aspect-square' />
//     </div>
//   )
// }

const ListVirtualizerVertical = ({
  apiEndpoint,
  render,
  query,
  queryKey,
}: Props) => {
  const { ref: masonryWrapRef, width: masonryWrapWidth } =
    useElementSize<HTMLDivElement>()
  const above1536 = useMediaQuery('(min-width: 1536px)')
  const above1024 = useMediaQuery('(min-width: 1024px)')
  const above768 = useMediaQuery('(min-width: 768px)')

  const MASONRY_COLUMN_COUNT = above1536 ? 3 : above1024 ? 2 : above768 ? 1 : 1

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
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      // console.log(pageParam)
      const queryUrl = `${apiEndpoint}?${transformArgsIntoURLParams(
        pageParam
          ? {
              ...query,
              page: pageParam,
            }
          : query,
      )}`
      return fetcher(queryUrl)
    },
    staleTime: 1000,
    getNextPageParam: (lastPage: TasksV2ListResponse) => {
      return lastPage && lastPage.nextPage ? lastPage.nextPage : undefined
    },
    initialPageParam: 1,
  })

  const allRows = useMemo(() => {
    return data?.pages?.flatMap(d => d.docs) || []
  }, [data])

  const rowVirtualizer = useWindowVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    estimateSize: () => 300,
    overscan: QUERY_LIMIT,
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
      lastItem.index >= allRows.length - QUERY_LIMIT &&
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
            render({ item })
          ) : (
            <div>Missing data</div>
          )}
        </div>
      )
    },
    [render, allRows, hasNextPage, rowVirtualizer, columnWidth],
  )

  return (
    <div
      key={`${apiEndpoint}_${queryKey.join(',')}`}
      data-test-id="list-virtualizer-vertical"
      ref={masonryWrapRef}
      className="flex"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {!allRows.length ? (
          <div className="bg-primary/10 w-full h-full flex justify-center rounded-lg">
            {status === 'pending' ? (
              <LoadingIndicator />
            ) : (
              <div className="px-4">No recent tasks found.</div>
            )}
          </div>
        ) : null}

        {rowVirtualizer
          .getVirtualItems()
          .map(virtualItem => renderItem(virtualItem))}

        {error ? <div className="text-destructive">{error.message}</div> : null}
      </div>
    </div>
  )
}

export default ListVirtualizerVertical

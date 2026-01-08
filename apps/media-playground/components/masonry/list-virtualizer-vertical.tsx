'use client'

import LoadingIndicator from '@/components/loading-indicator'
import { ListSkeleton } from '@/components/timeline/timeline'
import { Button } from '@/components/ui/button'
import { useAuthState } from '@/hooks/use-auth-state'
import { useElementSize } from '@/hooks/use-element-size'
import { fetcher } from '@/lib/fetcher'
import { useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import {
  TaskV2,
  TasksV2ListResponse,
  transformArgsIntoURLParams,
} from '@edenlabs/eden-sdk'
import { QueryKey, useInfiniteQuery } from '@tanstack/react-query'
import { VirtualItem, useVirtualizer } from '@tanstack/react-virtual'
import { LogIn } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MASONRY_GUTTER = 32

type Props = {
  apiEndpoint: string
  render: ({ item }: { item: TaskV2 }) => React.JSX.Element
  query: { [key: string]: unknown }
  queryKey: QueryKey
  filterItem?: (item: TaskV2) => boolean
}

const ListVirtualizerVertical = ({
  apiEndpoint,
  render,
  query,
  queryKey,
  filterItem,
}: Props) => {
  const { openSignIn } = useClerk()
  const { user } = useAuthState()
  const pathname = usePathname()

  const { ref: masonryWrapRef, width: masonryWrapWidth } =
    useElementSize<HTMLDivElement>()
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(
    null,
  )

  // Find the scrollable parent container
  useEffect(() => {
    if (masonryWrapRef.current) {
      let parent: HTMLElement | null = masonryWrapRef.current.parentElement
      while (parent) {
        const style = window.getComputedStyle(parent)
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          scrollContainerRef.current = parent
          setScrollContainer(parent)
          break
        }
        parent = parent.parentElement
      }
    }
  }, [])
  const MASONRY_COLUMN_COUNT = 1

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
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
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
    enabled: !!user,
  })

  const allRows = useMemo(() => {
    const rows = data?.pages?.flatMap(d => d.docs) || []
    const definedRows = rows.filter((row): row is TaskV2 => !!row)
    return filterItem ? definedRows.filter(filterItem) : definedRows
  }, [data, filterItem])

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    estimateSize: () => 300,
    overscan: 5,
    getScrollElement: () => scrollContainer,
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
      lastItem.index >= allRows.length - 3 &&
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
          key={`${apiEndpoint}_${JSON.stringify(queryKey)}_${item?._id}_${
            virtualItem.index
          }`}
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
              {hasNextPage ? <LoadingIndicator className="h-6 w-6" /> : null}
            </div>
          ) : item ? (
            render({ item })
          ) : (
            <div>Missing data</div>
          )}
        </div>
      )
    },
    [
      render,
      allRows,
      hasNextPage,
      rowVirtualizer,
      columnWidth,
      apiEndpoint,
      queryKey,
    ],
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
        {status === 'pending' && !allRows.length ? (
          <div className="w-full flex flex-col gap-y-8">
            <ListSkeleton />
          </div>
        ) : !user && !allRows.length ? (
          <div className="col-span-full flex flex-col items-center justify-center p-6 text-center bg-muted/20 border border-dashed border-gray-700 rounded-md">
            <p className="text-muted-foreground mb-3">
              Please sign in to view your tasks.
            </p>
            <Button
              variant="outline"
              className="gap-x-2"
              onClick={() =>
                openSignIn({
                  appearance: { baseTheme: dark },
                  forceRedirectUrl: pathname,
                })
              }
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </div>
        ) : !allRows.length ? (
          <div className="p-4 text-center bg-accent rounded-md">
            No recent tasks found.
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

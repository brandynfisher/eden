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
import {
  VirtualItem,
  useVirtualizer,
  useWindowVirtualizer,
} from '@tanstack/react-virtual'
import React, {
  RefObject,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'

const GRID_GAP = 16
const DEFAULT_PAGE_LIMIT = 5 // Better for testing pagination

export interface BreakpointConfig {
  minWidth: 1920 | 1536 | 1280 | 1024 | 768 | 640 | 480 | 0
  columns: number
}

// Define the handle type
export interface GridVirtualizerHandle {
  getTopmostVisibleIndex: () => number | null
}

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
  breakpoints?: BreakpointConfig[]
  onItemsLoaded?: (items: RowItem[]) => void
  setFetchNextPage?: (
    fetchNext: () => Promise<PaginatedCursorResponse<RowItem>>,
  ) => void
  scrollRef?: RefObject<HTMLDivElement>
  initialScrollIndex?: number | null
  onScrollRestored?: () => void
  showSkeleton?: boolean
  itemHeight?: number
}

export const GridSkeleton = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[140px] w-full" />
    </div>
  )
}

const useConditionalVirtualizer = (
  options: {
    count: number
    estimateSize: () => number
    overscan: number
  },
  scrollRef?: RefObject<HTMLDivElement>,
) => {
  const windowVirtualizer = useWindowVirtualizer(options)
  const elementVirtualizer = useVirtualizer({
    ...options,
    getScrollElement: () => scrollRef?.current ?? null,
  })

  return useMemo(
    () => (scrollRef ? elementVirtualizer : windowVirtualizer),
    [elementVirtualizer, windowVirtualizer, scrollRef],
  )
}

const GridVirtualizerVertical = forwardRef<GridVirtualizerHandle, Props>(
  (
    {
      apiEndpoint,
      render,
      query,
      queryKey,
      minCols = 1,
      maxCols = 5,
      limit = DEFAULT_PAGE_LIMIT,
      breakpoints,
      onItemsLoaded,
      setFetchNextPage,
      scrollRef,
      initialScrollIndex,
      onScrollRestored,
      showSkeleton = false,
      itemHeight = 156,
    },
    ref,
  ) => {
    const { ref: gridWrapRef } = useElementSize<HTMLDivElement>()
    const innerRef = useRef<HTMLDivElement>(null)

    // Define individual media query hooks
    const isMin480 = useMediaQuery('(min-width: 480px)')
    const isMin640 = useMediaQuery('(min-width: 640px)')
    const isMin768 = useMediaQuery('(min-width: 768px)')
    const isMin1024 = useMediaQuery('(min-width: 1024px)')
    const isMin1280 = useMediaQuery('(min-width: 1280px)')
    const isMin1536 = useMediaQuery('(min-width: 1536px)')
    const isMin1920 = useMediaQuery('(min-width: 1920px)')

    // Combine media query results
    const mediaQueries = useMemo(() => {
      if (breakpoints) {
        return breakpoints
          .sort((a, b) => b.minWidth - a.minWidth)
          .map(bp => {
            switch (bp.minWidth) {
              case 1920:
                return isMin1920
              case 1536:
                return isMin1536
              case 1280:
                return isMin1280
              case 1024:
                return isMin1024
              case 768:
                return isMin768
              case 640:
                return isMin640
              case 480:
                return isMin480
              case 0:
                return true
              default:
                return false
            }
          })
      }

      return [
        isMin1920,
        isMin1536,
        isMin1280,
        isMin1024,
        isMin768,
        isMin640,
        isMin480,
      ].reverse()
    }, [
      breakpoints,
      isMin480,
      isMin640,
      isMin768,
      isMin1024,
      isMin1280,
      isMin1536,
      isMin1920,
    ])

    const queryClient = useQueryClient()

    const onUpdate = useCallback(
      (updatedItem: RowItem) => {
        try {
          queryClient.setQueryData(
            queryKey,
            (old: PageData<IPage<RowItem>> | undefined) => {
              if (!old || !old.pages.length) {
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
          console.error(e)
        }
      },
      [queryKey, queryClient],
    )

    const GRID_COLUMN_COUNT = useMemo(() => {
      if (breakpoints) {
        const activeBreakpointIndex = mediaQueries.findIndex(mq => mq)
        if (activeBreakpointIndex !== -1) {
          const columns = breakpoints[activeBreakpointIndex].columns
          return maxCols ? Math.min(columns, maxCols) : columns
        }
        return minCols
      }

      const activeMQ = mediaQueries.lastIndexOf(true)
      const derivedColumnCount =
        activeMQ !== -1 ? minCols + (activeMQ + 1) : minCols
      return maxCols
        ? Math.min(derivedColumnCount, maxCols)
        : derivedColumnCount
    }, [mediaQueries, breakpoints, minCols, maxCols])

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
        const paginationRoute = createCursorPaginationRoute(apiEndpoint, {
          ...query,
          cursor: pageParam || '',
          limit: limit,
        })

        return fetcher(paginationRoute)
      },
      staleTime: 1000,
      getNextPageParam: (lastPage: FeedV2CursorResponse) => {
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

    const allRows = useMemo(() => {
      const allItems = data?.pages.flatMap(d => d.docs) || []

      // Remove duplicates based on _id
      const uniqueItems = allItems.filter(
        (item, index, array) =>
          item?._id && array.findIndex(i => i?._id === item._id) === index,
      )

      return uniqueItems
    }, [data])

    // --- Calculations needed for virtualizer ---
    const previousRowCount = useRef(allRows.length)
    useEffect(() => {
      previousRowCount.current = allRows.length
    }, [allRows.length])

    const totalRows = Math.ceil(allRows.length / GRID_COLUMN_COUNT)
    const virtualizerRowCount = useMemo(() => {
      const usePrevious = isFetchingNextPage && status !== 'pending'
      const currentRows = totalRows
      const rows = usePrevious
        ? Math.ceil(previousRowCount.current / GRID_COLUMN_COUNT)
        : currentRows
      return hasNextPage ? rows + 1 : rows
    }, [totalRows, hasNextPage, isFetchingNextPage, status, GRID_COLUMN_COUNT])
    // --- End calculations needed for virtualizer ---

    const virtualizer = useConditionalVirtualizer(
      {
        count: virtualizerRowCount,
        estimateSize: () => itemHeight + GRID_GAP,
        overscan: 10,
      },
      scrollRef,
    )

    // Expose getTopmostVisibleIndex via ref
    const getTopmostVisibleIndex = useCallback(() => {
      if (!virtualizer) {
        return null
      }

      const virtualItems = virtualizer.getVirtualItems()

      if (virtualItems.length === 0) {
        return null
      }

      // Get the first visible row's index and convert to item index
      const firstVisibleRow = virtualItems[0]
      if (firstVisibleRow) {
        return firstVisibleRow.index * GRID_COLUMN_COUNT
      }

      return null
    }, [virtualizer, GRID_COLUMN_COUNT])

    useImperativeHandle(ref, () => ({
      getTopmostVisibleIndex,
    }))

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

    // Ref to track if initial scroll has been attempted
    const initialScrollAttempted = useRef(false)

    // Effect to handle INITIAL scroll restoration using INDEX
    useEffect(() => {
      if (
        typeof initialScrollIndex !== 'number' ||
        !virtualizer ||
        initialScrollAttempted.current
      ) {
        return
      }

      const targetRow = Math.floor(initialScrollIndex / GRID_COLUMN_COUNT)

      if (targetRow >= totalRows) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        } else if (!hasNextPage) {
          initialScrollAttempted.current = true
          onScrollRestored?.()
        }
      } else {
        if (status === 'success' && !isFetchingNextPage) {
          initialScrollAttempted.current = true

          requestAnimationFrame(() => {
            setTimeout(() => {
              if (virtualizer.getVirtualItems().length > 0) {
                virtualizer.scrollToIndex(targetRow, {
                  align: 'start',
                  behavior: 'auto',
                })
                onScrollRestored?.()
              } else {
                onScrollRestored?.()
              }
            }, 100)
          })
        }
      }
    }, [
      initialScrollIndex,
      virtualizer,
      totalRows,
      hasNextPage,
      isFetchingNextPage,
      status,
      fetchNextPage,
      onScrollRestored,
      GRID_COLUMN_COUNT,
    ])

    const virtualItems = virtualizer.getVirtualItems()
    const lastItem = virtualItems[virtualItems.length - 1]
    const virtualItemsStringified = JSON.stringify(
      virtualizer.getVirtualItems(),
    )

    useEffect(() => {
      if (!lastItem || hasNextPage === undefined) {
        return
      }

      // Simplified fetch trigger logic like masonry
      const lastVisibleItemIndex = (lastItem.index + 1) * GRID_COLUMN_COUNT - 1
      if (
        lastVisibleItemIndex >= allRows.length - limit &&
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
      GRID_COLUMN_COUNT,
      limit,
    ])

    const renderRow = useCallback(
      (virtualItem: VirtualItem) => {
        const rowIndex = virtualItem.index
        const startIndex = rowIndex * GRID_COLUMN_COUNT

        const isLoaderRow = startIndex >= allRows.length

        return (
          <div
            key={`row_${rowIndex}`}
            ref={virtualizer.measureElement}
            data-index={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${itemHeight + GRID_GAP}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {isLoaderRow ? (
              <div className="flex items-center justify-center h-full">
                {hasNextPage ? <LoadingIndicator className="h-6 w-6" /> : null}
              </div>
            ) : (
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${GRID_COLUMN_COUNT}, 1fr)`,
                  gap: `${GRID_GAP}px`,
                  height: `${itemHeight}px`,
                  paddingBottom: `${GRID_GAP}px`,
                }}
              >
                {Array.from({ length: GRID_COLUMN_COUNT }, (_, colIndex) => {
                  const itemIndex = startIndex + colIndex
                  const item = allRows[itemIndex]

                  // Always return a div to maintain grid structure, but empty if no item
                  return (
                    <div key={`slot_${rowIndex}_${colIndex}`}>
                      {item ? render(item, onUpdate, itemIndex) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      },
      [
        GRID_COLUMN_COUNT,
        allRows,
        virtualizer,
        itemHeight,
        hasNextPage,
        render,
        onUpdate,
      ],
    )

    return (
      <MultiSelectProvider>
        <div
          key={`${apiEndpoint}_${queryKey.join(',')}`}
          data-test-id="grid-virtualizer-vertical"
          ref={gridWrapRef}
          className="flex pb-12 outline-none relative"
        >
          <div
            ref={innerRef}
            data-test-id="grid-virtualizer-vertical-content"
            style={{
              height: `${virtualizer.getTotalSize()}px`,
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

            {status === 'pending' && showSkeleton ? <GridSkeleton /> : null}

            {virtualizer
              .getVirtualItems()
              .map(virtualItem => renderRow(virtualItem))}

            {error ? (
              <div className="text-destructive">{error.message}</div>
            ) : null}
          </div>
        </div>
        <MultiSelectToolbar queryKey={queryKey} />
      </MultiSelectProvider>
    )
  },
)

GridVirtualizerVertical.displayName = 'GridVirtualizerVertical'

export default GridVirtualizerVertical

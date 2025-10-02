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

const MASONRY_GUTTER = 16
const DEFAULT_PAGE_LIMIT = 35

export interface BreakpointConfig {
  minWidth: 1920 | 1536 | 1280 | 1024 | 768 | 640 | 480 | 0
  columns: number
}

// Define the handle type
export interface MasonryVirtualizerHandle {
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
      <Skeleton className="h-full w-full aspect-square" />
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

const useConditionalVirtualizer = (
  options: {
    count: number
    estimateSize: () => number
    overscan: number
    lanes: number
    gap: number
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

const MasonryVirtualizerVertical = forwardRef<MasonryVirtualizerHandle, Props>(
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
    },
    ref,
  ) => {
    // Log prop value on render - REMOVED
    // console.log(
    //   '[MasonryVirtualizer] Rendering. initialScrollIndex prop:',
    //   initialScrollIndex,
    // )

    const { ref: masonryWrapRef, width: masonryWrapWidth } =
      useElementSize<HTMLDivElement>()
    const innerRef = useRef<HTMLDivElement>(null)
    // State to manage the scroll restoration process - REMOVED
    // const [isRestoringScroll, setIsRestoringScroll] = useState(false)
    // Add dummy state for forcing re-render - REMOVED
    // const [, setForceMeasureUpdate] = useState(false)

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
        // Create an array of boolean values based on breakpoint matches
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
          console.error(e)
        }
      },
      [queryKey, queryClient],
    )

    const MASONRY_COLUMN_COUNT = useMemo(() => {
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
      isFetching,
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
      const allItems = data?.pages.flatMap(d => d.docs) || []

      // Remove duplicates based on _id - using Map for better performance
      const uniqueMap = new Map()
      allItems.forEach(item => {
        if (item?._id && !uniqueMap.has(item._id)) {
          uniqueMap.set(item._id, item)
        }
      })

      return Array.from(uniqueMap.values())
    }, [data])

    // --- Calculations needed for virtualizer ---
    const previousRowCount = useRef(allRows.length)
    useEffect(() => {
      previousRowCount.current = allRows.length
    }, [allRows.length])
    const virtualizerCount = useMemo(() => {
      const usePrevious =
        isFetching && !isFetchingNextPage && status !== 'pending'
      const currentCount = allRows.length
      const count = usePrevious ? previousRowCount.current : currentCount
      return hasNextPage ? count + 1 : count
    }, [allRows.length, hasNextPage, isFetching, isFetchingNextPage, status])
    // --- End calculations needed for virtualizer ---

    // Declare virtualizer *before* the effect that uses it
    const virtualizer = useConditionalVirtualizer(
      {
        count: virtualizerCount,
        estimateSize: () => 156,
        overscan: limit * 2 + 10,
        lanes: MASONRY_COLUMN_COUNT,
        gap: MASONRY_GUTTER,
      },
      scrollRef,
    )

    // --- Expose getTopmostVisibleIndex via ref ---
    const getTopmostVisibleIndex = useCallback(() => {
      // console.log(
      //   '[getTopmostVisibleIndex] Called. scrollRef.current:',
      //   !!scrollRef?.current,
      //   'virtualizer:',
      //   !!virtualizer,
      // )
      if (!scrollRef?.current || !virtualizer) {
        // console.log(
        //   '[getTopmostVisibleIndex] Returning null because scrollRef or virtualizer is nullish.',
        // )
        return null
      }

      const scrollTop = scrollRef.current.scrollTop
      const virtualItems = virtualizer.getVirtualItems()
      // console.log(
      //   `[getTopmostVisibleIndex] scrollTop: ${scrollTop}, virtualItems count: ${virtualItems.length}`,
      // )

      if (virtualItems.length === 0) {
        // console.log(
        //   '[getTopmostVisibleIndex] Returning null because virtualItems is empty.',
        // )
        return null
      }

      // Revised Logic: Find the *last* item that starts *at or before* the current scrollTop.
      // This handles cases where we are scrolled near the bottom.
      let targetIndex = -1
      for (let i = virtualItems.length - 1; i >= 0; i--) {
        if (virtualItems[i].start <= scrollTop) {
          targetIndex = virtualItems[i].index
          break
        }
      }

      if (targetIndex === -1) {
        // Fallback: If no item starts before scrollTop (unlikely unless scrollTop is < first item's start),
        // default to the first item's index.
        targetIndex = virtualItems[0]?.index ?? null
        // console.log(
        //   `[getTopmostVisibleIndex] No item found starting <= scrollTop (${scrollTop}). Falling back to index ${targetIndex}`,
        // )
      }

      if (targetIndex === null) {
        // console.log('[getTopmostVisibleIndex] Returning null because fallback also failed.')
        return null
      }

      // console.log(
      //   `[getTopmostVisibleIndex] Found last item starting <= scrollTop. Index: ${targetIndex}`,
      // )
      return targetIndex
    }, [scrollRef, virtualizer])

    useImperativeHandle(ref, () => ({
      getTopmostVisibleIndex,
    }))
    // --- End expose function ---

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
      // console.log(
      //   `[MasonryVirtualizer] Restore Effect Check: initialScrollIndex=${initialScrollIndex}, status=${status}, allRows=${allRows.length}, hasNextPage=${hasNextPage}, isFetchingNextPage=${isFetchingNextPage}, initialScrollAttempted=${initialScrollAttempted.current}`,
      // )

      // Guard conditions: Only run if we have a target index, virtualizer, and haven't attempted restore yet.
      if (
        typeof initialScrollIndex !== 'number' ||
        !virtualizer ||
        initialScrollAttempted.current // If already attempted, stop.
      ) {
        return
      }

      // Check if the target index is beyond the currently loaded data
      if (initialScrollIndex >= allRows.length) {
        // console.log(
        //   `[MasonryVirtualizer] Target index ${initialScrollIndex} is beyond loaded data (${allRows.length}). Checking if fetch is possible.`,
        // )
        // If we can fetch more and aren't currently fetching, do it.
        if (hasNextPage && !isFetchingNextPage) {
          // console.log(
          //   '[MasonryVirtualizer] Triggering fetchNextPage to load more data for restoration.',
          // )
          fetchNextPage()
          // Effect will re-run when data or fetching state changes.
        } else if (!hasNextPage) {
          // Cannot fetch more, restoration to this index is impossible.
          // console.log(
          //   `[MasonryVirtualizer] Cannot fetch more pages. Restoration to index ${initialScrollIndex} failed.`,
          // )
          initialScrollAttempted.current = true // Mark as attempted (failed)
          onScrollRestored?.() // Signal completion (failure)
        } else {
          // Currently fetching, wait for it to complete.
          // console.log(
          //   '[MasonryVirtualizer] Waiting for ongoing fetchNextPage to complete for restoration.',
          // )
        }
      } else {
        // Data is available for the target index! Attempt scroll.
        // console.log(
        //   `[MasonryVirtualizer] Data for index ${initialScrollIndex} is loaded. Status: ${status}, isFetchingNextPage: ${isFetchingNextPage}. Attempting scroll.`,
        // )

        // Ensure the query is stable (success and not fetching more) before scrolling
        if (status === 'success' && !isFetchingNextPage) {
          // Mark as attempted *before* the async scroll logic
          initialScrollAttempted.current = true
          // console.log('[MasonryVirtualizer] Marking scroll as attempted.')

          requestAnimationFrame(() => {
            setTimeout(() => {
              if (virtualizer.getVirtualItems().length > 0) {
                // console.log(
                //   `[MasonryVirtualizer] Attempting scrollToIndex(${initialScrollIndex})`,
                // )
                virtualizer.scrollToIndex(initialScrollIndex, {
                  align: 'start',
                  behavior: 'auto',
                })
                // Call restored callback after attempting scroll
                // console.log(
                //   '[MasonryVirtualizer] scrollToIndex attempted, calling onScrollRestored.',
                // )
                onScrollRestored?.()
              } else {
                // console.warn(
                //   '[MasonryVirtualizer] Scroll attempt condition failed: virtualItems empty after data load and timeout.',
                // )
                // Still call onScrollRestored to clear parent state
                onScrollRestored?.()
              }
            }, 100) // Keep a small delay
          })
        } else {
          // Query data might be sufficient, but query status is not ready for scroll.
          // console.log(
          //   '[MasonryVirtualizer] Data range sufficient, but query status not ready for scroll attempt. Waiting.',
          // )
        }
      }
    }, [
      initialScrollIndex,
      virtualizer,
      allRows.length,
      hasNextPage,
      isFetchingNextPage,
      status,
      fetchNextPage,
      onScrollRestored,
      scrollRef,
      // Removed isRestoringScroll, forceMeasureUpdate
    ])

    const virtualItems = virtualizer.getVirtualItems()
    const lastItem = virtualItems[virtualItems.length - 1]

    useEffect(() => {
      if (!lastItem || hasNextPage === undefined || isFetchingNextPage) return

      if (lastItem.index >= allRows.length - 20) {
        fetchNextPage()
      }
    }, [
      lastItem,
      allRows.length,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
    ])

    const renderItem = useCallback(
      (virtualItem: VirtualItem) => {
        const item = allRows[virtualItem.index]
        const isLoaderRow = virtualItem.index >= allRows.length

        return (
          <div
            key={item?._id || `virtual_${virtualItem.index}`}
            ref={virtualizer.measureElement}
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
              <div className="flex items-center justify-center h-32">
                {hasNextPage ? <LoadingIndicator className="h-6 w-6" /> : null}
              </div>
            ) : item ? (
              render(item, onUpdate, virtualItem.index)
            ) : (
              // Always render skeleton to maintain layout - same as creations feed
              <div className="relative w-full aspect-square">
                <Skeleton className="w-full h-full rounded-md" />
              </div>
            )}
          </div>
        )
      },
      [onUpdate, render, allRows, hasNextPage, virtualizer, columnWidth],
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
            ref={innerRef}
            data-test-id="masonry-virtualizer-vertical-content"
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
            // className=" max-h-96"
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

            {(status === 'pending' || (isFetching && allRows.length === 0)) &&
            showSkeleton ? (
              <MasonrySkeleton />
            ) : null}

            {virtualizer
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
  },
)

MasonryVirtualizerVertical.displayName = 'MasonryVirtualizerVertical'

export default MasonryVirtualizerVertical

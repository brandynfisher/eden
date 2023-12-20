import TimelineItem from '@/components/Creation/CreationInterface/Timeline/TimelineItem'
import LoadingIndicator from '@/components/LoadingIndicator'
import { fetcher } from '@/lib/fetcher'
import { PaginatedResponse, Task } from '@edenlabs/eden-sdk'
import { useElementSize } from '@mantine/hooks'
import { Alert, Card, Divider, Empty } from 'antd'
import {
  UseMasonryOptions,
  useInfiniteLoader,
  useMasonry,
  usePositioner,
  useResizeObserver,
} from 'masonic'
import { useScroller } from 'mini-virtual-list'
import React, {
  FC,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import useSWRInfinite from 'swr/infinite'

const TimelineListItem = ({ data, index }: { data: Task; index: number }) => {
  return (
    <div className="result-preview mb-2 md:mb-4 relative w-full flex flex-col rounded-lg border-0 md:items-center">
      {index === 0 &&
      (data.status === 'pending' || data.status === 'running') ? (
        <Alert
          className={`w-full h-fit flex justify-center items-center md:max-w-[640px] 3xl:max-w-[840px] mb-4 px-4 py-2 text-gray-500`}
          description="Your tasks are being processed and will appear here and on your profile once complete. It is safe to close this window."
        />
      ) : null}
      <Card
        className={`w-full h-fit flex justify-center items-center md:max-w-[640px] 3xl:max-w-[840px] compact-card`}
      >
        <TimelineItem task={data} listIndex={index} />
      </Card>
      <Divider className="mt-2 mb-0 md:hidden" />
    </div>
  )
}

const useTasksPaginated = ({
  type,
  limit,
}: {
  type: 'concepts' | 'creations'
  limit: number
}) => {
  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: PaginatedResponse<Task[]>,
    ): string | null => {
      if (
        (pageIndex > 0 && !previousPageData) ||
        (previousPageData && !previousPageData.hasNextPage)
      ) {
        // console.log('reached the END')
        return null
      }

      // console.log('getKey', {pageIndex, previousPageData})
      return `/api/tasks?type=${type}&status=running,starting,pending,completed,failed&page=${
        pageIndex + 1
      }&limit=${limit}`
    },
    [type, limit],
  )

  const { data, size, setSize, mutate, isValidating, isLoading, error } =
    useSWRInfinite(getKey, fetcher, { refreshInterval: 5000 })

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

      const { hasNextPage: dataHasNextPage } = data[0]

      if (dataHasNextPage) {
        setSize(prevSize => {
          // console.log('maybeLoadNextPage', {size: prevSize + 1, isLoading, isLoadingMore, isValidating, docsLength: docs.length})
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
    hasNextPage: data ? !!data[0]?.hasNextPage : false,
    totalItems: totalItems,
    items: data ? ([] as Task[]).concat(...docs) : [],
    size,
    setSize,
    mutate,
    isEmpty,
    isLoading,
    isLoadingMore,
    maybeLoadMore,
    error,
  }
}

const MasonryHookWrap: FC<UseMasonryOptions<Task>> = props => {
  return <div>{useMasonry(props)}</div>
}

const TimelineList = ({
  type,
  innerRef,
}: {
  type: 'concepts' | 'creations'
  innerRef: RefObject<HTMLDivElement>
}) => {
  const limit = 10
  const [tasksDoneCount, setTasksDoneCount] = useState(0)

  const {
    items,
    // mutate,
    // size,
    // setSize,
    // totalItems,
    // hasNextPage,
    maybeLoadMore,
    isEmpty,
    isLoading,
    isLoadingMore,
    error,
  } = useTasksPaginated({ type, limit })

  const maybeLoadMoreTasks = useInfiniteLoader(maybeLoadMore, {
    isItemLoaded: (index, items) => {
      // console.log('isItemLoaded', index, items[index])
      return !!items[index]
    },
    threshold: 2,
    minimumBatchSize: 10,
  })

  const {
    ref: containerRef,
    width: containerWidth,
    height: containerHeight,
  } = useElementSize()

  const { scrollTop, isScrolling } = useScroller(containerRef, { offset: 30 })

  const positioner = usePositioner(
    {
      width: containerWidth,
      rowGutter: 0,
      maxColumnCount: 1,
      columnCount: 1,
    },
    [tasksDoneCount, items.length, containerWidth],
  )

  const resizeObserver = useResizeObserver(positioner)

  useEffect(() => {
    if (items && items.length && typeof items[0] !== 'undefined') {
      const counts = items.filter(
        item => item.status === 'completed' || item.status === 'failed',
      ).length
      setTasksDoneCount(counts)
    }
  }, [items])

  return (
    <div
      className="flex flex-col max-h-[calc(100vh_-_72px)] pb-[105px] w-full overflow-hidden md:pb-0"
      ref={innerRef}
    >
      {isLoading ? <LoadingIndicator /> : null}
      {isEmpty && !items.length && (
        <div className="flex flex-col items-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="flex flex-col items-center">
                <div className="mb-4">Nothing here yet.</div>
              </div>
            }
          />
        </div>
      )}
      {items && items.length && typeof items[0] !== 'undefined' ? (
        <div
          ref={containerRef}
          className="h-[calc(100%_-_72px)] md:h-full mx-auto mb-0 w-full pr-3 overflow-y-scroll overflow-x-hidden"
        >
          <MasonryHookWrap
            positioner={positioner}
            resizeObserver={resizeObserver}
            items={items}
            itemHeightEstimate={500}
            itemKey={(item, _index) => item?._id ?? _index}
            height={containerHeight}
            scrollTop={scrollTop}
            isScrolling={isScrolling}
            overscanBy={3}
            render={TimelineListItem}
            onRender={maybeLoadMoreTasks}
          />
          {isLoadingMore ? (
            <div className="my-4 py-2">
              <LoadingIndicator />
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? <div>{JSON.stringify(error)}</div> : null}
    </div>
  )
}

export default TimelineList

import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import {
  OrderByDefaultParam,
  OrderByParam,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import { PaginatedFeedQuery, useFeedPaginated } from '@/hooks/useFeedPaginated'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import { useElementSize } from '@mantine/hooks'
import { Empty } from 'antd'
import {
  UseMasonryOptions,
  useInfiniteLoader,
  useMasonry,
  usePositioner,
  useResizeObserver,
} from 'masonic'
import { useScroller } from 'mini-virtual-list'
import React, { FC, useCallback, useState } from 'react'

const MasonryHookWrap: FC<UseMasonryOptions<Concept | Creation>> = props => {
  // console.log(props)
  return <div>{useMasonry(props)}</div>
}

const MasonryInfiniteScrollable = ({
  type,
  ItemComponent,
  query,
  hasSort,
  onCardClick,
  hover,
}: {
  type: 'creations' | 'concepts'
  ItemComponent: typeof CreationCard | typeof ConceptCard
  query?: PaginatedFeedQuery
  hasSort?: OrderByParam[]
  onCardClick?: (item: Concept | Creation) => void
  hover?: boolean
}) => {
  const [orderBy /*setOrderBy*/] = useState<OrderByParam>(
    hasSort ? hasSort[0] : OrderByDefaultParam,
  )

  const {
    items,
    maybeLoadMore: maybeLoadNextPage,
    // setSize,
    // size,
    isEmpty,
    isLoading,
  } = useFeedPaginated(type, query, orderBy)

  const maybeLoadMore = useInfiniteLoader(maybeLoadNextPage, {
    isItemLoaded: (index, items) => {
      return !!items[index]
    },
    minimumBatchSize: 25,
    threshold: 50,
  })

  const {
    ref: containerRef,
    width: containerWidth,
    height: containerHeight,
  } = useElementSize()
  const { scrollTop, isScrolling } = useScroller(containerRef, { offset: 30 })
  // console.log({ scrollTop, isScrolling, containerWidth, containerHeight })

  const positioner = usePositioner(
    {
      width: containerWidth,
      columnGutter: 20,
      rowGutter: 20,
      maxColumnCount: 4,
    },
    [items.length],
  )

  const resizeObserver = useResizeObserver(positioner)

  const CardWithClick = useCallback(
    (props: { data: Creation & Concept; index: number }) => (
      <ItemComponent
        key={props.data._id}
        index={props.index}
        data={props.data}
        className={
          hover
            ? `hover:outline hover:outline-2 rounded-lg hover:outline-blue-500`
            : ''
        }
        //@ts-ignore
        onClick={onCardClick}
      />
    ),
    [hover, ItemComponent, onCardClick],
  )

  return (
    <div>
      {/*<div className="flex flex-col max-h-[calc(100vh_-_190px)] w-full overflow-hidden">*/}
      <div className="flex flex-col w-full">
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
        {items.length && typeof items[0] === 'undefined' ? (
          <div>error fetching list</div>
        ) : (
          <div
            ref={containerRef}
            // className="h-[calc(100vh_-_190px)] mx-auto mb-0 w-full pr-3 overflow-y-auto overflow-x-hidden"
            className="mx-auto mb-0 w-full pr-3"
          >
            <MasonryHookWrap
              positioner={positioner}
              resizeObserver={resizeObserver}
              items={items}
              itemHeightEstimate={207}
              height={containerHeight}
              scrollTop={scrollTop}
              isScrolling={isScrolling}
              overscanBy={3}
              //@ts-ignore
              render={CardWithClick}
              onRender={maybeLoadMore}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default MasonryInfiniteScrollable

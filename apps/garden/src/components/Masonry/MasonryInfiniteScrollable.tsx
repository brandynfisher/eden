import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import { PaginatedFeedQuery, useFeedPaginated } from '@/hooks/useFeedPaginated'
import { ItemType } from '@/providers/ModalProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import { useElementSize, useViewportSize } from '@mantine/hooks'
import { Empty } from 'antd'
import {
  UseMasonryOptions,
  useInfiniteLoader,
  useMasonry,
  usePositioner,
  useResizeObserver,
} from 'masonic'
import { useScroller } from 'mini-virtual-list'
import React, { FC, useCallback } from 'react'

const MasonryHookWrap: FC<UseMasonryOptions<Concept | Creation>> = props => {
  // console.log(props)
  return <div>{useMasonry(props)}</div>
}

const MasonryInfiniteScrollable = ({
  itemType,
  ItemComponent,
  query,
  orderBy,
  onCardClick,
  hover,
  modalContainerRef,
  modalContainerHeight,
}: {
  itemType: ItemType
  ItemComponent: typeof CreationCard | typeof ConceptCard
  query?: PaginatedFeedQuery
  orderBy?: OrderByParam
  onCardClick?: (item: Concept | Creation) => void
  hover?: boolean
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
}) => {
  const {
    items,
    maybeLoadMore: maybeLoadNextPage,
    // setSize,
    // size,
    isEmpty,
    isLoading,
    isLoadingMore,
    // hasNextPage
  } = useFeedPaginated(itemType, query, orderBy)

  const maybeLoadMore = useInfiniteLoader(maybeLoadNextPage, {
    isItemLoaded: (index, items) => {
      return !!items[index]
    },
    minimumBatchSize: 25,
    threshold: 50,
  })

  // observing inner container dimensions
  const { ref: containerRef, width: containerWidth } = useElementSize()
  // if this lives in a modal, we need to observe the modal reference for dimensions and scroll instead of the document body
  const { scrollTop, isScrolling } = useScroller(
    modalContainerRef
      ? modalContainerRef
      : typeof window !== 'undefined'
      ? window
      : containerRef,
    { offset: 30 },
  )
  const { height: windowHeight } = useViewportSize()

  const positioner = usePositioner(
    {
      width: containerWidth,
      columnGutter: itemType === 'creation' ? 8 : 20,
      rowGutter: itemType === 'creation' ? 8 : 20,
      maxColumnCount: itemType === 'creation' ? 5 : 4,
    },
    [query?.name, query?.conceptId, query?.userId, containerWidth],
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
        onClick={() => onCardClick(props.data)}
      />
    ),
    [hover],
  )

  return (
    <>
      <div className="flex flex-col w-full">
        {isLoading ? (
          <div>
            <LoadingIndicator />{' '}
          </div>
        ) : null}
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
            className="mx-auto mb-0 w-full min-h-[237px]"
          >
            {containerWidth ? (
              <MasonryHookWrap
                positioner={positioner}
                resizeObserver={resizeObserver}
                items={items}
                itemHeightEstimate={207}
                height={
                  modalContainerHeight ? modalContainerHeight : windowHeight
                }
                scrollTop={scrollTop}
                isScrolling={isScrolling}
                overscanBy={3}
                //@ts-ignore
                render={CardWithClick}
                onRender={maybeLoadMore}
              />
            ) : null}
          </div>
        )}
      </div>
      {isLoadingMore ? (
        <div className="my-4 py-2">
          <LoadingIndicator />
        </div>
      ) : null}
    </>
  )
}

export default MasonryInfiniteScrollable

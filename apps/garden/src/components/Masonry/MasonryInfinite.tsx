import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import { PaginatedFeedQuery, useFeedPaginated } from '@/hooks/useFeedPaginated'
import { MasonryContext } from '@/providers/MasonryProvider'
import {
  ItemType,
  MODAL_TYPES,
  useModalContext,
} from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import {
  useResizeObserver as useResizeObserverMantine,
  useViewportSize,
} from '@mantine/hooks'
import { Button, Empty } from 'antd'
import {
  MasonryScroller,
  useContainerPosition,
  useInfiniteLoader,
  usePositioner,
  useResizeObserver,
} from 'masonic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useRef } from 'react'

const MasonryInfinite = ({
  itemType,
  ItemComponent,
  query,
  orderBy,
}: {
  itemType: ItemType
  ItemComponent: typeof CreationCard | typeof ConceptCard
  query?: PaginatedFeedQuery
  orderBy: OrderByParam
}) => {
  const containerRef = useRef(null)
  const router = useRouter()

  const { showModal } = useModalContext()
  const { setItems, setCurrentIndex } = useContext(MasonryContext)
  const { isAuthenticated, settings, userId } = useContext(UserContext)
  const isAuthenticatedUser =
    isAuthenticated && query && query.userId && query.userId === userId

  const {
    items,
    // refetchFeed,
    maybeLoadMore: maybeLoadNextPage,
    // size,
    // setSize,
    isEmpty,
    isLoadingMore,
  } = useFeedPaginated(itemType, query, orderBy)

  const maybeLoadMore = useInfiniteLoader(maybeLoadNextPage, {
    isItemLoaded: (index, items) => {
      return !!items[index]
    },
    minimumBatchSize: 25,
    threshold: 50,
  })

  const [ref, rect] = useResizeObserverMantine()
  const { width: windowWidth, height: windowHeight } = useViewportSize()
  const { offset, width } = useContainerPosition(containerRef, [
    windowWidth,
    windowHeight,
    rect,
  ])

  const positioner = usePositioner(
    {
      width: width || windowWidth,
      columnGutter: itemType === 'creation' ? 8 : 20,
      rowGutter:
        windowWidth && windowWidth < 768 ? 0 : itemType === 'creation' ? 8 : 20,
      columnCount:
        windowWidth && windowWidth < 768
          ? 1
          : settings?.maxGridCols.value && settings.maxGridCols.value !== 'auto'
          ? settings.maxGridCols.value
          : undefined,
      maxColumnCount:
        windowWidth && windowWidth < 768
          ? 1
          : settings?.maxGridCols.value && settings.maxGridCols.value !== 'auto'
          ? settings.maxGridCols.value
          : windowWidth && windowWidth > 1920
          ? 6
          : windowWidth && windowWidth > 1440
          ? 5
          : settings?.maxGridCols.params.initialValue,
    },
    [width, query?.userId],
  )
  const resizeObserver = useResizeObserver(positioner)
  useEffect(() => {
    setItems(items)
  }, [items.length])

  const handleCardClick = useCallback((index: number) => {
    //@todo: move this to CreationMasonry (similarMasonry, as static)
    // if (disableArrowNav) {
    //   showModal(MODAL_TYPES.CREATION_DETAIL_STATIC_MODAL, {
    //     creation,
    //     loadSimilar: true,
    //     usesUrl: true,
    //     originPageUrl: router.asPath,
    //   })
    //
    //   return
    // }
    // setItems(items)

    setCurrentIndex(index)

    showModal(MODAL_TYPES.DETAIL_MODAL, {
      itemType: itemType,
      usesUrl: true,
      originPageUrl: router.asPath,
      maybeLoadMoreFn: (
        currentIndex: number,
        currentItems: Creation[] | Concept[],
      ) => {
        if (currentIndex === currentItems.length - 1) {
          maybeLoadMore(currentIndex, currentIndex + 10, currentItems)
        }
        // console.log(currentItems.length)
      },
    })
  }, [])

  const CardWithClick = useCallback(
    (props: { data: Creation & Concept; index: number }) => (
      <ItemComponent
        key={props.data._id}
        index={props.index}
        data={props.data}
        onClick={() => handleCardClick(props.index)}
      />
    ),
    [],
  )

  return (
    <div ref={ref}>
      {items.length && typeof items[0] === 'undefined' ? (
        <div>error fetching list</div>
      ) : (
        <>
          {items.length > 0 && (
            <MasonryScroller
              style={{ outline: 'none' }}
              key={orderBy.field}
              positioner={positioner}
              resizeObserver={resizeObserver}
              containerRef={containerRef}
              items={items}
              height={windowHeight}
              offset={offset}
              overscanBy={3}
              itemHeightEstimate={300}
              onRender={maybeLoadMore}
              itemKey={(item, _index) => item?._id ?? _index}
              //@ts-ignore
              render={CardWithClick}
            />
          )}
        </>
      )}

      {isLoadingMore ? (
        <div className="my-4 py-2">
          <LoadingIndicator />
        </div>
      ) : null}

      {isEmpty && !items.length && (
        <div className="flex flex-col items-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="flex flex-col items-center">
                <div className="mb-4">Nothing here yet.</div>

                {isAuthenticatedUser && (
                  <Link href="/create/creations">
                    <Button
                      type="dashed"
                      className="font-mono flex items-center text-gray-400"
                    >
                      <div>Create more</div>
                    </Button>
                  </Link>
                )}
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}

export default MasonryInfinite

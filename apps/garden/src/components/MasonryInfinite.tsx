import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import OrderByButtons, {
  OrderByDefaultParam,
  OrderByParam,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import { PaginatedFeedQuery, useFeedPaginated } from '@/hooks/useFeedPaginated'
import { MasonryContext } from '@/providers/MasonryProvider'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import { useViewportSize } from '@mantine/hooks'
import { useResizeObserver as useResizeObserverMantine } from '@mantine/hooks'
import { Button, Empty } from 'antd'
import { useInfiniteLoader } from 'masonic'
import {
  MasonryScroller,
  useContainerPosition,
  usePositioner,
  useResizeObserver,
} from 'masonic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const MasonryInfinite = ({
  type,
  ItemComponent,
  query,
  hasSort,
}: {
  type: 'creations' | 'concepts'
  ItemComponent: typeof CreationCard | typeof ConceptCard
  query?: PaginatedFeedQuery
  hasSort?: OrderByParam[]
}) => {
  const containerRef = useRef(null)
  const [key, setKey] = useState(0)
  const router = useRouter()

  const { showModal } = useModalContext()
  const { setItems, setCurrentIndex } = useContext(MasonryContext)
  const { isAuthenticated, settings, userId } = useContext(UserContext)
  const isAuthenticatedUser =
    isAuthenticated && query && query.userId && query.userId === userId

  const [orderBy, setOrderBy] = useState<OrderByParam>(
    hasSort ? hasSort[0] : OrderByDefaultParam,
  )

  const {
    items,
    // refetchFeed,
    maybeLoadMore: maybeLoadNextPage,
    // size,
    setSize,
    isEmpty,
    // hasNextPage,
    isLoading,
  } = useFeedPaginated(type, query, orderBy)

  const maybeLoadMore = useInfiniteLoader(maybeLoadNextPage, {
    isItemLoaded: (index, items) => {
      return !!items[index]
    },
    minimumBatchSize: 25,
    threshold: 50,
  })

  const handleOrderChange = (newOrderBy: OrderByParam) => {
    if (newOrderBy.field !== orderBy?.field) {
      setOrderBy(newOrderBy)
      setSize(1)
      setKey(key + 1)
    }
  }

  const [ref, rect] = useResizeObserverMantine()
  const { width: windowWidth, height: windowHeight } = useViewportSize()
  const { offset, width } = useContainerPosition(containerRef, [
    windowWidth,
    windowHeight,
    rect,
  ])

  const positioner = usePositioner(
    {
      width,
      columnGutter: 8,
      rowGutter: windowWidth && windowWidth < 768 ? 0 : 8,
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
    [orderBy, width, query?.userId],
  )
  const resizeObserver = useResizeObserver(positioner)
  useEffect(() => {
    setItems(items)
  }, [items.length, orderBy, query, type])

  useEffect(() => {
    document.body.classList.add('force-scroll-y')

    return () => {
      document.body.classList.remove('force-scroll-y')
    }
  }, [])

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

    showModal(MODAL_TYPES.CREATION_DETAIL_MODAL_V2, {
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
      {hasSort && (
        <OrderByButtons
          params={hasSort}
          onOrderChange={item => handleOrderChange(item)}
        />
      )}
      {isLoading && !items.length ? <LoadingIndicator /> : null}

      {items.length && typeof items[0] === 'undefined' ? (
        <div>error fetching list</div>
      ) : (
        <>
          {items.length > 0 && (
            <MasonryScroller
              style={{ outline: 'none' }}
              key={key}
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

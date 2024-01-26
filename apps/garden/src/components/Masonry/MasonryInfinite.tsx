import { CardData } from '@/components/Card/Card'
import CharacterFeedCard from '@/components/Characters/CharacterFeedCard'
import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import CreatorCard from '@/components/Creators/CreatorCard'
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
import { Character, Concept, Creation, Creator } from '@edenlabs/eden-sdk'
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
  query,
  orderBy,
  emptyResultHandler,
}: {
  itemType: ItemType
  query?: PaginatedFeedQuery
  orderBy: OrderByParam
  emptyResultHandler?: (orderBy: OrderByParam) => void
}) => {
  const containerRef = useRef(null)
  const router = useRouter()

  const { showModal } = useModalContext()
  const { setItems, setCurrentIndex } = useContext(MasonryContext)
  const { isAuthenticated, settings, userId } = useContext(UserContext)
  const isAuthenticatedUser =
    isAuthenticated && query && query.userId && query.userId === userId
  const masonryKey = `${itemType}_${orderBy.field}`

  const {
    items,
    // refetchFeed,
    maybeLoadMore: maybeLoadNextPage,
    // size,
    // setSize,
    isEmpty,
    isLoadingMore,
  } = useFeedPaginated(itemType, query, orderBy)

  const [ref, rect] = useResizeObserverMantine()
  const { width: windowWidth, height: windowHeight } = useViewportSize()
  const { offset, width } = useContainerPosition(containerRef, [
    windowWidth,
    windowHeight,
    rect,
  ])

  const maybeLoadMore = useInfiniteLoader(maybeLoadNextPage, {
    isItemLoaded: (index, items) => {
      return !!items[index]
    },
    minimumBatchSize: 50,
    threshold: windowWidth && windowWidth < 768 ? 25 : 75,
  })

  const positioner = usePositioner(
    {
      width: width || windowWidth,
      columnGutter: itemType === 'creation' ? 8 : 20,
      rowGutter: itemType === 'creation' ? 8 : 20,
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
    [width, query?.userId, query?.name],
  )
  const resizeObserver = useResizeObserver(positioner)

  useEffect(() => {
    setItems(masonryKey, items)
  }, [masonryKey, items.length])

  const handleCardClick = useCallback(
    (index: number) => {
      //@todo: move this to CreationMasonry (similarMasonry, as static)
      // if (disableArrowNav) {
      //   showModal(MODAL_TYPES.DETAIL_STATIC_MODAL, {
      //     creation,
      //     loadSimilar: true,
      //     usesUrl: true,
      //     originPageUrl: router.asPath,
      //   })
      //
      //   return
      // }
      // setItems(items)

      setCurrentIndex(masonryKey, index)

      showModal(MODAL_TYPES.DETAIL_MODAL, {
        itemType: itemType,
        usesUrl: true,
        originPageUrl: router.asPath,
        parentMasonryKey: masonryKey,
        maybeLoadMoreFn: (
          currentIndex: number,
          currentItems: Creation[] | Concept[] | Character[] | Creator[],
        ) => {
          if (currentIndex === currentItems.length - 1) {
            maybeLoadMore(currentIndex, currentIndex + 10, currentItems)
          }
          //console.log(currentItems.length)
        },
      })
    },
    [masonryKey],
  )

  const CardWithClick = useCallback(
    (props: { data: CardData; index: number }) => {
      if (itemType === 'creator') {
        return (
          <CreatorCard
            key={props.data._id}
            index={props.index}
            data={props.data as Creator}
            onClick={() => handleCardClick(props.index)}
          />
        )
      }

      if (itemType === 'creation') {
        return (
          <CreationCard
            key={props.data._id}
            index={props.index}
            data={props.data as CardData}
            onClick={() => handleCardClick(props.index)}
          />
        )
      }

      if (itemType === 'concept') {
        return (
          <ConceptCard
            key={props.data._id}
            index={props.index}
            data={props.data as CardData}
            onClick={() => handleCardClick(props.index)}
          />
        )
      }

      if (itemType === 'character') {
        return (
          <CharacterFeedCard
            key={props.data._id}
            index={props.index}
            data={props.data as CardData}
            onClick={() => handleCardClick(props.index)}
          />
        )
      }
    },
    [],
  )

  useEffect(() => {
    if (isEmpty && !items.length && emptyResultHandler) {
      emptyResultHandler(orderBy)
    }
  }, [orderBy, isEmpty, items.length, emptyResultHandler])

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
              overscanBy={2}
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

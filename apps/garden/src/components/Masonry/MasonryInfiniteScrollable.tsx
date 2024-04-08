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
import { useRouter } from 'next/router'
import React, { FC, useCallback, useContext, useEffect } from 'react'

const MasonryHookWrap: FC<UseMasonryOptions<Concept | Creation>> = props => {
  return <div>{useMasonry(props)}</div>
}

const MasonryInfiniteScrollable = ({
  itemType,
  // ItemComponent,
  query,
  orderBy,
  onCardClick,
  hover,
  modalContainerRef,
  modalContainerHeight,
  masonryKeySuffix,
}: {
  itemType: ItemType
  // ItemComponent: typeof CreationCard | typeof ConceptCard
  query?: PaginatedFeedQuery
  orderBy?: OrderByParam
  onCardClick?: (item: CardData) => void
  hover?: boolean
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
  masonryKeySuffix?: string
}) => {
  const router = useRouter()
  const { showModal } = useModalContext()
  const { setItems, setCurrentIndex } = useContext(MasonryContext)
  const masonryKey = `scrollable_${itemType}_${orderBy?.field}_${masonryKeySuffix}`

  const {
    items,
    maybeLoadMore: maybeLoadNextPage,
    isEmpty,
    isLoading,
    isLoadingMore,
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

  const { settings } = useContext(UserContext)
  const positioner = usePositioner(
    {
      width: containerWidth,
      columnGutter: itemType === 'creation' ? 8 : 20,
      rowGutter: itemType === 'creation' ? 8 : 20,
      maxColumnCount:
        containerWidth && containerWidth < 768
          ? 1
          : settings?.maxGridCols.value && settings.maxGridCols.value !== 'auto'
          ? settings.maxGridCols.value
          : containerWidth && containerWidth > 1920
          ? itemType === 'concept'
            ? 5
            : 6
          : containerWidth && containerWidth > 1440
          ? itemType === 'concept'
            ? 4
            : 5
          : itemType === 'concept'
          ? 3
          : settings?.maxGridCols.params.initialValue,
    },
    [query?.name, query?.conceptId, query?.userId, containerWidth],
  )

  const resizeObserver = useResizeObserver(positioner)

  useEffect(() => {
    // console.log('SETTING ITEMS', masonryKey, items.length)
    setItems(masonryKey, items)
  }, [masonryKey, items.length])

  const handleCardClick = useCallback(
    (index: number) => {
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
          // console.log(currentItems.length)
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
            onClick={() =>
              onCardClick
                ? onCardClick(props.data)
                : handleCardClick(props.index)
            }
          />
        )
      }

      if (itemType === 'creation') {
        return (
          <CreationCard
            key={props.data._id}
            index={props.index}
            data={props.data as CardData}
            onClick={() =>
              onCardClick
                ? onCardClick(props.data)
                : handleCardClick(props.index)
            }
          />
        )
      }

      if (itemType === 'concept') {
        return (
          <ConceptCard
            key={props.data._id}
            index={props.index}
            data={props.data as CardData}
            onClick={() =>
              onCardClick
                ? onCardClick(props.data)
                : handleCardClick(props.index)
            }
            className={
              hover
                ? `hover:outline hover:outline-2 rounded-lg hover:outline-blue-500`
                : ''
            }
          />
        )
      }

      if (itemType === 'character') {
        return (
          <CharacterFeedCard
            key={props.data._id}
            index={props.index}
            data={props.data as CardData}
            onClick={() =>
              onCardClick
                ? onCardClick(props.data)
                : handleCardClick(props.index)
            }
            className={
              hover
                ? `hover:outline hover:outline-2 rounded-lg hover:outline-blue-500`
                : ''
            }
          />
        )
      }
    },
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
                key={masonryKey}
                positioner={positioner}
                resizeObserver={resizeObserver}
                items={items}
                // items={dummyResponse.docs}
                itemHeightEstimate={207}
                height={
                  modalContainerHeight ? modalContainerHeight : windowHeight
                }
                scrollTop={
                  modalContainerHeight
                    ? scrollTop - modalContainerHeight
                    : scrollTop
                }
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

import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import OrderByButtons, {
  OrderByDefaultParam,
  OrderByParam,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import MasonryInfiniteScrollable from '@/components/Masonry/MasonryInfiniteScrollable'
// import MasonryInfinite from '@/components/Masonry/MasonryInfinite'
import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import {
  ItemType,
  MODAL_TYPES,
  useModalContext,
} from '@/providers/ModalProvider'
import { Creation } from '@edenlabs/eden-sdk'
// import { ItemType } from '@/providers/ModalProvider'
import React, { useCallback, useEffect, useState } from 'react'

const MasonryInfiniteScrollableContainer = ({
  itemType,
  filters,
  query,
  modalContainerRef,
  modalContainerHeight,
}: {
  itemType: ItemType
  filters?: OrderByParam[]
  query?: PaginatedFeedQuery
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
}) => {
  const { showModal } = useModalContext()

  const openDetailModal = async (creation: Creation) => {
    showModal(MODAL_TYPES.CREATION_DETAIL_STATIC_MODAL, {
      creation: creation ? creation : undefined,
      usesUrl: true,
    })
  }

  const [fetchStartDate, setFetchStartDate] = useState<string | undefined>()
  const [orderBy, setOrderBy] = useState<OrderByParam>(
    filters ? filters[0] : OrderByDefaultParam,
  )
  const [renderCount, setRenderCount] = useState(0)
  const [key, setKey] = useState(
    `${filters ? filters[0].field : OrderByDefaultParam.field}_${0}`,
  )
  const handleOrderChange = useCallback(
    (newOrderBy: OrderByParam) => {
      if (newOrderBy.field !== orderBy?.field) {
        // console.log(newOrderBy)
        setOrderBy(newOrderBy)
        setKey(`${newOrderBy.field}_${renderCount}`)
      }
    },
    [renderCount],
  )

  useEffect(() => {
    setFetchStartDate(new Date().toISOString())
    setRenderCount(prevState => prevState + 1)
  }, [orderBy])

  if (!fetchStartDate) {
    return <LoadingIndicator />
  }

  return (
    <>
      {filters ? (
        <OrderByButtons
          params={filters}
          initialParam={filters[0]}
          onOrderChange={item => handleOrderChange(item)}
        />
      ) : null}

      <MasonryInfiniteScrollable
        key={key}
        itemType={itemType ? itemType : 'creation'}
        ItemComponent={itemType === 'creation' ? CreationCard : ConceptCard}
        query={{ ...query, dateCutOff: fetchStartDate }}
        orderBy={orderBy}
        onCardClick={creation => openDetailModal(creation as Creation)}
        modalContainerRef={modalContainerRef}
        modalContainerHeight={modalContainerHeight}
      />
    </>
  )
}

export default MasonryInfiniteScrollableContainer

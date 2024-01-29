import CardImage from '@/components/Card/CardImage'
import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import { ChannelSettings } from '@/components/Modals/ChannelDetailsModal'
import { FeedRouteQueryParams } from '@/hooks/useFeedPaginated'
import {
  ItemType,
  MODAL_TYPES,
  useModalContext,
} from '@/providers/ModalProvider'
import React from 'react'

const ChannelCard = ({
  itemType,
  title,
  orderBy,
  query,
  settings,
}: {
  itemType: ItemType
  title?: string
  orderBy: OrderByParam
  query?: FeedRouteQueryParams
  settings: ChannelSettings
}) => {
  const { showModal } = useModalContext()
  const onChannelCardClick = () => {
    showModal(MODAL_TYPES.CHANNEL_DETAIL_MODAL, {
      usesUrl: false,
      title,
      itemType,
      orderBy,
      query,
      settings,
    })
  }

  return (
    <div
      className={`
        flex-shrink-0
        border
        border-solid 
        rounded-lg 
        border-gray-300
        dark:border-gray-600 
        hover:!border-blue-500 
        cursor-pointer 
        transition-colors
        duration-200 
        transform
        overflow-hidden`}
    >
      <div className="cursor-pointer" onClick={onChannelCardClick}>
        <div className="text-center bg-gray-200 dark:bg-gray-900 py-1">
          <div>{title ? title : orderBy.label}</div>
        </div>
        <div>
          <CardImage uri="" width={300} height={300} />
        </div>
      </div>
    </div>
  )
}

export default ChannelCard
